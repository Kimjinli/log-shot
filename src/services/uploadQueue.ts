/**
 * Upload Queue Service
 * 네트워크 상태 감지 및 자동 업로드 재시도
 */

import { indexedDBService } from './indexedDB';
import { INDEXED_DB } from '@/src/constants';

class UploadQueueService {
  private isProcessing = false;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * 업로드 대기열 처리 시작
   */
  async startProcessing() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    await this.processQueue();

    // 네트워크 상태 변경 감지
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * 업로드 대기열 처리 중지
   */
  stopProcessing() {
    this.isProcessing = false;
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    // 모든 재시도 타이머 취소
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }

  /**
   * 온라인 상태로 변경 시
   */
  private handleOnline = async () => {
    console.log('[UploadQueue] Network online - processing queue');
    await this.processQueue();
  };

  /**
   * 오프라인 상태로 변경 시
   */
  private handleOffline = () => {
    console.log('[UploadQueue] Network offline - pausing queue');
    this.isProcessing = false;
  };

  /**
   * 대기열 처리
   */
  private async processQueue() {
    if (!this.isProcessing || !navigator.onLine) return;

    try {
      const pendingItems = await indexedDBService.getPendingUploads();

      for (const item of pendingItems) {
        if (!this.isProcessing) break;

        await this.uploadItem(item.id, item.photoId);
      }
    } catch (error) {
      console.error('[UploadQueue] Error processing queue:', error);
    }
  }

  /**
   * 개별 아이템 업로드
   */
  private async uploadItem(queueId: string, photoId: string) {
    try {
      // 상태를 'uploading'으로 변경
      await indexedDBService.updateQueueItem(queueId, { status: 'uploading' });

      // IndexedDB에서 사진 데이터 가져오기
      const photoData = await indexedDBService.getPhoto(photoId);
      if (!photoData) {
        throw new Error('Photo not found in IndexedDB');
      }

      // FormData 생성
      const formData = new FormData();
      formData.append('file', photoData.file, photoData.metadata.fileName);
      formData.append('metadata', JSON.stringify(photoData.metadata));

      // 서버로 업로드
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      // 성공 시 상태 업데이트
      await indexedDBService.updateQueueItem(queueId, { status: 'success' });

      console.log('[UploadQueue] Upload success:', result);

      // 성공한 항목 정리 (선택적)
      setTimeout(() => {
        indexedDBService.deletePhoto(photoId);
        indexedDBService.deleteQueueItem(queueId);
      }, 5000);
    } catch (error) {
      console.error('[UploadQueue] Upload error:', error);

      const queueItem = await indexedDBService.getQueueItem(queueId);
      if (!queueItem) return;

      // 재시도 횟수 체크
      if (queueItem.retryCount < INDEXED_DB.MAX_RETRY_ATTEMPTS) {
        // 재시도 예약
        await indexedDBService.updateQueueItem(queueId, {
          status: 'pending',
          retryCount: queueItem.retryCount + 1,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        });

        // 지수 백오프 재시도
        const delay =
          INDEXED_DB.RETRY_DELAY_MS *
          Math.pow(INDEXED_DB.RETRY_BACKOFF_MULTIPLIER, queueItem.retryCount);

        const timeoutId = setTimeout(() => {
          this.uploadItem(queueId, photoId);
          this.retryTimeouts.delete(queueId);
        }, delay);

        this.retryTimeouts.set(queueId, timeoutId);
      } else {
        // 최대 재시도 횟수 초과
        await indexedDBService.updateQueueItem(queueId, {
          status: 'failed',
          lastError: error instanceof Error ? error.message : 'Max retries exceeded',
        });
      }
    }
  }

  /**
   * 새 사진을 대기열에 추가하고 즉시 업로드 시도
   */
  async enqueue(file: Blob, metadata: any): Promise<string> {
    // IndexedDB에 사진 저장
    const photoId = await indexedDBService.savePhoto(file, metadata);

    // 대기열에 추가
    const queueId = await indexedDBService.addToQueue(photoId);

    // 온라인이면 즉시 업로드 시도
    if (navigator.onLine && this.isProcessing) {
      this.uploadItem(queueId, photoId);
    }

    return queueId;
  }

  /**
   * 실패한 업로드 수동 재시도
   */
  async retryFailed() {
    const count = await indexedDBService.retryFailedUploads();
    if (count > 0 && navigator.onLine) {
      await this.processQueue();
    }
    return count;
  }

  /**
   * 대기열 상태 조회
   */
  async getStatus() {
    const [pending, uploading, success, failed] = await Promise.all([
      indexedDBService.getQueueByStatus('pending'),
      indexedDBService.getQueueByStatus('uploading'),
      indexedDBService.getQueueByStatus('success'),
      indexedDBService.getQueueByStatus('failed'),
    ]);

    return {
      pending: pending.length,
      uploading: uploading.length,
      success: success.length,
      failed: failed.length,
      isOnline: navigator.onLine,
      isProcessing: this.isProcessing,
    };
  }
}

// Singleton 인스턴스
export const uploadQueueService = new UploadQueueService();
