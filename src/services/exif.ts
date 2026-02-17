/**
 * EXIF 데이터 추출 서비스
 * 촬영 직후 EXIF 데이터를 추출하여 DB에 저장
 */

import EXIF from 'exif-js';
import type { ExifData } from '@/src/lib/validation';

/**
 * 이미지 파일에서 EXIF 데이터 추출
 */
export async function extractExifData(file: File): Promise<ExifData> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        EXIF.getData(img as any, function (this: any) {
          const exifData: ExifData = {
            dateTime: EXIF.getTag(this, 'DateTime') || EXIF.getTag(this, 'DateTimeOriginal'),
            camera: `${EXIF.getTag(this, 'Make') || ''} ${EXIF.getTag(this, 'Model') || ''}`.trim(),
            lens: EXIF.getTag(this, 'LensModel'),
            iso: EXIF.getTag(this, 'ISOSpeedRatings'),
            aperture: formatAperture(EXIF.getTag(this, 'FNumber')),
            shutterSpeed: formatShutterSpeed(EXIF.getTag(this, 'ExposureTime')),
            focalLength: formatFocalLength(EXIF.getTag(this, 'FocalLength')),
            orientation: EXIF.getTag(this, 'Orientation'),
            width: EXIF.getTag(this, 'PixelXDimension'),
            height: EXIF.getTag(this, 'PixelYDimension'),
          };

          // GPS 데이터 추출
          const lat = EXIF.getTag(this, 'GPSLatitude');
          const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
          const lon = EXIF.getTag(this, 'GPSLongitude');
          const lonRef = EXIF.getTag(this, 'GPSLongitudeRef');
          const alt = EXIF.getTag(this, 'GPSAltitude');

          if (lat && lon) {
            exifData.location = {
              latitude: convertDMSToDD(lat, latRef),
              longitude: convertDMSToDD(lon, lonRef),
              altitude: alt,
            };
          }

          resolve(exifData);
        });
      };

      img.onerror = () => {
        resolve({}); // EXIF 읽기 실패 시 빈 객체 반환
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve({}); // 파일 읽기 실패 시 빈 객체 반환
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 조리개 값 포맷팅
 */
function formatAperture(value: any): string | undefined {
  if (!value) return undefined;
  return `f/${value}`;
}

/**
 * 셔터 스피드 포맷팅
 */
function formatShutterSpeed(value: any): string | undefined {
  if (!value) return undefined;
  if (value < 1) {
    return `1/${Math.round(1 / value)}`;
  }
  return `${value}s`;
}

/**
 * 초점 거리 포맷팅
 */
function formatFocalLength(value: any): string | undefined {
  if (!value) return undefined;
  return `${value}mm`;
}

/**
 * DMS(도분초) 좌표를 DD(십진법) 좌표로 변환
 */
function convertDMSToDD(dms: number[], ref: string): number {
  const [degrees, minutes, seconds] = dms;
  let dd = degrees + minutes / 60 + seconds / 3600;

  if (ref === 'S' || ref === 'W') {
    dd = dd * -1;
  }

  return dd;
}

/**
 * EXIF 날짜를 ISO 8601 형식으로 변환
 */
export function parseExifDate(exifDate: string): Date | null {
  if (!exifDate) return null;

  // EXIF 날짜 형식: "YYYY:MM:DD HH:MM:SS"
  const [datePart, timePart] = exifDate.split(' ');
  const [year, month, day] = datePart.split(':');
  const [hour, minute, second] = timePart?.split(':') || ['00', '00', '00'];

  try {
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
  } catch {
    return null;
  }
}
