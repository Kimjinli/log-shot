'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Button, Toast, Loading } from '@/src/components/common';
import { extractExifData, parseExifDate } from '@/src/services/exif';
import { compressImage, validateImageFile } from '@/src/services/imageCompression';
import { uploadQueueService } from '@/src/services/uploadQueue';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/src/constants';
import styles from './CameraCapture.module.scss';

export interface CameraCaptureProps {
  projectId?: string;
  onCaptureSuccess?: (photoId: string) => void;
  onCaptureError?: (error: Error) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  projectId,
  onCaptureSuccess,
  onCaptureError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  /**
   * 카메라 시작
   */
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // 후면 카메라 우선
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('[Camera] Error starting camera:', error);
      setToast({ message: ERROR_MESSAGES.CAMERA_PERMISSION_DENIED, type: 'error' });
      onCaptureError?.(error as Error);
    }
  }, [onCaptureError]);

  /**
   * 카메라 중지
   */
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  /**
   * 사진 촬영 (비디오 스트림에서 캡처)
   */
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      await processPhoto(file);
      stopCamera();
    }, 'image/jpeg', 0.95);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopCamera]);

  /**
   * 파일 선택 (갤러리에서 선택)
   */
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      await processPhoto(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /**
   * 사진 처리 (핵심 로직)
   * 1. 기기 갤러리에 원본 저장
   * 2. EXIF 데이터 추출
   * 3. 서버 업로드용 압축
   * 4. IndexedDB 저장 및 업로드 큐 추가
   */
  const processPhoto = useCallback(
    async (file: File) => {
      setIsProcessing(true);

      try {
        // 1. 파일 유효성 검사
        const validation = validateImageFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // 2. 병렬 처리: [기기 저장] + [EXIF 추출 + 압축]
        const [saveResult, exifData, compressedFile] = await Promise.allSettled([
          // 2-1. 기기 갤러리에 원본 저장
          saveToDevice(file),
          // 2-2. EXIF 데이터 추출
          extractExifData(file),
          // 2-3. 서버 업로드용 압축
          compressImage(file),
        ]);

        // 기기 저장 실패는 경고만 하고 계속 진행
        if (saveResult.status === 'rejected') {
          console.warn('[Camera] Failed to save to device:', saveResult.reason);
        }

        // EXIF 추출 실패 시 빈 객체 사용
        const exif = exifData.status === 'fulfilled' ? exifData.value : {};

        // 압축 실패 시 에러
        if (compressedFile.status === 'rejected') {
          throw new Error(ERROR_MESSAGES.COMPRESSION_FAILED);
        }

        // 3. 메타데이터 생성
        const capturedAt = exif.dateTime
          ? parseExifDate(exif.dateTime) || new Date()
          : new Date();

        const metadata = {
          fileName: file.name,
          capturedAt: capturedAt.toISOString(),
          exifData: exif,
          projectId,
          tags: [],
        };

        // 4. IndexedDB에 저장 및 업로드 큐 추가
        const queueId = await uploadQueueService.enqueue(compressedFile.value, metadata);

        // 5. 성공 알림
        setToast({ message: SUCCESS_MESSAGES.PHOTO_UPLOADED, type: 'success' });
        onCaptureSuccess?.(queueId);
      } catch (error) {
        console.error('[Camera] Error processing photo:', error);
        const errorMessage =
          error instanceof Error ? error.message : ERROR_MESSAGES.UPLOAD_FAILED;
        setToast({ message: errorMessage, type: 'error' });
        onCaptureError?.(error as Error);
      } finally {
        setIsProcessing(false);
      }
    },
    [projectId, onCaptureSuccess, onCaptureError]
  );

  /**
   * 기기 갤러리에 원본 저장
   * Web Share API 또는 다운로드 링크 사용
   */
  const saveToDevice = async (file: File): Promise<void> => {
    try {
      // Web Share API 지원 여부 체크
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '사진 저장',
          text: 'Log-Shot에서 촬영한 사진',
        });
        return;
      }

      // Share API 미지원 시 다운로드
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      // 사용자가 취소한 경우는 에러로 처리하지 않음
      if ((error as Error).name !== 'AbortError') {
        throw error;
      }
    }
  };

  return (
    <div className={styles.container}>
      {isCameraActive ? (
        // 카메라 뷰
        <div className={styles.cameraView}>
          <video ref={videoRef} autoPlay playsInline className={styles.video} />

          <div className={styles.controls}>
            <Button variant="outline" onClick={stopCamera}>
              취소
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={capturePhoto}
              disabled={isProcessing}
              className={styles.captureButton}
            >
              {isProcessing ? '처리 중...' : '촬영'}
            </Button>
          </div>
        </div>
      ) : (
        // 카메라 시작 버튼
        <div className={styles.buttonGroup}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={startCamera}
            disabled={isProcessing}
          >
            카메라 열기
          </Button>

          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            갤러리에서 선택
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className={styles.hiddenInput}
            capture="environment"
          />
        </div>
      )}

      {isProcessing && <Loading fullScreen text="사진을 처리하는 중..." />}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
