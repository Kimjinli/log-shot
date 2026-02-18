# 프로젝트명: Log-Shot (사용자 친화적 PWA 아카이빙 솔루션)

너는 코드의 구조적 완결성과 일반 사용자의 UX를 모두 잡는 초엘리트 풀스택 개발자야. 아래 가이드를 100% 준수하여 프로젝트를 설계해줘.

# Log-Shot Visual Design Specification

이 문서는 제공된 디자인 가이드 이미지를 텍스트로 상세히 분석한 결과입니다. 모든 컴포넌트는 이 명세의 수치와 스타일을 따릅니다.

## 1. Global Style (Theme: Deep Modern Dark)

- **Background:** `#121212` (전체 배경)
- **Surface/Card:** `#1e1e1e` (사이드바, 패널, 카드 배경)
- **Primary Point:** `#3b82f6` (활성화된 상태, 강조 포인트)
- **Text:** Primary `#ffffff`, Secondary `#a0a0a0` (설명글, 비활성 상태)
- **Border:** `1px solid #2d2d2d`
- **Border Radius:** `12px` (컴포넌트 공통), `8px` (버튼/입력창)

## 2. Layout Structure

### [Desktop View: 3-Column Split]

1. **Left Sidebar (240px):**
   - 상단 'Log-Shot' 로고와 햄버거 메뉴.
   - 'Projects' 섹션: 해시태그 리스트(#JejuTrip 등).
   - 'Saved Files' 섹션: 파일명 옆에 상태를 나타내는 '도트 인디케이터' 배치.
2. **Center Main (Flexible):**
   - 상단 타임라인: 날짜(Aug 10 - Aug 15) 위에 **원형 도트 슬라이더**가 배치된 형태.
   - 그리드: `grid-cols-4` (해상도에 따라 가변), 사진 우측 상단에 작은 아이콘 배지 포함.
3. **Right Detail Panel (320px):**
   - 상단: 선택된 이미지 크게 노출 (이미지 내부에 `13:28:26`과 같은 타임스탬프 오버레이).
   - 중단: 'Edit Date/Time', 'Tags' 입력 필드 (Label은 가늘고 작게).
   - 하단: 'Save Changes' (꽉 찬 버튼), 'Delete' (테두리 버튼) 그룹.

### [Mobile View: PWA]

- 하단 고정 탭바: 아이콘과 텍스트가 세로로 배치된 4개 메뉴(Capture, Group, Save, Profile).
- 중앙 하단 플로팅 버튼: 커다란 '+' 버튼 (카메라 실행).
- 타임라인: 하단 탭바 바로 위에 가로로 긴 '슬라이더 바'가 오버레이된 형태.

## 3. Form & UX Detail (RHF + Zod)

- **Input Style:** 배경 `#252525`, 테두리 없음, 포커스 시 `border: 1px solid #3b82f6`.
- **Validation:** 에러 발생 시 입력창 하단에 `#ff4d4d` 컬러로 메시지 출력.
- **Required:** 필수 필드 레이블 옆에 `red-dot` 마크.
- **Tooltip:** 레이블 옆 `?` 아이콘 호버 시 반투명한 말풍선 노출.

## 1. 기술 스택 (Tech Stack)

- **Core:** Next.js 14+ (App Router), TypeScript
- **State & Data:** TanStack Query v5, Drizzle ORM (PostgreSQL)
- **Form & Validation:** React Hook Form + Zod (Strict Validation)
- **Styling:** SCSS Modules (Clean & Encapsulated)
- **Auth Prep:** JWT Middleware 구조 설계 (현재는 Pass-through 모드)

## 2. 아키텍처 원칙 (Architecture Rules)

- **App Directory Minimal:** `app/`은 오직 라우팅과 Metadata만 담당. 비즈니스 로직 금지.
- **Feature-Driven:** 모든 로직은 `src/features/[feature_name]`에 격리.
- **Common Components:** `src/components/common`에 Modal, Toast, Tooltip, Input, Button 등을 모듈화.
- **Service Layer:** DB 쿼리와 API 호출은 `services/`와 `db/queries/`에 작성하여 UI와 분리.

## 3. 핵심 기능 요구사항

- **친절한 UI/UX:** - 모든 입력창에는 **Zod 스키마 기반 실시간 유효성 검사** 적용.
  - 필수 입력 항목은 시각적 표시(예: 레드 닷) 필수.
  - 복잡한 설정이나 기능 옆에는 **도움말 툴팁(Tooltip)** 배치.
- **원본 보호 카메라:** - 촬영 즉시 기기 갤러리에 원본 저장(`navigator.share` 등 활용).
  - 앱 서버에는 `browser-image-compression`으로 최적화된 사본만 업로드.
- **타임라인 인터페이스:** 모바일 가로 드래그 내비게이션 및 PC 3컬럼 레이아웃 구현.

핵심 비즈니스 로직 (고객 필수 요구사항)

1. **원본 절대 보호 (Original Integrity):** 촬영 원본은 어떠한 경우에도 덮어쓰지 않음. 모든 보정 및 워터마크 정보는 DB 메타데이터로만 관리하거나 압축 사본에만 적용.
2. **화이트밸런스 보정:** Canvas API를 활용하여 픽셀 단위의 화이트밸런스 및 자동 보정 기능 구현.
3. **그룹 기반 동기화:** 프로젝트/해시태그 단위로 사진을 묶어 관리하며, 모든 편집 내역은 실시간 DB 동기화.
4. **PC 작업 연동 및 다운로드:** 모바일에서의 작업(날짜 수정, 보정값)을 PC에서 확인하고, 작업 내용이 입혀진 '최종본 이미지'를 PC에서 다운로드 가능하도록 구현.

## 4. 유지보수 및 확장성 준비

- **Constants:** 모든 매직 넘버(페이징, 용량 제한 등)는 `src/constants/index.ts`로 추출.
- **JWT Prep:** `src/middleware.ts`에 JWT 검증 로직 기초 설계 및 적용 메뉴얼(`AUTH_GUIDE.md`) 작성.
- **SCSS Variables:** 디자인 테마 수정을 위해 `_variables.scss`에 모든 색상/간격 상수를 정의.

## 5. 단계별 실행 요청

1. **Step 1:** 전체 디렉토리 구조 및 `src/constants/`, `_variables.scss`, `src/db/schema.ts` 작성.
2. **Step 2:** Zod 스키마 정의 및 TanStack Query + React Hook Form 연동 베이스라인 코드 작성.
3. **Step 3:** 사용자 기기 원본 저장 기능이 포함된 카메라 모듈과 SCSS 스타일 구현.
4. **Step 4:** 모바일/PC 반응형 레이아웃 및 툴팁/에러 메시지가 포함된 공통 컴포넌트 구현.
5. **Step 5:** `README.md`, `CUSTOMIZE.md`, `AUTH_GUIDE.md` 문서 작성.

### [Bug Prevention & Stability Requirements]

프로젝트의 안정성을 위해 아래 3가지 기술적 위험 요소를 반드시 방어하며 코딩해줘.

1. **오프라인 대응 및 업로드 안정성 (IndexedDB 활용):**
   - 네트워크가 불안정한 모바일 환경을 고려하여, 사진 촬영/업로드 시 즉시 서버로 보내기 전 `IndexedDB`에 임시 저장하는 로직을 구현해줘.
   - TanStack Query의 `persistQueryClient`를 활용하거나, 자체적인 Retry 로직을 통해 네트워크 연결 시 업로드를 재시도하도록 설계해줘.

2. **EXIF 데이터 보존 (Metadata Preservation):**
   - `browser-image-compression` 라이브러리 사용 시 EXIF(날짜, 시간, 위치 등) 데이터가 유실될 위험이 있어.
   - 압축 실행 직전 `exif-js` 등을 사용하여 원본 EXIF를 먼저 추출하고, 이 데이터를 DB에 먼저 기록한 뒤 압축된 이미지를 업로드하는 'Metadata First' 전략을 사용해줘.

3. **런타임 다크모드 대응 (CSS Variable + SCSS):**
   - SCSS 변수($primary 등)에 정적 컬러 값을 넣지 말고, CSS Variable(`var(--primary-color)`)을 참조하도록 구성해줘.
   - 이를 통해 브라우저 테마 변경이나 사용자의 다크모드 토글 시 별도의 페이지 새로고침 없이 스타일이 실시간으로 반응하도록 설계해줘.

4. **원본 보호 프로세스 명확화:**
   - 사용자 기기 갤러리에 저장하는 동작은 `Promise.all`을 사용하여 [갤러리 저장]과 [앱 서버 업로드용 압축]이 병렬로 실행되게 하되, 갤러리 저장 실패가 전체 로직의 중단으로 이어지지 않도록 예외 처리를 철저히 해줘.

위 내용을 확인했다면 나 마트좀 다녀올테니까 완성시켜놔
