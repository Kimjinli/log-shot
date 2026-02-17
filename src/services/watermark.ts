/**
 * Watermark Service
 * Canvas API를 사용하여 이미지에 날짜/시간 워터마크 추가
 */

export interface WatermarkOptions {
  text: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  padding?: number;
  opacity?: number;
}

/**
 * 이미지에 워터마크 적용
 */
export async function applyWatermark(
  file: File,
  options: WatermarkOptions
): Promise<Blob> {
  const {
    text,
    position = 'bottom-right',
    fontSize = 24,
    fontFamily = 'Arial, sans-serif',
    color = '#ffffff',
    backgroundColor = 'rgba(0, 0, 0, 0.6)',
    padding = 12,
    opacity = 1,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Canvas 생성
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // 원본 이미지 그리기
        ctx.drawImage(img, 0, 0);

        // 워터마크 설정
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.globalAlpha = opacity;

        // 텍스트 크기 측정
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = fontSize;

        // 배경 크기
        const bgWidth = textWidth + padding * 2;
        const bgHeight = textHeight + padding * 2;

        // 위치 계산
        let x = 0;
        let y = 0;

        switch (position) {
          case 'top-left':
            x = padding;
            y = padding;
            break;
          case 'top-right':
            x = canvas.width - bgWidth - padding;
            y = padding;
            break;
          case 'bottom-left':
            x = padding;
            y = canvas.height - bgHeight - padding;
            break;
          case 'bottom-right':
            x = canvas.width - bgWidth - padding;
            y = canvas.height - bgHeight - padding;
            break;
          case 'center':
            x = (canvas.width - bgWidth) / 2;
            y = (canvas.height - bgHeight) / 2;
            break;
        }

        // 배경 그리기
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(x, y, bgWidth, bgHeight);

        // 텍스트 그리기
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';
        ctx.fillText(text, x + padding, y + padding);

        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (blob) {
              ctx.globalAlpha = 1; // 원래대로
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          file.type || 'image/jpeg',
          0.95
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
 * 여러 이미지에 워터마크 일괄 적용
 */
export async function applyWatermarkBatch(
  files: File[],
  options: WatermarkOptions,
  onProgress?: (current: number, total: number) => void
): Promise<Blob[]> {
  const results: Blob[] = [];

  for (let i = 0; i < files.length; i++) {
    const blob = await applyWatermark(files[i], options);
    results.push(blob);

    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return results;
}

/**
 * EXIF 날짜를 워터마크 텍스트로 포맷팅
 */
export function formatDateForWatermark(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 커스텀 워터마크 템플릿
 */
export const WATERMARK_TEMPLATES = {
  date: (date: Date) => formatDateForWatermark(date),
  dateOnly: (date: Date) => date.toLocaleDateString('ko-KR'),
  timeOnly: (date: Date) => date.toLocaleTimeString('ko-KR'),
  dateTime: (date: Date) => `${date.toLocaleDateString('ko-KR')} ${date.toLocaleTimeString('ko-KR')}`,
  custom: (text: string) => text,
};
