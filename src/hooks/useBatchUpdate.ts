import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_CONFIG } from '@/src/constants';

export interface BatchUpdateData {
  photoIds: string[];
  updates: {
    projectId?: string | null;
    tags?: {
      mode: 'add' | 'replace';
      values: string[];
    };
    watermark?: {
      text: string;
      opacity: number;
      size: number;
      position: string;
    };
  };
}

/**
 * 여러 사진 일괄 수정 Hook
 */
export function useBatchUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BatchUpdateData) => {
      const response = await fetch('/api/photos/batch-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '일괄 수정에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_CONFIG.KEYS.PHOTOS] });
    },
  });
}
