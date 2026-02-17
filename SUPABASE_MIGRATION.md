# Supabase 마이그레이션 가이드

SQLite에서 Supabase(PostgreSQL)로 마이그레이션하는 단계별 가이드입니다.

## 📋 마이그레이션 개요

현재 Log-Shot은 SQLite를 사용하여 로컬에서 POC로 개발되었습니다. 이 가이드를 따라 Supabase로 마이그레이션하면:

- ✅ 클라우드 기반 PostgreSQL 사용
- ✅ 실시간 구독 기능 추가 가능
- ✅ Row Level Security (RLS) 지원
- ✅ 자동 백업 및 확장성
- ✅ Storage API로 파일 저장 가능

---

## 🚀 1단계: Supabase 프로젝트 생성

### 1.1 Supabase 가입 및 프로젝트 생성

```bash
# https://supabase.com 접속
# 새 프로젝트 생성
# - 프로젝트명: log-shot
# - 데이터베이스 비밀번호 설정
# - 리전 선택: Northeast Asia (Seoul)
```

### 1.2 연결 정보 확인

프로젝트 설정 > Database > Connection string에서:
- **Connection string (URI)** 복사

---

## 🔧 2단계: 프로젝트 설정 변경

### 2.1 패키지 설치

```bash
# PostgreSQL 드라이버 설치 (이미 설치되어 있음)
npm install postgres

# Supabase 클라이언트 (선택 - Storage 사용 시)
npm install @supabase/supabase-js
```

### 2.2 환경 변수 업데이트

`.env` 파일 수정:

```env
# 기존 SQLite 설정 주석 처리
# DATABASE_PATH=./data/sqlite.db

# Supabase 설정 추가
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Supabase API (선택 - Storage 사용 시)
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

---

## 📝 3단계: 스키마 변환

### 3.1 PostgreSQL용 스키마 생성

`src/db/schema.ts` 파일을 PostgreSQL 버전으로 변환:

```typescript
// SQLite import를 PostgreSQL로 변경
import { pgTable, text, timestamp, integer, jsonb, boolean, index, uuid, varchar } from 'drizzle-orm/pg-core';

// 테이블 정의 변경 예시
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    hashtag: varchar('hashtag', { length: 50 }).notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    hashtagIdx: index('hashtag_idx').on(table.hashtag),
  })
);

// photos 테이블도 동일하게 변환
export const photos = pgTable(
  'photos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // ... SQLite의 integer -> timestamp 변환
    capturedAt: timestamp('captured_at').notNull(),
    displayDate: timestamp('display_date').notNull(),
    // ... SQLite의 text(json) -> jsonb 변환
    exifData: jsonb('exif_data'),
    tags: jsonb('tags').$type<string[]>().default([]),
    adjustments: jsonb('adjustments'),
    // ... integer(boolean) -> boolean 변환
    isDeleted: boolean('is_deleted').default(false),
    // ...
  }
);
```

### 3.2 DB 연결 변경

`src/db/index.ts` 파일 수정:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export * from './schema';
```

### 3.3 Drizzle 설정 변경

`drizzle.config.ts` 파일 수정:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

---

## 🗄️ 4단계: 데이터 마이그레이션

### 4.1 스키마 마이그레이션 생성

```bash
# 새로운 PostgreSQL 마이그레이션 생성
npm run db:generate
```

### 4.2 Supabase에 적용

```bash
# 마이그레이션 실행
npm run db:migrate

# 초기 데이터 삽입
npm run db:seed
```

### 4.3 기존 SQLite 데이터 이동 (선택)

기존 데이터를 Supabase로 이동하려면:

```typescript
// scripts/migrate-data.ts 생성
import Database from 'better-sqlite3';
import { db as pgDb, photos as pgPhotos, projects as pgProjects } from './src/db';

async function migrateData() {
  // SQLite 연결
  const sqlite = new Database('./data/sqlite.db');

  // Projects 마이그레이션
  const sqliteProjects = sqlite.prepare('SELECT * FROM projects').all();
  for (const project of sqliteProjects) {
    await pgDb.insert(pgProjects).values({
      id: project.id,
      name: project.name,
      hashtag: project.hashtag,
      description: project.description,
      createdAt: new Date(project.created_at * 1000), // Unix timestamp 변환
      updatedAt: new Date(project.updated_at * 1000),
    });
  }

  // Photos 마이그레이션
  const sqlitePhotos = sqlite.prepare('SELECT * FROM photos').all();
  for (const photo of sqlitePhotos) {
    await pgDb.insert(pgPhotos).values({
      id: photo.id,
      projectId: photo.project_id,
      originalFileName: photo.original_file_name,
      compressedUrl: photo.compressed_url,
      thumbnailUrl: photo.thumbnail_url,
      fileSize: photo.file_size,
      exifData: photo.exif_data ? JSON.parse(photo.exif_data) : null,
      capturedAt: new Date(photo.captured_at * 1000),
      displayDate: new Date(photo.display_date * 1000),
      tags: photo.tags ? JSON.parse(photo.tags) : [],
      adjustments: photo.adjustments ? JSON.parse(photo.adjustments) : null,
      isDeleted: Boolean(photo.is_deleted),
      createdAt: new Date(photo.created_at * 1000),
      updatedAt: new Date(photo.updated_at * 1000),
    });
  }

  console.log('Migration completed!');
  sqlite.close();
}

migrateData();
```

실행:
```bash
npx tsx scripts/migrate-data.ts
```

---

## 🔐 5단계: Row Level Security 설정 (선택)

Supabase 대시보드에서 SQL Editor를 열고:

```sql
-- RLS 활성화
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (추후 수정)
CREATE POLICY "Allow public read access" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON photos
  FOR SELECT USING (true);

-- 인증된 사용자만 쓰기 가능
CREATE POLICY "Allow authenticated users to insert" ON photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update" ON photos
  FOR UPDATE USING (auth.role() = 'authenticated');
```

---

## 📦 6단계: Supabase Storage 사용 (선택)

파일 저장을 Supabase Storage로 변경:

### 6.1 Storage Bucket 생성

Supabase 대시보드 > Storage:
- Bucket 이름: `photos`
- Public access: true (또는 RLS 설정)

### 6.2 업로드 코드 수정

`app/api/upload/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  // Supabase Storage에 업로드
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('photos')
    .upload(`compressed/${fileName}`, file);

  if (error) throw error;

  // Public URL 가져오기
  const { data: { publicUrl } } = supabase.storage
    .from('photos')
    .getPublicUrl(`compressed/${fileName}`);

  // DB에 저장
  const created = await db.insert(photos).values({
    compressedUrl: publicUrl,
    // ...
  });

  return NextResponse.json({ success: true, data: created[0] });
}
```

---

## ✅ 7단계: 테스트 및 배포

### 7.1 로컬 테스트

```bash
# 개발 서버 실행
npm run dev

# API 테스트
curl http://localhost:3000/api/projects
curl http://localhost:3000/api/photos
```

### 7.2 Vercel 배포

```bash
# Vercel에 배포
vercel

# 환경 변수 설정
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 🔄 타입 변환 참고표

| SQLite | PostgreSQL | 설명 |
|--------|------------|------|
| `text('id')` | `uuid('id')` | UUID 타입 사용 |
| `integer(timestamp)` | `timestamp()` | 네이티브 timestamp |
| `text(json)` | `jsonb()` | 인덱싱 가능한 JSON |
| `integer(boolean)` | `boolean()` | 네이티브 boolean |
| `.default(sql'[]')` | `.default([])` | 배열 기본값 |

---

## 🐛 문제 해결

### 연결 오류

```
Error: Connection refused
```

**해결**: Supabase 프로젝트가 paused 상태인지 확인. 대시보드에서 재개.

### 마이그레이션 실패

```
Error: relation "projects" already exists
```

**해결**: 기존 테이블 삭제 후 재실행
```sql
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
```

### 타임존 문제

PostgreSQL은 타임존을 지원. 필요시:
```typescript
timestamp('created_at').defaultNow().notNull()
// 또는
timestamp('created_at', { withTimezone: true })
```

---

## 📚 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Drizzle ORM PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

## ⚡ 빠른 요약

```bash
# 1. Supabase 프로젝트 생성
# 2. 환경 변수 설정
echo "DATABASE_URL=postgresql://..." >> .env

# 3. 스키마 변환 (SQLite → PostgreSQL)
# - src/db/schema.ts 수정
# - src/db/index.ts 수정
# - drizzle.config.ts 수정

# 4. 마이그레이션 실행
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. 테스트
npm run dev
```

완료! 🎉
