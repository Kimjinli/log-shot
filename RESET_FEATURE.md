# 데이터 초기화 기능

프로젝트의 모든 데이터를 초기화하는 기능입니다.

## 사용 방법

1. 왼쪽 사이드바 상단의 **햄버거 메뉴 (☰)** 버튼을 클릭합니다
2. 드롭다운 메뉴에서 **"모든 데이터 초기화"** 버튼을 클릭합니다
3. 확인 다이얼로그가 나타나면 내용을 확인하고 **"삭제"** 버튼을 클릭합니다

## 삭제되는 항목

초기화 시 다음 항목들이 **영구적으로 삭제**됩니다:

- ✅ 모든 프로젝트
- ✅ 모든 사진 및 메타데이터
- ✅ 업로드된 파일 (`public/uploads/`)
- ✅ 썸네일 이미지 (`public/thumbnails/`)
- ✅ 편집 이력
- ✅ 저장 파일 기록
- ✅ 업로드 대기열

## 주의사항

⚠️ **이 작업은 되돌릴 수 없습니다!**

- 개발 환경에서 테스트 데이터를 정리할 때 사용하세요
- 프로덕션 환경에서는 신중하게 사용해야 합니다
- 삭제 전 반드시 백업을 권장합니다

## 기술적 세부사항

### API 엔드포인트
```
POST /api/reset
```

### 처리 순서
1. DB 테이블 데이터 삭제 (외래키 제약조건 순서 고려)
   - savedFiles
   - editHistory
   - uploadQueue
   - photos
   - projects
2. 파일 시스템 정리
   - `public/uploads/` 디렉토리의 모든 파일 삭제
   - `public/thumbnails/` 디렉토리의 모든 파일 삭제
   - `.gitkeep` 파일은 유지

### 사용된 컴포넌트

- **ConfirmDialog**: 재사용 가능한 확인 다이얼로그 컴포넌트
- **useReset Hook**: 초기화 API를 호출하는 React Query 뮤테이션

### 파일 구조

```
src/
├── components/
│   ├── common/
│   │   └── ConfirmDialog/          # 재사용 가능한 확인 다이얼로그
│   │       ├── ConfirmDialog.tsx
│   │       ├── ConfirmDialog.module.scss
│   │       └── index.ts
│   └── layout/
│       └── Sidebar.tsx              # 햄버거 메뉴 및 초기화 버튼
├── hooks/
│   └── useReset.ts                  # 초기화 Hook
app/
└── api/
    └── reset/
        └── route.ts                 # 초기화 API 엔드포인트
```

## ConfirmDialog 컴포넌트 재사용

`ConfirmDialog`는 범용 확인 다이얼로그 컴포넌트로, 다른 곳에서도 재사용할 수 있습니다.

### 사용 예시

```tsx
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>삭제</button>
      
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="삭제 확인"
        message="정말 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | 다이얼로그 표시 여부 |
| `onClose` | `() => void` | - | 닫기 콜백 |
| `onConfirm` | `() => void` | - | 확인 콜백 |
| `title` | `string` | `"확인"` | 다이얼로그 제목 |
| `message` | `string` | - | 표시할 메시지 |
| `confirmText` | `string` | `"확인"` | 확인 버튼 텍스트 |
| `cancelText` | `string` | `"취소"` | 취소 버튼 텍스트 |
| `confirmVariant` | `'primary' \| 'danger'` | `'primary'` | 확인 버튼 스타일 |
| `isLoading` | `boolean` | `false` | 로딩 상태 |

## 보안 고려사항

- **프로덕션 환경**: JWT 인증이 활성화된 경우, 관리자 권한이 있는 사용자만 접근 가능하도록 미들웨어 추가를 권장합니다
- **Rate Limiting**: API 엔드포인트에 Rate Limiting을 추가하여 남용을 방지할 수 있습니다
- **Audit Log**: 초기화 작업을 로깅하여 누가, 언제 실행했는지 추적하는 것을 권장합니다

