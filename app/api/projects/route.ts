import { NextRequest, NextResponse } from 'next/server';
import { db, projects } from '@/src/db';
import { desc } from 'drizzle-orm';

/**
 * GET /api/projects - 프로젝트 목록 조회
 * DB에서 프로젝트 목록을 가져옵니다. 데이터가 없으면 빈 배열을 반환합니다.
 */
export async function GET() {
  try {
    // DB에서 프로젝트 조회
    const items = await db.select().from(projects).orderBy(desc(projects.createdAt));

    console.log(`[API] GET /api/projects - Found ${items.length} projects`);

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    console.error('[API] GET /api/projects error:', error);

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
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects - 프로젝트 생성
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const created = await db.insert(projects).values(data).returning();

    return NextResponse.json({
      success: true,
      data: created[0],
      message: 'Project created successfully',
    });
  } catch (error) {
    console.error('[API] POST /api/projects error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
