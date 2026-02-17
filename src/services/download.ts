/**
 * Download Service
 * PC에서 보정이 적용된 최종 이미지 다운로드
 */

import { applyAllAdjustments } from './imageAdjustment';
import type { AdjustmentsFormData } from '@/src/lib/validation';

export interface DownloadOptions {
  photoId: string;
  imageUrl: string;
  fileName: string;
  adjustments?: AdjustmentsFormData;
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
}

/**
 * 보정이 적용된 이미지 다운로드
 */
export async function downloadPhoto(options: DownloadOptions): Promise<void> {
  const {
    imageUrl,
    fileName,
    adjustments,
    format = 'jpeg',
    quality = 0.95,
  } = options;

  try {
    let dataUrl: string;

    // 보정이 있으면 적용, 없으면 원본 사용
    if (adjustments && hasAdjustments(adjustments)) {
      dataUrl = await applyAllAdjustments(imageUrl, adjustments);
    } else {
      // 원본 이미지를 Data URL로 변환
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      dataUrl = await blobToDataUrl(blob);
    }

    // Data URL을 Blob으로 변환
    const blob = await dataUrlToBlob(dataUrl, `image/${format}`, quality);

    // 다운로드 트리거
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[Download] Failed to download photo:', error);
    throw new Error('다운로드에 실패했습니다.');
  }
}

/**
 * 여러 사진 일괄 다운로드 (ZIP)
 */
export async function downloadMultiplePhotos(photos: DownloadOptions[]): Promise<void> {
  // TODO: JSZip 라이브러리를 사용하여 ZIP 파일 생성
  // 현재는 개별 다운로드로 대체
  for (const photo of photos) {
    await downloadPhoto(photo);
    // 브라우저 다운로드 제한을 피하기 위한 딜레이
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

/**
 * 보정이 적용되었는지 확인
 */
function hasAdjustments(adjustments: AdjustmentsFormData): boolean {
  if (!adjustments) return false;

  const { whiteBalance, exposure, contrast, saturation, sharpness } = adjustments;

  return (
    (whiteBalance?.temperature !== 0 || whiteBalance?.tint !== 0) ||
    exposure !== 0 ||
    contrast !== 0 ||
    saturation !== 0 ||
    (sharpness !== undefined && sharpness > 0)
  );
}

/**
 * Blob을 Data URL로 변환
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Data URL을 Blob으로 변환
 */
async function dataUrlToBlob(
  dataUrl: string,
  mimeType: string,
  quality: number
): Promise<Blob> {
  // Data URL을 Canvas로 변환
  const img = new Image();
  img.src = dataUrl;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(img, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * 다운로드 진행 상태 추적 (선택적)
 */
export class DownloadProgress {
  private total: number;
  private completed: number = 0;
  private onProgress: (progress: number) => void;

  constructor(total: number, onProgress: (progress: number) => void) {
    this.total = total;
    this.onProgress = onProgress;
  }

  increment() {
    this.completed++;
    this.onProgress((this.completed / this.total) * 100);
  }

  get progress() {
    return (this.completed / this.total) * 100;
  }
}
