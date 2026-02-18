# Log-Shot

> 사용자 친화적인 PWA 기반 포토 아카이빙 솔루션

Log-Shot은 사진의 원본을 안전하게 보호하면서도 편리한 편집과 관리를 제공하는 모바일 우선 웹 애플리케이션입니다.

## 주요 기능

### 원본 보호 카메라
- 촬영한 원본 이미지는 사용자 기기에 안전하게 저장
- 서버에는 최적화된 압축본만 업로드하여 원본 무결성 보장

### EXIF 데이터 보존
- 촬영 날짜, 시간, 위치 등 EXIF 정보를 DB에 별도 저장
- 이미지 압축 시에도 메타데이터 손실 방지

### 화이트밸런스 보정
- Canvas API를 활용한 픽셀 단위 색온도 조정
- 원본 파일은 수정하지 않는 비파괴 편집 방식

### 오프라인 지원
- IndexedDB를 활용한 임시 저장
- 네트워크 연결 시 자동 업로드 재시도

### 타임라인 인터페이스
- 날짜별 사진 탐색 및 필터링
- 직관적인 그리드 뷰와 상세 보기

### 프로젝트 그룹
- 해시태그 기반 사진 분류 (`#JejuTrip`, `#WorkProject` 등)
- 프로젝트별 사진 관리 및 동기화

### PC 다운로드
- 모바일에서 수행한 편집 작업이 반영된 최종 이미지를 PC에서 다운로드

## 기술 스택

### Frontend
- **Next.js 14+** (App Router)
- **TypeScript**
- **SCSS Modules** (모듈화된 스타일링)

### State Management
- **TanStack Query v5** (서버 상태 관리 및 캐싱)
- **Zustand** (클라이언트 상태 관리)

### Form & Validation
- **React Hook Form** (폼 상태 관리)
- **Zod** (스키마 기반 유효성 검사)

### Database
- **Drizzle ORM**
- **PostgreSQL** (Vercel 배포용)
- **SQLite** (로컬 개발 및 Electron용)

### PWA
- **Service Worker** (오프라인 지원)
- **IndexedDB** (idb 라이브러리)

### Desktop
- **Electron** (데스크톱 앱 배포)

### Image Processing
- **browser-image-compression** (클라이언트 이미지 압축)
- **exif-js** (EXIF 데이터 추출)
- **Canvas API** (이미지 보정)
- **Sharp** (서버사이드 이미지 처리)

## 시작하기

### 로컬 개발

#### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 데이터베이스 연결 정보를 입력하세요.

```bash
cp .env.example .env
```

#### 2. 의존성 설치

```bash
npm install
```

#### 3. 데이터베이스 설정

```bash
# Drizzle 스키마로부터 마이그레이션 파일 생성
npm run db:generate:local

# 마이그레이션 실행
npm run db:migrate:local

# (선택사항) 샘플 데이터 시드
npm run db:seed
```

#### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인할 수 있습니다.

## 배포 방법

Log-Shot은 3가지 배포 방법을 지원합니다:

### 1. Vercel 배포 (클라우드 웹 서비스)

**장점**: 무료 호스팅, 자동 HTTPS, CDN, 글로벌 배포
**단점**: Vercel Blob/S3 필요, PostgreSQL 필요

```bash
npm run deploy:vercel
```

**빠른 배포**: [docs/QUICK_DEPLOY.md](./docs/QUICK_DEPLOY.md)
**상세 가이드**: [docs/VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md)

### 2. Local Web 배포 (자체 서버)

**장점**: 완전한 제어, 파일 시스템 사용, SQLite 사용 가능
**단점**: 서버 관리 필요, HTTPS 설정 필요

```bash
# 프로덕션 빌드
npm run build:web

# 서버 시작
npm run start:web
```

배포 방법:
- **VPS (AWS EC2, DigitalOcean 등)**: PM2 사용
- **Docker**: 컨테이너로 배포
- **Railway/Fly.io**: 간편한 배포 플랫폼

### 3. Electron 배포 (데스크톱 앱)

**장점**: 완전한 오프라인 지원, 로컬 파일 시스템, SQLite 사용
**단점**: 앱 크기 큼 (150-200MB), 플랫폼별 빌드 필요

```bash
# 개발 모드
npm run electron:dev

# 프로덕션 빌드
npm run deploy:electron

# 플랫폼별 빌드
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS
npm run electron:build:linux  # Linux
```

**상세 가이드**: [docs/ELECTRON_DEPLOYMENT.md](./docs/ELECTRON_DEPLOYMENT.md)

## 프로젝트 구조

```
log-shot/
├── app/                      # Next.js App Router (라우팅)
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/                 # API Routes
├── src/
│   ├── components/
│   │   ├── common/          # 재사용 컴포넌트 (Button, Input, Modal 등)
│   │   └── layout/          # 레이아웃 컴포넌트 (Sidebar, PhotoGrid 등)
│   ├── features/            # 기능별 모듈
│   │   ├── camera/          # 카메라 촬영
│   │   ├── photo-detail/    # 사진 상세 및 편집
│   │   ├── projects/        # 프로젝트 관리
│   │   └── timeline/        # 타임라인 인터페이스
│   ├── services/            # 비즈니스 로직
│   │   ├── indexedDB.ts
│   │   ├── uploadQueue.ts
│   │   ├── exif.ts
│   │   ├── imageCompression.ts
│   │   ├── imageAdjustment.ts
│   │   └── download.ts
│   ├── db/                  # Drizzle ORM
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── lib/                 # 라이브러리 설정
│   │   ├── validation.ts    # Zod 스키마
│   │   └── queryClient.ts   # TanStack Query
│   ├── hooks/               # Custom Hooks
│   ├── constants/           # 상수 정의
│   └── middleware.ts        # JWT 인증 준비
├── styles/                  # SCSS
│   ├── _variables.scss
│   ├── _mixins.scss
│   └── globals.scss
├── public/                  # PWA 리소스
│   ├── manifest.json
│   └── sw.js
├── docs/                    # 문서
├── main.js                  # Electron 메인 프로세스
└── electron-builder.json    # Electron 빌드 설정
```

## 데이터베이스 스키마

### 주요 테이블

- **projects**: 프로젝트/해시태그 그룹 관리
- **photos**: 사진 메타데이터 및 EXIF 정보
- **editHistory**: 편집 작업 이력
- **savedFiles**: 저장/다운로드 기록
- **uploadQueue**: 오프라인 업로드 대기열

자세한 스키마 정보는 `src/db/schema.ts`를 참조하세요.

## 개발 가이드

### 스타일 커스터마이징

`styles/_variables.scss`에서 다음을 수정할 수 있습니다:
- 색상 테마 (다크 모드 포함)
- 간격 및 여백
- 폰트 및 타이포그래피

자세한 내용은 [docs/CUSTOMIZE.md](./docs/CUSTOMIZE.md)를 참조하세요.

### JWT 인증 활성화

현재 프로젝트는 인증 없이 작동하는 Pass-through 모드입니다.
프로덕션 배포를 위해 JWT 인증을 활성화하려면 [docs/AUTH_GUIDE.md](./docs/AUTH_GUIDE.md)를 참조하세요.

### 데이터베이스 초기화

개발 중 데이터베이스를 초기화하려면:

```bash
npm run db:reset:local
```

자세한 내용은 [docs/RESET_DATABASE.md](./docs/RESET_DATABASE.md)를 참조하세요.

### 상수 수정

`src/constants/index.ts`에서 다음을 수정할 수 있습니다:
- 페이지네이션 설정
- 파일 크기 제한
- 재시도 횟수
- 기타 애플리케이션 설정

## npm 스크립트

### 기본 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (환경 자동 감지) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 실행 |

### 배포 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run build:web` | 웹 앱 프로덕션 빌드 |
| `npm run start:web` | 웹 앱 서버 시작 |
| `npm run deploy:vercel` | Vercel 배포 |
| `npm run deploy:electron` | Electron 앱 빌드 |

### Electron 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run electron` | Electron 앱 실행 |
| `npm run electron:dev` | 개발 모드 (Next.js + Electron) |
| `npm run electron:build` | 전체 플랫폼 빌드 |
| `npm run electron:build:win` | Windows 빌드 |
| `npm run electron:build:mac` | macOS 빌드 |
| `npm run electron:build:linux` | Linux 빌드 |

### 데이터베이스 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run db:generate` | 마이그레이션 생성 (환경 자동 감지) |
| `npm run db:migrate` | 마이그레이션 실행 (환경 자동 감지) |
| `npm run db:seed` | 샘플 데이터 시드 |
| `npm run db:studio` | Drizzle Studio 실행 |
| `npm run db:reset` | 데이터베이스 초기화 |

### 로컬 환경 명령어 (SQLite)

| 명령어 | 설명 |
|--------|------|
| `npm run dev:local` | 로컬 개발 서버 실행 |
| `npm run db:generate:local` | SQLite 마이그레이션 생성 |
| `npm run db:migrate:local` | SQLite 마이그레이션 실행 |
| `npm run db:studio:local` | SQLite Drizzle Studio 실행 |
| `npm run db:reset:local` | SQLite 데이터베이스 초기화 |

### Vercel 환경 명령어 (PostgreSQL)

| 명령어 | 설명 |
|--------|------|
| `npm run dev:vercel` | Vercel 환경 개발 서버 실행 |
| `npm run db:generate:vercel` | PostgreSQL 마이그레이션 생성 |
| `npm run db:migrate:vercel` | PostgreSQL 마이그레이션 실행 |
| `npm run db:studio:vercel` | PostgreSQL Drizzle Studio 실행 |

## API 엔드포인트

### 사진 관리
- `GET /api/photos` - 사진 목록 조회 (페이지네이션 지원)
- `GET /api/photos/:id` - 특정 사진 상세 조회
- `POST /api/upload` - 사진 업로드
- `PATCH /api/photos/:id` - 사진 정보 수정
- `DELETE /api/photos/:id` - 사진 삭제
- `GET /api/photos/:id/download` - 보정 적용된 이미지 다운로드

### 프로젝트 관리
- `GET /api/projects` - 프로젝트 목록 조회
- `POST /api/projects` - 새 프로젝트 생성
- `PATCH /api/projects/:id` - 프로젝트 정보 수정
- `DELETE /api/projects/:id` - 프로젝트 삭제

## 관련 문서

### 배포 가이드
- [docs/ELECTRON_DEPLOYMENT.md](./docs/ELECTRON_DEPLOYMENT.md) - Electron 데스크톱 앱 배포
- [docs/VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md) - Vercel 클라우드 배포
- [docs/QUICK_DEPLOY.md](./docs/QUICK_DEPLOY.md) - Vercel 빠른 배포
- [docs/ENVIRONMENT_SETUP.md](./docs/ENVIRONMENT_SETUP.md) - 환경별 설정 가이드

### 개발 가이드
- [docs/AUTH_GUIDE.md](./docs/AUTH_GUIDE.md) - JWT 인증 설정
- [docs/CUSTOMIZE.md](./docs/CUSTOMIZE.md) - UI/스타일 커스터마이징
- [docs/RESET_DATABASE.md](./docs/RESET_DATABASE.md) - 데이터베이스 초기화
- [docs/RESET_FEATURE.md](./docs/RESET_FEATURE.md) - 데이터 초기화 기능
- [docs/PHOTO_MANAGEMENT.md](./docs/PHOTO_MANAGEMENT.md) - 사진 관리 기능
- [docs/SUPABASE_MIGRATION.md](./docs/SUPABASE_MIGRATION.md) - Supabase 마이그레이션
- [docs/made-spec.md](./docs/made-spec.md) - 프로젝트 상세 스펙

## 라이선스

MIT License

## 기여하기

버그 리포트, 기능 제안, Pull Request는 언제나 환영합니다!

1. 이 저장소를 Fork 하세요
2. Feature 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push 하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

## 문의

이슈가 있거나 질문이 있으시면 [GitHub Issues](../../issues)에 등록해주세요.
