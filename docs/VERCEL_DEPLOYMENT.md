# Vercel 배포 가이드

Log-Shot을 Vercel에 배포하는 방법입니다.

## ⚠️ 중요 사항

Vercel은 **서버리스 환경**이므로 다음 제약사항이 있습니다:

1. **파일 시스템 쓰기 불가**: 로컬 파일 업로드 대신 **Vercel Blob** 또는 **S3** 사용 필요
2. **SQLite 사용 불가**: **PostgreSQL** 필요 (Vercel Postgres, Supabase, Neon 등)
3. **실행 시간 제한**: API 함수 최대 60초 (Pro 플랜)

## 1. 데이터베이스 설정

### Option A: Vercel Postgres (권장)

1. Vercel Dashboard → Storage → Create Database
2. Postgres 선택
3. `.env.production` 변수 자동 연결

### Option B: Supabase (무료)

1. [Supabase](https://supabase.com) 계정 생성
2. New Project 생성
3. Settings → Database → Connection String 복사
4. Vercel 환경 변수에 추가:
   ```
   DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
   ```

### Option C: Neon (무료)

1. [Neon](https://neon.tech) 계정 생성
2. New Project 생성
3. Connection String 복사
4. Vercel 환경 변수에 추가

## 2. 파일 스토리지 설정

### Option A: Vercel Blob (권장)

1. Vercel Dashboard → Storage → Create Store
2. Blob 선택
3. 환경 변수 자동 추가:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
   ```

### Option B: AWS S3

1. S3 버킷 생성
2. IAM 사용자 및 권한 설정
3. 환경 변수 추가:
   ```
   AWS_ACCESS_KEY_ID=xxx
   AWS_SECRET_ACCESS_KEY=xxx
   AWS_REGION=ap-northeast-2
   AWS_BUCKET_NAME=log-shot
   ```

## 3. Vercel 환경 변수 설정

Vercel Dashboard → Settings → Environment Variables에 추가:

```env
# 필수
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# JWT (선택사항 - 인증 사용 시)
JWT_SECRET=your-secret-key

# Vercel Blob 사용 시
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

### JWT Secret 생성

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. 배포하기

### GitHub 연동 배포 (권장)

1. GitHub에 프로젝트 Push
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/username/log-shot.git
   git push -u origin main
   ```

2. [Vercel Dashboard](https://vercel.com/new) → Import Project
3. GitHub 저장소 선택
4. 환경 변수 설정
5. Deploy 클릭

### CLI 배포

```bash
npm install -g vercel
vercel login
vercel
```

## 5. 데이터베이스 마이그레이션

배포 후 데이터베이스 스키마 생성:

### 로컬에서 프로덕션 DB에 마이그레이션

```bash
# .env에 프로덕션 DATABASE_URL 설정
npm run db:generate
npm run db:migrate
```

### 또는 Vercel CLI 사용

```bash
vercel env pull .env.production.local
npm run db:migrate
```

## 6. Vercel에서 작동하지 않는 기능

현재 코드는 로컬 파일 시스템을 사용하므로 다음 기능이 작동하지 않습니다:

### 수정 필요한 파일

1. **app/api/upload/route.ts**
   - 현재: `fs.writeFile`로 `public/uploads/` 저장
   - 수정: Vercel Blob 또는 S3에 업로드

2. **app/api/download/route.ts**
   - 현재: 로컬 파일 시스템 읽기
   - 수정: Blob/S3에서 읽기

3. **app/api/photos/preview/route.ts**
   - 현재: 로컬 파일 읽기
   - 수정: Blob/S3에서 읽기

4. **app/api/reset/route.ts**
   - 현재: 로컬 파일 삭제
   - 수정: Blob/S3 파일 삭제

## 7. Vercel Blob 사용 예시

### 설치

```bash
npm install @vercel/blob
```

### 업로드 예시

```typescript
import { put } from '@vercel/blob';

// 파일 업로드
const blob = await put('photos/photo.jpg', file, {
  access: 'public',
});

console.log(blob.url); // https://xxx.public.blob.vercel-storage.com/photos/photo.jpg
```

### 삭제 예시

```typescript
import { del } from '@vercel/blob';

await del(blob.url);
```

### 다운로드는 URL로 직접 접근

```typescript
const response = await fetch(blob.url);
const arrayBuffer = await response.arrayBuffer();
```

## 8. 성능 최적화

### Edge Runtime 사용 (선택사항)

빠른 응답을 위해 일부 API를 Edge Runtime으로 변경:

```typescript
// app/api/photos/route.ts
export const runtime = 'edge';
```

### 이미지 최적화

Vercel은 자동으로 이미지를 최적화하지만, Sharp를 사용하는 경우:

```json
// package.json
{
  "scripts": {
    "postinstall": "npm rebuild sharp"
  }
}
```

## 9. 배포 후 확인사항

- [ ] 데이터베이스 연결 확인
- [ ] 환경 변수 설정 확인
- [ ] 업로드 기능 테스트
- [ ] 다운로드 기능 테스트
- [ ] 미리보기 기능 테스트
- [ ] 모바일 반응형 확인
- [ ] HTTPS 작동 확인

## 10. 트러블슈팅

### 데이터베이스 연결 오류

```
Error: getaddrinfo ENOTFOUND
```

**해결**: DATABASE_URL에 `?sslmode=require` 추가

### Sharp 오류

```
Error: Cannot find module 'sharp'
```

**해결**:
```bash
npm rebuild sharp
```

### 파일 업로드 실패

```
Error: EROFS: read-only file system
```

**해결**: Vercel Blob 또는 S3 사용 필요 (위 섹션 참조)

### 함수 타임아웃

```
Error: FUNCTION_INVOCATION_TIMEOUT
```

**해결**:
1. `vercel.json`에서 maxDuration 증가
2. Pro 플랜 사용 (60초 제한)
3. 처리 시간 최적화

## 11. 비용

### Vercel 무료 플랜

- 함수 실행: 100GB-시간/월
- 대역폭: 100GB/월
- 이미지 최적화: 1,000장/월
- **제한**: 함수 실행 시간 10초

### Pro 플랜 ($20/월)

- 함수 실행: 1,000GB-시간/월
- 대역폭: 1TB/월
- 이미지 최적화: 5,000장/월
- **함수 실행 시간 60초**

### Vercel Blob 가격

- 저장: $0.15/GB/월
- 읽기: $3/GB
- 쓰기: $5/GB

## 12. 대안: 전통적인 호스팅

Vercel의 제약사항이 부담스럽다면:

- **Railway**: Node.js 앱 직접 배포 (파일 시스템 사용 가능)
- **DigitalOcean App Platform**: 전통적인 호스팅
- **Fly.io**: Docker 기반 배포
- **AWS EC2**: 완전한 제어

## 참고 링크

- [Vercel 문서](https://vercel.com/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- [Supabase 문서](https://supabase.com/docs)
- [Neon 문서](https://neon.tech/docs)
