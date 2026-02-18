import { NextRequest, NextResponse } from 'next/server';
import { db, photos } from '@/src/db';
import { inArray } from 'drizzle-orm';
import archiver from 'archiver';
import { existsSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';
import sharp from 'sharp';

/**
 * 선택된 사진 다운로드 API
 * - 프로젝트/태그별 디렉토리 구조 생성
 * - 워터마크 적용 (adjustments에 watermark 정보가 있는 경우)
 *
 * POST /api/download
 * Body: { photoIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { photoIds } = await request.json();

    if (!photoIds || photoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No photos selected' },
        { status: 400 }
      );
    }

    console.log(`[DOWNLOAD] ${photoIds.length}개 사진 다운로드 시작`);

    const selectedPhotos = await db.query.photos.findMany({
      where: inArray(photos.id, photoIds),
      with: { project: true },
    });

    if (selectedPhotos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No photos found' },
        { status: 404 }
      );
    }

    const archive = archiver('zip', { zlib: { level: 6 } }); // 압축 레벨 낮춤 (속도 개선)
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);

    // 각 사진 처리
    for (const photo of selectedPhotos) {
      try {
        // 디렉토리 구조: 프로젝트명/태그명/파일명
        let dirPath = '';
        if (photo.project) {
          dirPath = photo.project.name.replace(/[^a-zA-Z0-9가-힣\s]/g, '_');
        } else {
          dirPath = 'No_Project';
        }

        if (photo.tags && Array.isArray(photo.tags) && photo.tags.length > 0) {
          const tagsStr = photo.tags.join('_').replace(/[^a-zA-Z0-9가-힣\s_]/g, '_');
          dirPath += `/${tagsStr}`;
        } else {
          dirPath += '/No_Tags';
        }

        const filePath = join(process.cwd(), 'public', photo.compressedUrl);
        if (!existsSync(filePath)) {
          console.warn(`[DOWNLOAD] 파일 없음: ${filePath}`);
          continue;
        }

        // 워터마크 또는 조정사항 적용이 필요한 경우
        const adjustments = photo.adjustments as any;
        if (adjustments?.watermark) {
          console.log(`[DOWNLOAD] 워터마크 적용: ${photo.originalFileName}`);

          // Sharp를 사용하여 워터마크 적용
          let image = sharp(filePath);

          // 워터마크 텍스트를 SVG로 변환
          const watermarkText = adjustments.watermark.text || 'Log-Shot';
          const watermarkOpacity = adjustments.watermark.opacity || 0.3;
          const watermarkSize = adjustments.watermark.size || 40;

          const svgText = `
            <svg width="500" height="100">
              <text x="10" y="50" font-family="Arial" font-size="${watermarkSize}" fill="white" fill-opacity="${watermarkOpacity}">
                ${watermarkText}
              </text>
            </svg>
          `;

          const watermarkBuffer = Buffer.from(svgText);

          // 워터마크 합성
          image = image.composite([
            {
              input: watermarkBuffer,
              gravity: adjustments.watermark.position || 'southeast',
            },
          ]);

          // 버퍼로 변환하여 아카이브에 추가
          const processedBuffer = await image.toBuffer();
          archive.append(processedBuffer, { name: `${dirPath}/${photo.originalFileName}` });
        } else {
          // 워터마크 없이 원본 추가
          archive.file(filePath, { name: `${dirPath}/${photo.originalFileName}` });
        }
      } catch (error) {
        console.error(`[DOWNLOAD] 파일 처리 오류 (${photo.originalFileName}):`, error);
      }
    }

    // 아카이브 완료
    await archive.finalize();

    console.log(`[DOWNLOAD] 완료: ${selectedPhotos.length}개 파일`);

    const stream = Readable.from(archive as any);

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="log-shot-${timestamp}.zip"`,
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('[DOWNLOAD] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to download photos',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
