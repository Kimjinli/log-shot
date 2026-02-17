/**
 * Log-Shot 상수 정의
 * 모든 매직 넘버와 설정값을 이곳에서 중앙 관리
 */

// ============ 파일 업로드 설정 ============
export const FILE_UPLOAD = {
  // 파일 크기 제한 (bytes)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB (원본)
  MAX_COMPRESSED_SIZE: 2 * 1024 * 1024, // 2MB (압축본)

  // 압축 설정
  COMPRESSION_QUALITY: 0.8, // 80% 품질
  THUMBNAIL_SIZE: 300, // 썸네일 최대 가로/세로

  // 지원 포맷
  ACCEPTED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const,
  OUTPUT_FORMAT: 'image/jpeg' as const,
} as const;

// ============ 페이지네이션 ============
export const PAGINATION = {
  // 그리드 표시 개수
  PHOTOS_PER_PAGE: 20,
  PROJECTS_PER_PAGE: 10,

  // 무한 스크롤
  INFINITE_SCROLL_THRESHOLD: 0.8, // 80% 스크롤 시 다음 페이지 로드
} as const;

// ============ 타임라인 설정 ============
export const TIMELINE = {
  // 날짜 범위
  DEFAULT_RANGE_DAYS: 7, // 기본 7일치 표시
  MAX_RANGE_DAYS: 30, // 최대 30일

  // 타임라인 도트
  DOT_SIZE: 12, // px
  DOT_SPACING: 24, // px
} as const;

// ============ IndexedDB 설정 ============
export const INDEXED_DB = {
  DB_NAME: 'logshot-offline',
  VERSION: 1,

  // Store 이름
  STORES: {
    PHOTOS: 'photos',
    QUEUE: 'upload-queue',
    CACHE: 'query-cache',
  },

  // 업로드 재시도
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000, // 2초
  RETRY_BACKOFF_MULTIPLIER: 2, // 지수 백오프
} as const;

// ============ TanStack Query 설정 ============
export const QUERY_CONFIG = {
  // Stale Time
  STALE_TIME: {
    SHORT: 30 * 1000, // 30초
    MEDIUM: 5 * 60 * 1000, // 5분
    LONG: 30 * 60 * 1000, // 30분
  },

  // Cache Time
  CACHE_TIME: {
    SHORT: 5 * 60 * 1000, // 5분
    MEDIUM: 30 * 60 * 1000, // 30분
    LONG: 24 * 60 * 60 * 1000, // 24시간
  },

  // Query Keys
  KEYS: {
    PHOTOS: 'photos',
    PHOTO_DETAIL: 'photo-detail',
    PROJECTS: 'projects',
    PROJECT_DETAIL: 'project-detail',
    TIMELINE: 'timeline',
    SAVED_FILES: 'saved-files',
  },
} as const;

// ============ UI 설정 ============
export const UI = {
  // Toast 메시지 표시 시간
  TOAST_DURATION: {
    SHORT: 2000, // 2초
    MEDIUM: 4000, // 4초
    LONG: 6000, // 6초
  },

  // 모달 애니메이션
  MODAL_ANIMATION_DURATION: 200, // ms

  // Tooltip 딜레이
  TOOLTIP_DELAY: 300, // ms

  // Debounce 시간
  DEBOUNCE: {
    SEARCH: 300, // 검색 입력
    RESIZE: 150, // 윈도우 리사이즈
    SCROLL: 100, // 스크롤
  },
} as const;

// ============ 화이트밸런스 보정 ============
export const WHITE_BALANCE = {
  // 온도 범위 (-100 ~ 100)
  TEMPERATURE_MIN: -100,
  TEMPERATURE_MAX: 100,
  TEMPERATURE_STEP: 1,

  // 틴트 범위 (-100 ~ 100)
  TINT_MIN: -100,
  TINT_MAX: 100,
  TINT_STEP: 1,

  // 기본값
  DEFAULT_TEMPERATURE: 0,
  DEFAULT_TINT: 0,
} as const;

// ============ JWT 설정 (준비만, 현재 미사용) ============
export const JWT = {
  EXPIRES_IN: '7d',
  COOKIE_NAME: 'logshot-token',
  HEADER_NAME: 'Authorization',
  TOKEN_PREFIX: 'Bearer',
} as const;

// ============ 레이아웃 브레이크포인트 ============
export const BREAKPOINTS = {
  MOBILE: 768, // px
  TABLET: 1024, // px
  DESKTOP: 1280, // px
} as const;

// ============ 에러 메시지 (한국어) ============
export const ERROR_MESSAGES = {
  // 파일 업로드
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다. (최대 10MB)',
  INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다. (JPG, PNG, WebP만 가능)',
  UPLOAD_FAILED: '업로드에 실패했습니다. 다시 시도해주세요.',
  COMPRESSION_FAILED: '이미지 압축에 실패했습니다.',

  // 네트워크
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  TIMEOUT_ERROR: '요청 시간이 초과되었습니다.',

  // 폼 검증
  REQUIRED_FIELD: '필수 입력 항목입니다.',
  INVALID_DATE: '올바른 날짜를 입력해주세요.',
  INVALID_TAG: '태그는 20자 이내로 입력해주세요.',

  // 권한
  PERMISSION_DENIED: '권한이 없습니다.',
  CAMERA_PERMISSION_DENIED: '카메라 접근 권한이 필요합니다.',

  // 일반
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
} as const;

// ============ 성공 메시지 (한국어) ============
export const SUCCESS_MESSAGES = {
  PHOTO_UPLOADED: '사진이 업로드되었습니다.',
  PHOTO_UPDATED: '사진 정보가 수정되었습니다.',
  PHOTO_DELETED: '사진이 삭제되었습니다.',
  PROJECT_CREATED: '프로젝트가 생성되었습니다.',
  SAVED_TO_DEVICE: '기기에 저장되었습니다.',
} as const;

// ============ 날짜 포맷 ============
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy', // Aug 10, 2024
  DISPLAY_TIME: 'HH:mm:ss', // 13:28:26
  FULL: 'yyyy-MM-dd HH:mm:ss',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// ============ API 엔드포인트 ============
export const API_ENDPOINTS = {
  PHOTOS: '/api/photos',
  PHOTO_DETAIL: (id: string) => `/api/photos/${id}`,
  PROJECTS: '/api/projects',
  PROJECT_DETAIL: (id: string) => `/api/projects/${id}`,
  UPLOAD: '/api/upload',
  DOWNLOAD: (id: string) => `/api/photos/${id}/download`,
} as const;
