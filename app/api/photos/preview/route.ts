import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { photos } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { existsSync } from 'fs';
import { join } from 'path';
import { readFile } from 'fs/promises';

// 동적 라우트로 설정 (standalone 빌드 지원)
export const dynamic = 'force-dynamic';

/**
 * 사진 미리보기 API (워터마크 적용)
 * GET /api/photos/preview?id=photoId
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const photoId = searchParams.get('id');

    if (!photoId) {
      return NextResponse.json(
        { success: false, error: 'photoId가 필요합니다' },
        { status: 400 }
      );
    }

    // 사진 정보 조회
    const photo = await db.query.photos.findFirst({
      where: eq(photos.id, photoId),
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, error: '사진을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 파일 경로
    const filePath = join(process.cwd(), 'public', photo.compressedUrl);
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: '파일을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 이미지 읽기
    const imageBuffer = await readFile(filePath);
    let processedImage = sharp(imageBuffer);

    // adjustments 적용
    const adjustments = photo.adjustments as any;

    // 워터마크 적용
    if (adjustments?.watermark) {
      const { text, opacity, size, position } = adjustments.watermark;

      const svgWatermark = `
        <svg width="800" height="200">
          <text
            x="20"
            y="100"
            font-family="Arial, sans-serif"
            font-size="${size || 40}"
            fill="white"
            fill-opacity="${opacity || 0.3}"
            font-weight="bold"
          >
            ${text || 'Log-Shot'}
          </text>
        </svg>
      `;

      const watermarkBuffer = Buffer.from(svgWatermark);

      processedImage = processedImage.composite([
        {
          input: watermarkBuffer,
          gravity: position || 'southeast',
        },
      ]);
    }

    // 화이트밸런스 적용 (간단한 색온도 조정)
    if (adjustments?.whiteBalance) {
      const { temperature, tint } = adjustments.whiteBalance;

      // 색온도를 RGB 조정으로 변환 (간단한 근사)
      const tempFactor = temperature / 100;
      const tintFactor = tint / 100;

      if (tempFactor !== 0 || tintFactor !== 0) {
        processedImage = processedImage.modulate({
          brightness: 1,
          saturation: 1 + (tintFactor * 0.3),
        });
      }
    }

    // 이미지를 버퍼로 변환
    const outputBuffer = await processedImage.jpeg({ quality: 90 }).toBuffer();

    // 응답 반환 (Buffer를 Uint8Array로 변환)
    return new Response(new Uint8Array(outputBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[PREVIEW] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '미리보기 생성 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
