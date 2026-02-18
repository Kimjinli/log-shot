# 커스터마이징 가이드

Log-Shot의 디자인과 설정을 커스터마이징하는 방법을 설명합니다.

## 1. 테마 색상 변경

### CSS Variables 수정

\`styles/_variables.scss\` 파일에서 색상을 변경할 수 있습니다.

\`\`\`scss
:root {
  // 배경색 변경 (현재: #121212)
  --color-background: #1a1a1a;

  // 카드/패널 배경 변경 (현재: #1e1e1e)
  --color-surface: #2a2a2a;

  // 메인 포인트 컬러 변경 (현재: #3b82f6 파란색)
  --color-primary: #10b981; // 초록색으로 변경 예시

  // 텍스트 색상
  --color-text-primary: #ffffff;
  --color-text-secondary: #a0a0a0;

  // 기타 색상
  --color-border: #2d2d2d;
  --color-error: #ff4d4d;
  --color-success: #10b981;
  --color-warning: #f59e0b;
}
\`\`\`

### 라이트 모드 추가

\`_variables.scss\`에 라이트 모드 정의가 이미 준비되어 있습니다:

\`\`\`scss
[data-theme='light'] {
  --color-background: #ffffff;
  --color-surface: #f5f5f5;
  --color-text-primary: #121212;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
}
\`\`\`

테마 토글 기능을 추가하려면:

\`\`\`tsx
const toggleTheme = () => {
  const root = document.documentElement;
  const currentTheme = root.getAttribute('data-theme');
  root.setAttribute('data-theme', currentTheme === 'light' ? 'dark' : 'light');
};
\`\`\`

## 2. 레이아웃 크기 조정

### 사이드바 너비 변경

\`\`\`scss
:root {
  --sidebar-width: 280px; // 기본 240px
}
\`\`\`

### 디테일 패널 너비 변경

\`\`\`scss
:root {
  --detail-panel-width: 360px; // 기본 320px
}
\`\`\`

### 모바일 탭바 높이 변경

\`\`\`scss
:root {
  --mobile-tab-height: 72px; // 기본 64px
}
\`\`\`

## 3. 폰트 변경

### 전역 폰트 패밀리

\`styles/globals.scss\`에서 변경:

\`\`\`scss
body {
  font-family: 'Pretendard', -apple-system, sans-serif;
}
\`\`\`

### 폰트 크기

\`_variables.scss\`에서 조정:

\`\`\`scss
:root {
  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-base: 16px; // 기본 15px
  --font-size-lg: 18px;
  --font-size-xl: 22px;
  --font-size-2xl: 26px;
}
\`\`\`

## 4. 간격 조정

\`\`\`scss
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
  --spacing-3xl: 48px;
}
\`\`\`

## 5. Border Radius

\`\`\`scss
:root {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}
\`\`\`

더 각진 디자인을 원한다면:

\`\`\`scss
:root {
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
}
\`\`\`

## 6. 그리드 컬럼 수 변경

\`src/components/layout/PhotoGrid.module.scss\`:

\`\`\`scss
.grid {
  // 최소 너비를 조정하여 컬럼 수 제어
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); // 기본 200px
}
\`\`\`

## 7. 애니메이션 속도 조정

\`\`\`scss
:root {
  --transition-fast: 100ms ease; // 기본 150ms
  --transition-base: 250ms ease; // 기본 200ms
  --transition-slow: 400ms ease; // 기본 300ms
}
\`\`\`

## 8. 파일 업로드 제한 변경

\`src/constants/index.ts\`:

\`\`\`typescript
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB (기본 10MB)
  MAX_COMPRESSED_SIZE: 5 * 1024 * 1024, // 5MB (기본 2MB)
  COMPRESSION_QUALITY: 0.9, // 90% (기본 80%)
  THUMBNAIL_SIZE: 400, // 기본 300
};
\`\`\`

## 9. 페이지당 사진 수 변경

\`src/constants/index.ts\`:

\`\`\`typescript
export const PAGINATION = {
  PHOTOS_PER_PAGE: 40, // 기본 20
  PROJECTS_PER_PAGE: 20, // 기본 10
};
\`\`\`

## 10. 타임라인 설정

\`src/constants/index.ts\`:

\`\`\`typescript
export const TIMELINE = {
  DEFAULT_RANGE_DAYS: 14, // 기본 7일
  MAX_RANGE_DAYS: 60, // 기본 30일
  DOT_SIZE: 16, // 기본 12px
  DOT_SPACING: 32, // 기본 24px
};
\`\`\`

## 11. Toast 메시지 시간 조정

\`src/constants/index.ts\`:

\`\`\`typescript
export const UI = {
  TOAST_DURATION: {
    SHORT: 3000, // 기본 2000
    MEDIUM: 5000, // 기본 4000
    LONG: 8000, // 기본 6000
  },
};
\`\`\`

## 12. 재시도 설정

\`src/constants/index.ts\`:

\`\`\`typescript
export const INDEXED_DB = {
  MAX_RETRY_ATTEMPTS: 5, // 기본 3
  RETRY_DELAY_MS: 3000, // 기본 2000
  RETRY_BACKOFF_MULTIPLIER: 2, // 지수 백오프
};
\`\`\`

## 13. 로고 변경

\`src/components/layout/Sidebar.tsx\`에서:

\`\`\`tsx
<h1 className={styles.logo}>
  <img src="/logo.svg" alt="My App" />
</h1>
\`\`\`

## 14. PWA 아이콘 교체

1. 192x192, 512x512 크기의 아이콘 준비
2. \`public/icon-192.png\`, \`public/icon-512.png\`에 배치
3. \`public/manifest.json\`에서 경로 확인

## 주의사항

- CSS Variable을 수정하면 **페이지 새로고침 없이** 실시간으로 테마가 변경됩니다.
- SCSS 변수(\`$color-primary\`)는 CSS Variable을 참조하므로, CSS Variable만 수정하면 됩니다.
- 상수 변경 후에는 **서버 재시작**이 필요합니다.
- 이미지 관련 설정 변경 시 기존 업로드된 이미지에는 영향을 주지 않습니다.
