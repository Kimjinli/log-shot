import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { photos } from '@/src/db/schema';
import { inArray } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

/**
 * 여러 사진 일괄 삭제 API
 * POST /api/photos/batch-delete
 *
 * Body: { photoIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { photoIds } = await request.json();

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'photoIds 배열이 필요합니다' },
        { status: 400 }
      );
    }

    console.log(`[BATCH DELETE] ${photoIds.length}개 사진 삭제 시작`);

    // 1. 삭제할 사진들의 정보 조회
    const photosToDelete = await db.query.photos.findMany({
      where: inArray(photos.id, photoIds),
    });

    if (photosToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: '삭제할 사진을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 2. 파일 시스템에서 파일 삭제
    const publicDir = path.join(process.cwd(), 'public');
    let deletedFiles = 0;
    let failedFiles = 0;

    for (const photo of photosToDelete) {
      try {
        // 압축본 삭제
        if (photo.compressedUrl) {
          const compressedPath = path.join(publicDir, photo.compressedUrl);
          try {
            await fs.unlink(compressedPath);
            deletedFiles++;
          } catch (error) {
            console.warn(`[BATCH DELETE] 압축본 삭제 실패: ${compressedPath}`, error);
            failedFiles++;
          }
        }

        // 썸네일 삭제
        if (photo.thumbnailUrl) {
          const thumbnailPath = path.join(publicDir, photo.thumbnailUrl);
          try {
            await fs.unlink(thumbnailPath);
            deletedFiles++;
          } catch (error) {
            console.warn(`[BATCH DELETE] 썸네일 삭제 실패: ${thumbnailPath}`, error);
            failedFiles++;
          }
        }
      } catch (error) {
        console.error(`[BATCH DELETE] 파일 삭제 오류 (photoId: ${photo.id}):`, error);
      }
    }

    // 3. DB에서 사진 레코드 삭제 (cascade로 관련 데이터도 삭제됨)
    const result = await db.delete(photos).where(inArray(photos.id, photoIds));

    console.log(
      `[BATCH DELETE] 완료: ${photosToDelete.length}개 사진, ${deletedFiles}개 파일 삭제, ${failedFiles}개 실패`
    );

    return NextResponse.json({
      success: true,
      message: `${photosToDelete.length}개의 사진이 삭제되었습니다`,
      data: {
        deletedPhotos: photosToDelete.length,
        deletedFiles,
        failedFiles,
      },
    });
  } catch (error) {
    console.error('[BATCH DELETE] 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '일괄 삭제 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
