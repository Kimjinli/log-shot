import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { photos } from '@/src/db/schema';
import { inArray, sql } from 'drizzle-orm';

/**
 * 여러 사진 일괄 수정 API
 * POST /api/photos/batch-update
 *
 * Body: {
 *   photoIds: string[];
 *   updates: {
 *     projectId?: string | null;
 *     tags?: { mode: 'add' | 'replace', values: string[] };
 *     watermark?: { text, opacity, size, position };
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { photoIds, updates } = await request.json();

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'photoIds 배열이 필요합니다' },
        { status: 400 }
      );
    }

    console.log(`[BATCH UPDATE] ${photoIds.length}개 사진 일괄 수정 시작`);
    console.log('[BATCH UPDATE] Updates:', JSON.stringify(updates, null, 2));

    // 현재 사진들 조회
    const photosToUpdate = await db.query.photos.findMany({
      where: inArray(photos.id, photoIds),
    });

    if (photosToUpdate.length === 0) {
      return NextResponse.json(
        { success: false, error: '수정할 사진을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 각 사진별로 업데이트
    let updatedCount = 0;
    for (const photo of photosToUpdate) {
      const updateData: any = {};

      // 프로젝트 변경
      if ('projectId' in updates) {
        updateData.projectId = updates.projectId;
      }

      // 태그 처리
      if (updates.tags) {
        if (updates.tags.mode === 'replace') {
          updateData.tags = updates.tags.values;
        } else if (updates.tags.mode === 'add') {
          const existingTags = Array.isArray(photo.tags) ? photo.tags : [];
          const newTags = [...new Set([...existingTags, ...updates.tags.values])];
          updateData.tags = newTags;
        }
      }

      // 워터마크 설정
      if (updates.watermark) {
        const existingAdjustments = photo.adjustments ?
          (typeof photo.adjustments === 'string' ? JSON.parse(photo.adjustments) : photo.adjustments) : {};

        updateData.adjustments = {
          ...existingAdjustments,
          watermark: updates.watermark,
        };
      }

      // 업데이트 날짜
      updateData.updatedAt = new Date();

      // DB 업데이트
      await db
        .update(photos)
        .set(updateData)
        .where(sql`${photos.id} = ${photo.id}`);

      updatedCount++;
    }

    console.log(`[BATCH UPDATE] 완료: ${updatedCount}개 사진 수정`);

    return NextResponse.json({
      success: true,
      message: `${updatedCount}개의 사진이 수정되었습니다`,
      data: {
        updatedCount,
      },
    });
  } catch (error) {
    console.error('[BATCH UPDATE] 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '일괄 수정 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
