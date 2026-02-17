/**
 * 이미지 보정 서비스
 * Canvas API를 사용한 픽셀 단위 이미지 조정
 * 원본은 절대 수정하지 않고, 보정 정보만 DB에 저장
 */

import { WHITE_BALANCE } from '@/src/constants';
import type { AdjustmentsFormData } from '@/src/lib/validation';

export interface WhiteBalanceAdjustment {
  temperature: number; // -100 ~ 100
  tint: number; // -100 ~ 100
}

/**
 * 이미지에 화이트밸런스 적용
 */
export async function applyWhiteBalance(
  imageUrl: string,
  adjustment: WhiteBalanceAdjustment
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 이미지 그리기
      ctx.drawImage(img, 0, 0);

      // 픽셀 데이터 가져오기
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 온도와 틴트 값을 RGB 변화량으로 변환
      const tempFactor = adjustment.temperature / 100; // -1 ~ 1
      const tintFactor = adjustment.tint / 100; // -1 ~ 1

      // 픽셀별로 조정
      for (let i = 0; i < data.length; i += 4) {
        // 온도 조정 (따뜻하게 = 빨강 증가, 파랑 감소)
        data[i] = clamp(data[i] + tempFactor * 50, 0, 255); // Red
        data[i + 2] = clamp(data[i + 2] - tempFactor * 50, 0, 255); // Blue

        // 틴트 조정 (마젠타 = 빨강+파랑 증가, 초록 감소)
        data[i] = clamp(data[i] + tintFactor * 30, 0, 255); // Red
        data[i + 1] = clamp(data[i + 1] - tintFactor * 30, 0, 255); // Green
        data[i + 2] = clamp(data[i + 2] + tintFactor * 30, 0, 255); // Blue
      }

      // 조정된 픽셀 데이터 적용
      ctx.putImageData(imageData, 0, 0);

      // Data URL로 변환
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * 모든 보정 효과 적용 (화이트밸런스, 노출, 대비 등)
 */
export async function applyAllAdjustments(
  imageUrl: string,
  adjustments: AdjustmentsFormData
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 이미지 그리기
      ctx.drawImage(img, 0, 0);

      // 픽셀 데이터 가져오기
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 보정 값 정규화
      const wb = adjustments.whiteBalance || { temperature: 0, tint: 0 };
      const tempFactor = wb.temperature / 100;
      const tintFactor = wb.tint / 100;
      const exposureFactor = (adjustments.exposure || 0) / 2; // -1 ~ 1
      const contrastFactor = (adjustments.contrast || 0) / 100; // -1 ~ 1
      const saturationFactor = (adjustments.saturation || 0) / 100; // -1 ~ 1

      // 픽셀별로 보정 적용
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // 1. 화이트밸런스
        if (wb.temperature !== 0 || wb.tint !== 0) {
          r = clamp(r + tempFactor * 50 + tintFactor * 30, 0, 255);
          g = clamp(g - tintFactor * 30, 0, 255);
          b = clamp(b - tempFactor * 50 + tintFactor * 30, 0, 255);
        }

        // 2. 노출
        if (adjustments.exposure !== 0) {
          const exposureAmount = exposureFactor * 100;
          r = clamp(r + exposureAmount, 0, 255);
          g = clamp(g + exposureAmount, 0, 255);
          b = clamp(b + exposureAmount, 0, 255);
        }

        // 3. 대비
        if (adjustments.contrast !== 0) {
          const factor = (259 * (contrastFactor * 255 + 255)) / (255 * (259 - contrastFactor * 255));
          r = clamp(factor * (r - 128) + 128, 0, 255);
          g = clamp(factor * (g - 128) + 128, 0, 255);
          b = clamp(factor * (b - 128) + 128, 0, 255);
        }

        // 4. 채도
        if (adjustments.saturation !== 0) {
          const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
          r = clamp(gray + (r - gray) * (1 + saturationFactor), 0, 255);
          g = clamp(gray + (g - gray) * (1 + saturationFactor), 0, 255);
          b = clamp(gray + (b - gray) * (1 + saturationFactor), 0, 255);
        }

        // 픽셀 업데이트
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }

      // 5. 샤프니스 (선택적)
      let finalImageData = imageData;
      if (adjustments.sharpness && adjustments.sharpness > 0) {
        finalImageData = applySharpen(imageData, adjustments.sharpness / 100);
      }

      // 조정된 픽셀 데이터 적용
      ctx.putImageData(finalImageData, 0, 0);

      // Data URL로 변환
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * 샤프니스 필터 적용 (Convolution)
 */
function applySharpen(imageData: ImageData, amount: number): ImageData {
  const weights = [
    0, -1 * amount, 0,
    -1 * amount, 1 + 4 * amount, -1 * amount,
    0, -1 * amount, 0,
  ];

  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);
  const src = imageData.data;
  const sw = imageData.width;
  const sh = imageData.height;
  const w = sw;
  const h = sh;
  const output = new ImageData(w, h);
  const dst = output.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sy = y;
      const sx = x;
      const dstOff = (y * w + x) * 4;
      let r = 0, g = 0, b = 0;

      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = sy + cy - halfSide;
          const scx = sx + cx - halfSide;

          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            const srcOff = (scy * sw + scx) * 4;
            const wt = weights[cy * side + cx];
            r += src[srcOff] * wt;
            g += src[srcOff + 1] * wt;
            b += src[srcOff + 2] * wt;
          }
        }
      }

      dst[dstOff] = clamp(r, 0, 255);
      dst[dstOff + 1] = clamp(g, 0, 255);
      dst[dstOff + 2] = clamp(b, 0, 255);
      dst[dstOff + 3] = src[(sy * sw + sx) * 4 + 3]; // Alpha
    }
  }

  return output;
}

/**
 * 값을 min과 max 사이로 제한
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 보정된 이미지를 Blob으로 변환 (다운로드용)
 */
export async function adjustmentToBlob(
  imageUrl: string,
  adjustments: AdjustmentsFormData
): Promise<Blob> {
  const dataUrl = await applyAllAdjustments(imageUrl, adjustments);

  // Data URL을 Blob으로 변환
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * 자동 화이트밸런스 (그레이월드 알고리즘)
 */
export async function autoWhiteBalance(imageUrl: string): Promise<WhiteBalanceAdjustment> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // RGB 평균 계산
      let rSum = 0, gSum = 0, bSum = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
      }

      const rAvg = rSum / pixelCount;
      const gAvg = gSum / pixelCount;
      const bAvg = bSum / pixelCount;

      // 그레이 값 (이상적으로는 모든 채널이 같아야 함)
      const gray = (rAvg + gAvg + bAvg) / 3;

      // 보정 값 계산
      const temperature = clamp(((bAvg - rAvg) / gray) * 100, -100, 100);
      const tint = clamp(((gAvg - (rAvg + bAvg) / 2) / gray) * 100, -100, 100);

      resolve({ temperature, tint });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}
