# 빠른 Vercel 배포 가이드

## 1분 안에 배포하기 🚀

### 1단계: GitHub에 Push

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2단계: Vercel Import

1. https://vercel.com/new 접속
2. GitHub 저장소 Import
3. 프로젝트 선택

### 3단계: 환경 변수 설정

**필수 변수만 입력:**

```
DATABASE_URL = postgresql://...  (Vercel Postgres 또는 Supabase)
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
```

### 4단계: Deploy 클릭!

## 데이터베이스 빠른 설정

### Supabase (무료, 가장 빠름)

1. https://supabase.com 가입
2. New Project
3. Database → Connection String 복사
4. Vercel 환경 변수에 붙여넣기

### 또는 Vercel Postgres

1. Vercel Dashboard → Storage
2. Postgres 생성
3. 자동으로 환경 변수 연결됨

## 배포 후 할 일

```bash
# 프로덕션 환경 변수 가져오기
vercel env pull .env.production.local

# 데이터베이스 마이그레이션
npm run db:migrate
```

## ⚠️ 주의사항

현재 코드는 **로컬 파일 시스템**을 사용합니다.
Vercel에서는 다음 기능이 제한됩니다:

- ❌ 파일 업로드 (로컬 저장)
- ❌ 파일 다운로드 (로컬 읽기)
- ❌ 미리보기 (로컬 이미지)

**해결 방법**: Vercel Blob 또는 S3 사용
자세한 내용: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

## 완전한 기능을 위한 선택지

### Option 1: Vercel Blob 사용 (권장)
- 비용: 저장 $0.15/GB/월
- 설정: 5분
- 가이드: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) 참조

### Option 2: Railway 배포 (파일 시스템 지원)
- 무료 플랜: $5 크레딧/월
- 코드 수정 불필요
- https://railway.app

### Option 3: Fly.io 배포
- 무료 플랜: 제한적
- Docker 기반
- https://fly.io

## 문제 발생 시

Vercel 배포는 **서버리스 환경**의 제약이 있습니다.
완전한 가이드: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
