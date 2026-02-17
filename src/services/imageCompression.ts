/**
 * 이미지 압축 서비스
 * 원본은 사용자 기기에 저장하고, 서버에는 압축본만 업로드
 */

import imageCompression from 'browser-image-compression';
import { FILE_UPLOAD } from '@/src/constants';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  fileType?: string;
}

/**
 * 이미지 압축
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const defaultOptions = {
    maxSizeMB: FILE_UPLOAD.MAX_COMPRESSED_SIZE / (1024 * 1024),
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    quality: FILE_UPLOAD.COMPRESSION_QUALITY,
    fileType: FILE_UPLOAD.OUTPUT_FORMAT,
    ...options,
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    console.log('[Compression] Original:', file.size, 'Compressed:', compressedFile.size);
    return compressedFile;
  } catch (error) {
    console.error('[Compression] Error:', error);
    throw new Error('이미지 압축에 실패했습니다.');
  }
}

/**
 * 썸네일 생성
 */
export async function createThumbnail(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.1, // 100KB
    maxWidthOrHeight: FILE_UPLOAD.THUMBNAIL_SIZE,
    quality: 0.7,
  });
}

/**
 * 이미지 크기 조정 (Canvas API 사용)
 */
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // 비율 유지하면서 크기 조정
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        // Canvas에 그리기
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          FILE_UPLOAD.OUTPUT_FORMAT,
          FILE_UPLOAD.COMPRESSION_QUALITY
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * 파일 유효성 검사
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 파일 크기 체크
  if (file.size > FILE_UPLOAD.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. (최대 ${FILE_UPLOAD.MAX_FILE_SIZE / (1024 * 1024)}MB)`,
    };
  }

  // 파일 타입 체크
  if (!FILE_UPLOAD.ACCEPTED_FORMATS.includes(file.type as any)) {
    return {
      valid: false,
      error: '지원하지 않는 파일 형식입니다. (JPG, PNG, WebP만 가능)',
    };
  }

  return { valid: true };
}
