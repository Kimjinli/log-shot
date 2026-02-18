# Changelog

## [Unreleased] - 2026-02-17

### Added

#### 데이터 초기화 기능
- 햄버거 메뉴에 "모든 데이터 초기화" 기능 추가
- 재사용 가능한 ConfirmDialog 컴포넌트 추가
- `/api/reset` API 엔드포인트 추가
- DB truncate 및 파일 시스템 정리
- 초기화 후 자동 쿼리 리페치

#### 사진 선택 삭제 기능
- PhotoGrid에 일괄 삭제 기능 구현
- `/api/photos/batch-delete` API 엔드포인트 추가
- useBatchDeletePhotos Hook 추가
- 삭제 확인 다이얼로그
- Cascade 삭제로 관련 데이터 자동 정리

#### 사진 선택 다운로드 기능 개선
- 다운로드 진행 상태 표시 (ProgressBar 컴포넌트)
- 워터마크 자동 적용 (Sharp 라이브러리)
- 프로젝트/태그별 디렉토리 구조 생성
- ReadableStream으로 청크 단위 다운로드
- 다운로드 중 진행률 실시간 표시

#### 새 컴포넌트
- **ConfirmDialog**: 재사용 가능한 확인 다이얼로그
- **ProgressBar**: 진행 상태 표시 프로그레스 바

### Changed

- PhotoGrid 리프레시 로직 개선 (초기화 후 자동 새로고침)
- 다운로드 API 압축 레벨 최적화 (level 9 → 6)
- useReset Hook에서 queryClient.clear() 대신 invalidateQueries + refetchQueries 사용
- Sidebar 햄버거 메뉴에 드롭다운 기능 추가

### Fixed

- 초기화 후 PhotoGrid가 자동으로 새로고침되지 않던 문제 수정
- 선택 삭제 시 파일 시스템에서 파일이 삭제되지 않던 문제 수정
- 다운로드 진행 상태가 표시되지 않던 문제 수정

### Technical Details

#### API Endpoints
- `POST /api/reset` - 모든 데이터 초기화
- `POST /api/photos/batch-delete` - 여러 사진 일괄 삭제
- `POST /api/download` - 워터마크 지원 다운로드 (개선)

#### New Hooks
- `useReset` - 데이터 초기화
- `useBatchDeletePhotos` - 일괄 삭제

#### File Structure
```
src/
├── components/
│   ├── common/
│   │   ├── ConfirmDialog/
│   │   └── ProgressBar/
└── hooks/
    └── useReset.ts

app/
└── api/
    ├── reset/route.ts
    └── photos/batch-delete/route.ts
```

#### Dependencies
- `sharp` - 이미지 워터마크 처리
- `archiver` - ZIP 아카이브 생성

### Documentation
- `RESET_FEATURE.md` - 데이터 초기화 기능 가이드
- `PHOTO_MANAGEMENT.md` - 사진 관리 기능 가이드
- `CHANGELOG.md` - 변경 이력

---

## [0.1.0] - 2026-02-15

### Initial Release

- 프로젝트 초기 설정
- 기본 사진 업로드/관리 기능
- 프로젝트/태그 관리
- 타임라인 인터페이스
- PWA 기본 구조
