# 환경별 설정 가이드

Log-Shot은 로컬 개발 환경(SQLite)과 Vercel 배포 환경(PostgreSQL)을 모두 지원합니다.

## 환경 감지 로직

애플리케이션은 다음 조건으로 자동으로 환경을 감지합니다:

- **PostgreSQL 사용**: `NODE_ENV=production` && `DATABASE_URL`이 `postgres://`로 시작
- **SQLite 사용**: 위 조건이 아닌 경우 (기본값)

## 로컬 개발 환경 (SQLite)

### 1. 환경 변수 설정

`.env` 파일을 생성하거나 수정:

```env
# SQLite 경로 (선택사항, 기본값: ./data/sqlite.db)
DATABASE_PATH=./data/sqlite.db

# JWT Secret (선택사항)
JWT_SECRET=your-local-secret

# 앱 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. 데이터베이스 초기화

```bash
# 마이그레이션 파일 생성
npm run db:generate:local

# 마이그레이션 실행
npm run db:migrate:local

# 샘플 데이터 시드
npm run db:seed
```

### 3. 개발 서버 실행

```bash
npm run dev:local
```

### 4. Drizzle Studio (DB 관리 도구)

```bash
npm run db:studio:local
```

브라우저에서 https://local.drizzle.studio 접속

### 5. 데이터베이스 초기화

```bash
npm run db:reset:local
```

## Vercel 배포 환경 (PostgreSQL)

### 1. 데이터베이스 준비

다음 중 하나를 선택:

#### Option A: Vercel Postgres

1. Vercel Dashboard → Storage → Create Database
2. Postgres 선택
3. 환경 변수 자동 연결

#### Option B: Supabase (무료)

1. [Supabase](https://supabase.com) 프로젝트 생성
2. Settings → Database → Connection String 복사
3. Vercel 환경 변수에 추가

#### Option C: Neon (무료)

1. [Neon](https://neon.tech) 프로젝트 생성
2. Connection String 복사
3. Vercel 환경 변수에 추가

### 2. Vercel 환경 변수 설정

Vercel Dashboard → Settings → Environment Variables:

```env
# 필수
DATABASE_URL=postgresql://user:password@host:5432/database
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# JWT (선택사항)
JWT_SECRET=your-production-secret

# Vercel Blob (파일 업로드용 - 나중에 추가)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

### 3. GitHub 연동 배포

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

Vercel Dashboard에서 자동 배포 시작

### 4. 프로덕션 DB 마이그레이션

**로컬에서 실행** (Vercel CLI 사용):

```bash
# Vercel 환경 변수 가져오기
vercel env pull .env.production.local

# PostgreSQL 마이그레이션 파일 생성
npm run db:generate:vercel

# 프로덕션 DB에 마이그레이션 실행
npm run db:migrate:vercel
```

### 5. Drizzle Studio로 프로덕션 DB 확인

```bash
npm run db:studio:vercel
```

## 환경 전환하기

### 로컬 → Vercel 테스트

로컬에서 Vercel 환경을 테스트하려면:

```bash
# .env에 PostgreSQL DATABASE_URL 추가
DATABASE_URL=postgresql://...

# Vercel 모드로 개발 서버 실행
npm run dev:vercel
```

### Vercel → 로컬로 되돌리기

```bash
# .env에서 DATABASE_URL 제거 또는 주석 처리
# DATABASE_URL=postgresql://...

# 로컬 모드로 개발 서버 실행
npm run dev:local
```

## 마이그레이션 관리

### 스키마 변경 시

1. `src/db/schema.ts` 수정
2. 로컬용 마이그레이션 생성:
   ```bash
   npm run db:generate:local
   ```
3. 로컬에서 테스트:
   ```bash
   npm run db:migrate:local
   npm run dev:local
   ```
4. 프로덕션용 마이그레이션 생성:
   ```bash
   npm run db:generate:vercel
   ```
5. Git에 커밋:
   ```bash
   git add drizzle/
   git commit -m "Add new migration"
   git push
   ```
6. 프로덕션 DB에 적용:
   ```bash
   vercel env pull .env.production.local
   npm run db:migrate:vercel
   ```

### 마이그레이션 파일 위치

생성된 마이그레이션 파일은 모두 `./drizzle/` 폴더에 저장됩니다.
SQLite와 PostgreSQL이 동일한 마이그레이션 파일을 사용할 수 있습니다.

## 설정 파일 설명

### drizzle.config.ts (기본, 환경 자동 감지)

```typescript
// DATABASE_URL이 있으면 PostgreSQL, 없으면 SQLite
const isPostgres = !!process.env.DATABASE_URL &&
                   process.env.DATABASE_URL.startsWith('postgres');
```

### drizzle.config.local.ts (SQLite 전용)

```typescript
dialect: 'sqlite',
dbCredentials: { url: './data/sqlite.db' }
```

### drizzle.config.vercel.ts (PostgreSQL 전용)

```typescript
dialect: 'postgresql',
dbCredentials: { url: process.env.DATABASE_URL! }
```

### src/db/index.ts (DB 연결)

환경에 따라 자동으로 드라이버 선택:
- **Production + PostgreSQL**: `drizzle-orm/postgres-js`
- **Development**: `drizzle-orm/better-sqlite3`

### src/db/migrate.ts (마이그레이션 실행)

환경에 따라 자동으로 마이그레이션 실행:
- **PostgreSQL**: `DATABASE_URL`이 `postgres://`로 시작
- **SQLite**: 그 외

## 트러블슈팅

### "Cannot find module 'postgres'"

PostgreSQL 관련 패키지가 필요합니다:

```bash
npm install postgres
```

### "Cannot find module 'better-sqlite3'"

SQLite 관련 패키지가 필요합니다:

```bash
npm install better-sqlite3
```

### 마이그레이션 충돌

다른 환경에서 생성한 마이그레이션이 충돌하는 경우:

```bash
# drizzle 폴더 삭제
rm -rf drizzle/

# 해당 환경의 마이그레이션 재생성
npm run db:generate:local   # 또는
npm run db:generate:vercel
```

### Vercel 배포 후 DB 연결 오류

1. Vercel 환경 변수 확인:
   ```
   DATABASE_URL=postgresql://...
   ```

2. Connection String에 SSL 모드 추가:
   ```
   DATABASE_URL=postgresql://...?sslmode=require
   ```

3. Vercel 로그 확인:
   ```bash
   vercel logs
   ```

## 참고 자료

- [Drizzle ORM 문서](https://orm.drizzle.team)
- [Vercel 환경 변수](https://vercel.com/docs/environment-variables)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase 문서](https://supabase.com/docs)
