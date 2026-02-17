/**
 * Database Seeding Script
 * 개발용 초기 데이터 삽입
 * DB에 문제가 있거나 데이터가 없을 때만 실행
 */

import { db, projects, photos, sqlite } from './index';
import { sql } from 'drizzle-orm';

/**
 * DB 연결 및 상태 확인
 */
async function checkDatabase() {
  try {
    // DB 연결 테스트
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('[Seed] DB connection: OK');

    // 테이블 존재 여부 확인
    const tables = await db.execute(sql`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name IN ('projects', 'photos')
    `);

    if (tables.length < 2) {
      console.log('[Seed] ⚠️ Required tables not found. Please run migration first.');
      console.log('[Seed] Run: npm run db:migrate');
      return false;
    }

    // 기존 데이터 확인
    const existingProjects = await db.select().from(projects).limit(1);
    if (existingProjects.length > 0) {
      console.log('[Seed] ℹ️ Database already has data. Skipping seed.');
      console.log('[Seed] To reset database, run: npm run db:reset');
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Seed] ❌ DB connection failed:', error);
    return false;
  }
}

async function seed() {
  console.log('[Seed] Starting...');

  try {
    // DB 상태 확인
    const canSeed = await checkDatabase();
    if (!canSeed) {
      console.log('[Seed] 종료: Seed 실행 조건이 충족되지 않았습니다.');
      process.exit(0);
    }

    console.log('[Seed] Inserting initial data...');

    // 1. 프로젝트 생성
    const projectData = [
      {
        id: crypto.randomUUID(),
        name: 'Jeju Trip',
        hashtag: '#JejuTrip',
        description: '제주도 여행 사진 모음',
      },
      {
        id: crypto.randomUUID(),
        name: 'Seoul Walk',
        hashtag: '#SeoulWalk',
        description: '서울 산책',
      },
      {
        id: crypto.randomUUID(),
        name: 'Food Diary',
        hashtag: '#FoodDiary',
        description: '맛집 기록',
      },
    ];

    const insertedProjects = await db.insert(projects).values(projectData).returning();
    console.log(`[Seed] ✅ Created ${insertedProjects.length} projects`);

    // 2. 사진 생성 (일관된 이미지 ID 사용)
    const photoData = [
      {
        id: crypto.randomUUID(),
        projectId: insertedProjects[0].id,
        originalFileName: 'jeju-beach-1.jpg',
        compressedUrl: 'https://picsum.photos/id/1015/800/600', // 해변
        thumbnailUrl: 'https://picsum.photos/id/1015/200/200',
        fileSize: 1024000,
        capturedAt: new Date('2024-08-10T13:28:26Z'),
        displayDate: new Date('2024-08-10T13:28:26Z'),
        tags: JSON.stringify(['여행', '제주도', '바다']),
        exifData: JSON.stringify({
          camera: 'iPhone 15 Pro',
          iso: 100,
          aperture: 'f/1.8',
          shutterSpeed: '1/250',
        }),
      },
      {
        id: crypto.randomUUID(),
        projectId: insertedProjects[0].id,
        originalFileName: 'jeju-sunset-1.jpg',
        compressedUrl: 'https://picsum.photos/id/1018/800/600', // 일몰
        thumbnailUrl: 'https://picsum.photos/id/1018/200/200',
        fileSize: 1100000,
        capturedAt: new Date('2024-08-11T18:45:00Z'),
        displayDate: new Date('2024-08-11T18:45:00Z'),
        tags: JSON.stringify(['일몰', '제주도']),
        exifData: JSON.stringify({
          camera: 'iPhone 15 Pro',
          iso: 200,
          aperture: 'f/1.8',
          shutterSpeed: '1/500',
        }),
      },
      {
        id: crypto.randomUUID(),
        projectId: insertedProjects[0].id,
        originalFileName: 'jeju-nature-1.jpg',
        compressedUrl: 'https://picsum.photos/id/1019/800/600', // 자연
        thumbnailUrl: 'https://picsum.photos/id/1019/200/200',
        fileSize: 980000,
        capturedAt: new Date('2024-08-12T10:15:00Z'),
        displayDate: new Date('2024-08-12T10:15:00Z'),
        tags: JSON.stringify(['자연', '제주도']),
        exifData: JSON.stringify({
          camera: 'iPhone 15 Pro',
          iso: 150,
          aperture: 'f/1.8',
          shutterSpeed: '1/320',
        }),
      },
      {
        id: crypto.randomUUID(),
        projectId: insertedProjects[1].id,
        originalFileName: 'seoul-cafe-1.jpg',
        compressedUrl: 'https://picsum.photos/id/201/800/600', // 카페
        thumbnailUrl: 'https://picsum.photos/id/201/200/200',
        fileSize: 950000,
        capturedAt: new Date('2024-07-15T14:30:00Z'),
        displayDate: new Date('2024-07-15T14:30:00Z'),
        tags: JSON.stringify(['서울', '카페']),
        exifData: JSON.stringify({
          camera: 'Canon EOS R5',
          iso: 400,
          aperture: 'f/2.8',
          shutterSpeed: '1/125',
        }),
      },
      {
        id: crypto.randomUUID(),
        projectId: insertedProjects[1].id,
        originalFileName: 'seoul-street-1.jpg',
        compressedUrl: 'https://picsum.photos/id/164/800/600', // 거리
        thumbnailUrl: 'https://picsum.photos/id/164/200/200',
        fileSize: 920000,
        capturedAt: new Date('2024-07-16T16:20:00Z'),
        displayDate: new Date('2024-07-16T16:20:00Z'),
        tags: JSON.stringify(['서울', '거리']),
        exifData: JSON.stringify({
          camera: 'Canon EOS R5',
          iso: 320,
          aperture: 'f/2.8',
          shutterSpeed: '1/160',
        }),
      },
      {
        id: crypto.randomUUID(),
        projectId: insertedProjects[2].id,
        originalFileName: 'food-pasta-1.jpg',
        compressedUrl: 'https://picsum.photos/id/292/800/600', // 음식
        thumbnailUrl: 'https://picsum.photos/id/292/200/200',
        fileSize: 880000,
        capturedAt: new Date('2024-06-01T12:15:00Z'),
        displayDate: new Date('2024-06-01T12:15:00Z'),
        tags: JSON.stringify(['음식', '파스타', '이탈리안']),
        exifData: JSON.stringify({
          camera: 'iPhone 14 Pro',
          iso: 320,
          aperture: 'f/1.6',
          shutterSpeed: '1/60',
        }),
      },
      {
        id: crypto.randomUUID(),
        projectId: insertedProjects[2].id,
        originalFileName: 'food-dessert-1.jpg',
        compressedUrl: 'https://picsum.photos/id/312/800/600', // 디저트
        thumbnailUrl: 'https://picsum.photos/id/312/200/200',
        fileSize: 860000,
        capturedAt: new Date('2024-06-02T15:30:00Z'),
        displayDate: new Date('2024-06-02T15:30:00Z'),
        tags: JSON.stringify(['디저트', '카페']),
        exifData: JSON.stringify({
          camera: 'iPhone 14 Pro',
          iso: 250,
          aperture: 'f/1.6',
          shutterSpeed: '1/80',
        }),
      },
    ];

    const insertedPhotos = await db.insert(photos).values(photoData).returning();
    console.log(`[Seed] ✅ Created ${insertedPhotos.length} photos`);

    console.log('[Seed] 🎉 Seeding completed successfully!');
    console.log('[Seed] 💡 프로젝트를 클릭하여 필터링해보세요!');
    console.log(`[Seed] 📊 Summary:`);
    console.log(`  - Projects: ${insertedProjects.length}`);
    console.log(`  - Photos: ${insertedPhotos.length}`);
  } catch (error) {
    console.error('[Seed] ❌ Failed:', error);
    if (error instanceof Error) {
      console.error('[Seed] Error details:', error.message);
    }
    process.exit(1);
  } finally {
    sqlite.close();
    console.log('[Seed] DB connection closed.');
  }
}

// 실행
seed();
