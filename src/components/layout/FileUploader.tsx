'use client';

import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Loading } from '@/src/components/common';
import { extractExifData, parseExifDate } from '@/src/services/exif';
import { compressImage } from '@/src/services/imageCompression';
import { applyWatermark } from '@/src/services/watermark';
import { useToast } from '@/src/hooks/useToast';
import { SUCCESS_MESSAGES, QUERY_CONFIG } from '@/src/constants';
import styles from './FileUploader.module.scss';

interface FileUploaderProps {
  isMobile?: boolean;
}

interface PhotoToUpload {
  id: string;
  file: File;
  preview: string;
  exifData: any;
  capturedAt: Date;
  watermarkEnabled: boolean;
  watermarkText?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ isMobile = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoToUpload[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const toast = useToast();
  const queryClient = useQueryClient();

  /**
   * 파일 선택 처리
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);

    try {
      const newPhotos: PhotoToUpload[] = [];

      for (const file of files) {
        // EXIF 데이터 추출
        const exifData = await extractExifData(file);
        const capturedAt = exifData.dateTime
          ? parseExifDate(exifData.dateTime) || new Date()
          : new Date();

        // 미리보기 URL 생성
        const preview = URL.createObjectURL(file);

        newPhotos.push({
          id: crypto.randomUUID(),
          file,
          preview,
          exifData,
          capturedAt,
          watermarkEnabled: watermarkEnabled,
          watermarkText: `${capturedAt.toLocaleDateString('ko-KR')} ${capturedAt.toLocaleTimeString('ko-KR')}`,
        });
      }

      setPhotos((prev) => [...prev, ...newPhotos]);
      toast.success(`${files.length}개 파일 추가됨`);
    } catch (error) {
      console.error('[FileUploader] Error:', error);
      toast.error('파일 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * 워터마크 토글
   */
  const toggleWatermark = (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, watermarkEnabled: !p.watermarkEnabled } : p))
    );
  };

  /**
   * 워터마크 텍스트 수정
   */
  const updateWatermarkText = (id: string, text: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, watermarkText: text } : p)));
  };

  /**
   * 사진 제거
   */
  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  /**
   * 전체 업로드
   */
  const handleUploadAll = async () => {
    if (photos.length === 0) return;

    setIsProcessing(true);
    setUploadProgress({ current: 0, total: photos.length });

    try {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setUploadProgress({ current: i + 1, total: photos.length });

        let fileToUpload = photo.file;

        // 워터마크가 활성화된 경우
        if (photo.watermarkEnabled && photo.watermarkText) {
          const watermarkedBlob = await applyWatermark(photo.file, {
            text: photo.watermarkText,
            position: 'bottom-right',
            fontSize: 24,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.6)',
          });
          fileToUpload = new File([watermarkedBlob], photo.file.name, { type: photo.file.type });
        }

        // 압축
        const compressedFile = await compressImage(fileToUpload);

        // FormData 생성
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append(
          'metadata',
          JSON.stringify({
            exifData: photo.exifData,
            capturedAt: photo.capturedAt.toISOString(),
            tags: [],
          })
        );

        // 업로드
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${photo.file.name}`);
        }
      }

      toast.success(SUCCESS_MESSAGES.PHOTO_UPLOADED);
      setPhotos([]);
      setUploadProgress({ current: 0, total: 0 });

      // React Query 데이터 갱신 (기존 캐시 유지하면서)
      setTimeout(async () => {
        await queryClient.invalidateQueries({
          queryKey: [QUERY_CONFIG.KEYS.PHOTOS],
          refetchType: 'active'
        });
      }, 300);
    } catch (error) {
      console.error('[FileUploader] Upload error:', error);
      toast.error('업로드 중 오류가 발생했습니다.');
      setUploadProgress({ current: 0, total: 0 });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isMobile) {
    return (
      <div className={styles.mobileContainer}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          📷 사진 선택
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={handleFileSelect}
          className={styles.hiddenInput}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>파일 업로드</h2>
        <div className={styles.headerActions}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={watermarkEnabled}
              onChange={(e) => setWatermarkEnabled(e.target.checked)}
            />
            <span>워터마크 자동 적용</span>
          </label>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            파일 선택
          </Button>
          {photos.length > 0 && (
            <Button variant="primary" onClick={handleUploadAll} loading={isProcessing}>
              {photos.length}개 업로드
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className={styles.hiddenInput}
      />

      {isProcessing && uploadProgress.total > 0 && (
        <div className={styles.uploadProgress}>
          <Loading text={`업로드 중... (${uploadProgress.current}/${uploadProgress.total})`} />
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {isProcessing && uploadProgress.total === 0 && <Loading text="처리 중..." />}

      {photos.length > 0 && (
        <div className={styles.photoList}>
          {photos.map((photo) => (
            <div key={photo.id} className={styles.photoItem}>
              <img src={photo.preview} alt={photo.file.name} className={styles.thumbnail} />

              <div className={styles.photoInfo}>
                <p className={styles.fileName}>{photo.file.name}</p>
                <p className={styles.fileSize}>
                  {(photo.file.size / 1024 / 1024).toFixed(2)} MB
                </p>

                <label className={styles.watermarkToggle}>
                  <input
                    type="checkbox"
                    checked={photo.watermarkEnabled}
                    onChange={() => toggleWatermark(photo.id)}
                  />
                  <span>워터마크</span>
                </label>

                {photo.watermarkEnabled && (
                  <input
                    type="text"
                    value={photo.watermarkText}
                    onChange={(e) => updateWatermarkText(photo.id, e.target.value)}
                    placeholder="워터마크 텍스트"
                    className={styles.watermarkInput}
                  />
                )}
              </div>

              <button onClick={() => removePhoto(photo.id)} className={styles.removeButton}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && !isProcessing && (
        <div className={styles.empty}>
          <p>파일을 선택하거나 여기에 드래그하세요</p>
        </div>
      )}
    </div>
  );
};
