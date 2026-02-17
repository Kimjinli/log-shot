import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { projects, photos, editHistory, savedFiles, uploadQueue } from '@/src/db/schema';
import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

/**
 * 모든 데이터 초기화 API
 * - DB의 모든 테이블 truncate
 * - 업로드된 파일 및 썸네일 삭제
 *
 * POST /api/reset
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[RESET] 초기화 시작...');

    // 1. DB 테이블 데이터 삭제 (순서 중요: 외래키 제약조건 고려)
    await db.delete(savedFiles);
    console.log('[RESET] savedFiles 테이블 삭제 완료');

    await db.delete(editHistory);
    console.log('[RESET] editHistory 테이블 삭제 완료');

    await db.delete(uploadQueue);
    console.log('[RESET] uploadQueue 테이블 삭제 완료');

    await db.delete(photos);
    console.log('[RESET] photos 테이블 삭제 완료');

    await db.delete(projects);
    console.log('[RESET] projects 테이블 삭제 완료');

    // 2. 파일 시스템 정리
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    const thumbnailsDir = path.join(publicDir, 'thumbnails');

    // uploads 디렉토리 비우기
    try {
      const uploadFiles = await fs.readdir(uploadsDir);
      for (const file of uploadFiles) {
        if (file !== '.gitkeep') {
          await fs.unlink(path.join(uploadsDir, file));
        }
      }
      console.log(`[RESET] uploads 디렉토리 정리 완료 (${uploadFiles.length}개 파일 삭제)`);
    } catch (error) {
      console.warn('[RESET] uploads 디렉토리 정리 실패:', error);
    }

    // thumbnails 디렉토리 비우기
    try {
      const thumbnailFiles = await fs.readdir(thumbnailsDir);
      for (const file of thumbnailFiles) {
        if (file !== '.gitkeep') {
          await fs.unlink(path.join(thumbnailsDir, file));
        }
      }
      console.log(`[RESET] thumbnails 디렉토리 정리 완료 (${thumbnailFiles.length}개 파일 삭제)`);
    } catch (error) {
      console.warn('[RESET] thumbnails 디렉토리 정리 실패:', error);
    }

    console.log('[RESET] 초기화 완료');

    return NextResponse.json({
      success: true,
      message: '모든 데이터가 초기화되었습니다.',
      data: {
        deletedTables: ['projects', 'photos', 'editHistory', 'savedFiles', 'uploadQueue'],
        clearedDirectories: ['uploads', 'thumbnails'],
      },
    });
  } catch (error) {
    console.error('[RESET] 초기화 중 오류 발생:', error);

    return NextResponse.json(
      {
        success: false,
        error: '초기화 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET 요청 차단 (안전장치)
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'POST 메서드만 허용됩니다.',
    },
    { status: 405 }
  );
}
