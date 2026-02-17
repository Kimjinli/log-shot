import { NextRequest, NextResponse } from 'next/server';
import { db, photos } from '@/src/db';
import { desc, eq, and, isNull } from 'drizzle-orm';

/**
 * GET /api/photos - 사진 목록 조회
 * DB에서 사진 목록을 가져옵니다. 프로젝트 필터링 지원.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 쿼리 조건 구성
    const conditions = [eq(photos.isDeleted, false)];

    // 프로젝트 필터
    if (projectId) {
      conditions.push(eq(photos.projectId, projectId));
    }

    // 정렬 및 페이징
    const items = await db
      .select()
      .from(photos)
      .where(and(...conditions))
      .orderBy(desc(photos.displayDate))
      .limit(limit)
      .offset(offset);

    // 총 개수 조회 (간단히 현재 페이지 기준)
    const total = items.length;
    const hasMore = items.length === limit;

    console.log(`[API] GET /api/photos - Found ${items.length} photos${projectId ? ` for project ${projectId}` : ''}`);

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        hasMore,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/photos error:', error);

    // DB 연결 문제일 가능성
    if (error instanceof Error && error.message.includes('no such table')) {
      console.error('[API] ⚠️ Database tables not found. Please run: npm run db:migrate');
      return NextResponse.json(
        {
          success: false,
          error: 'Database not initialized. Please run migrations.',
          hint: 'Run: npm run db:migrate'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}
