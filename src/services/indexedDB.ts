/**
 * IndexedDB Service
 * 오프라인 지원 및 업로드 대기열 관리
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { INDEXED_DB } from '@/src/constants';

// IndexedDB 스키마 정의
interface LogShotDB extends DBSchema {
  photos: {
    key: string;
    value: {
      id: string;
      file: Blob;
      metadata: {
        fileName: string;
        fileSize: number;
        fileType: string;
        capturedAt: string;
        exifData?: any;
        tags?: string[];
        projectId?: string;
      };
      createdAt: string;
    };
    indexes: { 'by-date': string };
  };
  'upload-queue': {
    key: string;
    value: {
      id: string;
      photoId: string;
      status: 'pending' | 'uploading' | 'success' | 'failed';
      retryCount: number;
      lastError?: string;
      createdAt: string;
      updatedAt: string;
    };
    indexes: { 'by-status': string };
  };
}

class IndexedDBService {
  private db: IDBPDatabase<LogShotDB> | null = null;

  /**
   * IndexedDB 초기화
   */
  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<LogShotDB>(INDEXED_DB.DB_NAME, INDEXED_DB.VERSION, {
      upgrade(db) {
        // Photos store
        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
          photoStore.createIndex('by-date', 'metadata.capturedAt');
        }

        // Upload queue store
        if (!db.objectStoreNames.contains('upload-queue')) {
          const queueStore = db.createObjectStore('upload-queue', { keyPath: 'id' });
          queueStore.createIndex('by-status', 'status');
        }
      },
    });
  }

  /**
   * 사진을 IndexedDB에 저장
   */
  async savePhoto(file: Blob, metadata: any): Promise<string> {
    await this.init();
    if (!this.db) throw new Error('IndexedDB not initialized');

    const id = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const photo = {
      id,
      file,
      metadata: {
        fileName: metadata.fileName || 'untitled.jpg',
        fileSize: file.size,
        fileType: file.type,
        capturedAt: metadata.capturedAt || new Date().toISOString(),
        exifData: metadata.exifData,
        tags: metadata.tags || [],
        projectId: metadata.projectId,
      },
      createdAt: new Date().toISOString(),
    };

    await this.db.add('photos', photo);
    return id;
  }

  /**
   * 사진 가져오기
   */
  async getPhoto(id: string) {
    await this.init();
    if (!this.db) throw new Error('IndexedDB not initialized');

    return await this.db.get('photos', id);
  }

  /**
   * 모든 사진 가져오기
   */
  async getAllPhotos() {
    await this.init();
    if (!this.db) throw new Error('IndexedDB not initialized');

    return await this.db.getAll('photos');
  }

  /**
   * 사진 삭제
   */
  async deletePhoto(id: string) {
    await this.init();
    if (!this.db) throw new Error('IndexedDB not initialized');

    await this.db.delete('photos', id);
  }

  /**
   * 업로드 대기열에 추가
   */
  async addToQueue(photoId: string): Promise<string> {
    await this.init();
    if (!this.db) throw new Error('IndexedDB not initialized');

    const id = `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const queueItem = {
      id,
      photoId,
      status: 'pending' as const,
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.db.add('upload-queue', queueItem);
    return id;
  }

  /**
   * 업로드 대기열 아이템 가져오기
   */
  async getQueueItem(id: string) {
    await this.init();
    if (!this.db) throw new Error('IndexedDB not initialized');

    return await this.db.get('upload-queue', id);
  }

  /**
   * 상태별 대기열 아이템 가져오기
   */
  async getQueueByStatus(status: 'pending' | 'uploading' | 'success' | 'failed') {
    await this.init();
    if (!this.db) throw new Error('IndexedDB not initialized');

    return await this.db.getAllFromIndex('upload-queue', 'by-status', status);
  }

  /**
   * 대기열 아이템 업데이트
   */
  async updateQueueItem(
    id: string,
    updates: Partial<{
      status: 'pending' | 'uploading' | 'success' | 'failed';
      retryCount: number;
      lastError: string;
    }>
  ) {
    await this.init();
    if (!this.db) throw new Error('IndexedDB not initialized');

    const item = await this.db.get('upload-queue', id);
    if (!item) throw new Error('Queue item not found');

    const updated = {
      ...item,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.db.put('upload-queue', updated);
  }

  /**
   * 대기열 아이템 삭제
   */
  async deleteQueueItem(id: string) {
    await this.init();
    if (!this.db) throw new Error('IndexedDB not initialized');

    await this.db.delete('upload-queue', id);
  }

  /**
   * 모든 대기 중인 업로드 가져오기
   */
  async getPendingUploads() {
    return await this.getQueueByStatus('pending');
  }

  /**
   * 실패한 업로드 재시도
   */
  async retryFailedUploads() {
    const failedItems = await this.getQueueByStatus('failed');

    for (const item of failedItems) {
      if (item.retryCount < INDEXED_DB.MAX_RETRY_ATTEMPTS) {
        await this.updateQueueItem(item.id, {
          status: 'pending',
          retryCount: item.retryCount + 1,
        });
      }
    }

    return failedItems.length;
  }

  /**
   * 성공한 업로드 정리
   */
  async cleanupSuccessfulUploads() {
    const successItems = await this.getQueueByStatus('success');

    for (const item of successItems) {
      // 사진과 대기열 아이템 모두 삭제
      await this.deletePhoto(item.photoId);
      await this.deleteQueueItem(item.id);
    }

    return successItems.length;
  }

  /**
   * 저장 공간 사용량 확인
   */
  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }

    return { used: 0, quota: 0 };
  }

  /**
   * IndexedDB 완전 초기화 (주의: 모든 데이터 삭제)
   */
  async clearAll() {
    await this.init();
    if (!this.db) throw new Error('IndexedDB not initialized');

    const tx = this.db.transaction(['photos', 'upload-queue'], 'readwrite');
    await Promise.all([tx.objectStore('photos').clear(), tx.objectStore('upload-queue').clear()]);
  }
}

// Singleton 인스턴스
export const indexedDBService = new IndexedDBService();
