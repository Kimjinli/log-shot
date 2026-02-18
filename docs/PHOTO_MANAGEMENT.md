# 사진 관리 기능 가이드

PhotoGrid의 선택 다운로드 및 선택 삭제 기능 사용 가이드입니다.

## 주요 기능

### 1. 선택 다운로드 📥

여러 사진을 선택하여 한 번에 다운로드할 수 있습니다.

#### 사용 방법
1. PhotoGrid에서 다운로드할 사진의 체크박스를 클릭하여 선택
2. "전체 선택" 버튼으로 모든 사진 선택 가능
3. 상단의 "📥 다운로드" 버튼 클릭
4. 진행 상태 표시줄을 통해 다운로드 진행 상황 확인
5. ZIP 파일 자동 다운로드

#### 다운로드 구조

```
log-shot-20260217120000.zip
├── 프로젝트명/
│   ├── 태그1_태그2/
│   │   ├── photo1.jpg
│   │   ├── photo2.jpg
│   │   └── photo3.jpg
│   └── No_Tags/
│       └── photo4.jpg
└── No_Project/
    └── photo5.jpg
```

#### 워터마크 적용

사진에 워터마크 정보가 있는 경우 자동으로 적용되어 다운로드됩니다:

- **워터마크 텍스트**: adjustments.watermark.text
- **투명도**: adjustments.watermark.opacity (0.0 ~ 1.0)
- **크기**: adjustments.watermark.size (픽셀)
- **위치**: adjustments.watermark.position (southeast, northeast, southwest, northwest, center 등)

#### 진행 상태 표시

다운로드 중 실시간 진행 상태가 표시됩니다:
- 선택된 파일 개수
- 다운로드 진행률 (%)
- 프로그레스 바 애니메이션

### 2. 선택 삭제 🗑️

여러 사진을 선택하여 한 번에 삭제할 수 있습니다.

#### 사용 방법
1. PhotoGrid에서 삭제할 사진의 체크박스를 클릭하여 선택
2. 상단의 "🗑️ 삭제" 버튼 클릭
3. 확인 다이얼로그에서 삭제 내용 확인
4. "삭제" 버튼 클릭하여 최종 확인

⚠️ **주의**: 삭제된 사진은 복구할 수 없습니다!

#### 삭제되는 항목
- DB 레코드 (photos, editHistory, savedFiles 등)
- 업로드된 원본/압축본 파일
- 썸네일 이미지

### 3. 초기화 후 자동 새로고침

데이터 초기화나 삭제 후 PhotoGrid가 자동으로 새로고침됩니다.

## API 엔드포인트

### 다운로드 API

```
POST /api/download
Content-Type: application/json

Body:
{
  "photoIds": ["uuid1", "uuid2", "uuid3"]
}

Response:
Content-Type: application/zip
Content-Disposition: attachment; filename="log-shot-20260217120000.zip"
Transfer-Encoding: chunked
```

#### 처리 순서
1. 사진 메타데이터 조회 (프로젝트, 태그 포함)
2. 디렉토리 구조 생성 (프로젝트/태그)
3. 워터마크 적용 (있는 경우)
4. ZIP 아카이브 생성 및 스트리밍

### 일괄 삭제 API

```
POST /api/photos/batch-delete
Content-Type: application/json

Body:
{
  "photoIds": ["uuid1", "uuid2", "uuid3"]
}

Response:
{
  "success": true,
  "message": "3개의 사진이 삭제되었습니다",
  "data": {
    "deletedPhotos": 3,
    "deletedFiles": 6,
    "failedFiles": 0
  }
}
```

#### 처리 순서
1. 사진 메타데이터 조회
2. 파일 시스템에서 파일 삭제
   - 압축본 (`public/uploads/`)
   - 썸네일 (`public/thumbnails/`)
3. DB 레코드 삭제 (cascade로 관련 데이터 자동 삭제)
4. React Query 캐시 무효화 및 리페치

## 컴포넌트

### ProgressBar

다운로드 진행 상태를 시각적으로 표시하는 컴포넌트입니다.

```tsx
import { ProgressBar } from '@/src/components/common';

<ProgressBar
  progress={75}
  label="다운로드 중..."
  showPercentage={true}
  variant="primary"
  size="md"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `progress` | `number` | - | 진행률 (0-100) |
| `label` | `string` | - | 표시할 레이블 |
| `showPercentage` | `boolean` | `true` | 퍼센트 표시 여부 |
| `variant` | `'primary' \| 'success' \| 'warning' \| 'danger'` | `'primary'` | 색상 테마 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 크기 |

### ConfirmDialog

사진 삭제 확인 등에 사용되는 재사용 가능한 다이얼로그 컴포넌트입니다.

```tsx
import { ConfirmDialog } from '@/src/components/common';

<ConfirmDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleDelete}
  title="사진 삭제"
  message="선택한 5개의 사진을 삭제하시겠습니까?"
  confirmText="삭제"
  cancelText="취소"
  confirmVariant="danger"
  isLoading={isDeleting}
/>
```

## Hooks

### useBatchDeletePhotos

여러 사진을 일괄 삭제하는 React Query 뮤테이션 Hook입니다.

```tsx
import { useBatchDeletePhotos } from '@/src/hooks/usePhotos';

const batchDeleteMutation = useBatchDeletePhotos();

// 사용
await batchDeleteMutation.mutateAsync(['uuid1', 'uuid2', 'uuid3']);
```

#### 특징
- 삭제 성공 시 자동으로 photos 쿼리 무효화
- 에러 처리 내장
- 로딩 상태 추적 (`isPending`)

## 파일 구조

```
app/
├── api/
│   ├── download/
│   │   └── route.ts           # 다운로드 API
│   └── photos/
│       └── batch-delete/
│           └── route.ts       # 일괄 삭제 API
src/
├── components/
│   ├── common/
│   │   ├── ConfirmDialog/     # 확인 다이얼로그
│   │   └── ProgressBar/       # 진행 상태 표시
│   └── layout/
│       └── PhotoGrid.tsx      # 사진 그리드 (메인)
└── hooks/
    └── usePhotos.ts           # 사진 관련 Hooks
```

## 워터마크 데이터 구조

사진의 `adjustments` 필드에 워터마크 정보를 저장합니다:

```typescript
interface Adjustments {
  watermark?: {
    text: string;           // 워터마크 텍스트 (예: "Log-Shot")
    opacity: number;        // 투명도 (0.0 ~ 1.0)
    size: number;           // 폰트 크기 (픽셀)
    position: string;       // 위치 (southeast, northeast, etc.)
  };
  whiteBalance?: {
    temperature: number;
    tint: number;
  };
}
```

### 워터마크 추가 예시

```typescript
// 사진 업데이트 시 워터마크 정보 추가
await updatePhoto.mutateAsync({
  id: photoId,
  data: {
    adjustments: {
      watermark: {
        text: 'My Portfolio',
        opacity: 0.5,
        size: 48,
        position: 'southeast',
      },
    },
  },
});
```

## 성능 최적화

### 다운로드 최적화
- **압축 레벨 조정**: level 6으로 설정 (속도와 압축률 균형)
- **스트리밍 전송**: Transfer-Encoding: chunked 사용
- **청크 단위 읽기**: ReadableStream으로 메모리 효율적 처리

### 삭제 최적화
- **Cascade 삭제**: DB 외래키 설정으로 관련 데이터 자동 삭제
- **병렬 처리**: 여러 파일 삭제 시 Promise.all 활용 가능
- **실패 허용**: 일부 파일 삭제 실패 시에도 나머지 진행

## 문제 해결

### 다운로드가 느린 경우
1. 선택한 사진 개수 확인 (많을수록 느림)
2. 워터마크 처리 제거 고려
3. 압축 레벨 낮추기 (route.ts에서 `zlib: { level: 3 }`)

### 삭제 후 PhotoGrid가 업데이트되지 않는 경우
1. React Query DevTools로 캐시 상태 확인
2. `refetch()` 명시적 호출
3. `queryClient.invalidateQueries` 확인

### 워터마크가 적용되지 않는 경우
1. `adjustments` 필드에 워터마크 정보가 있는지 확인
2. Sharp 라이브러리 설치 확인: `npm install sharp`
3. 서버 로그에서 워터마크 처리 로그 확인

## 보안 고려사항

- **파일 경로 검증**: 사용자 입력을 파일 경로에 직접 사용하지 않음
- **파일명 새니타이징**: 특수문자 제거 (`replace(/[^a-zA-Z0-9가-힣\s]/g, '_')`)
- **권한 확인**: JWT 인증 활성화 시 미들웨어로 권한 검증
- **Rate Limiting**: 대량 다운로드/삭제 남용 방지

## 추후 개선 사항

- [ ] 다운로드 중 취소 기능
- [ ] 선택적 워터마크 적용 (UI에서 토글)
- [ ] 다운로드 히스토리 추적
- [ ] 휴지통 기능 (소프트 삭제)
- [ ] 일괄 편집 기능 (태그, 날짜 등)
