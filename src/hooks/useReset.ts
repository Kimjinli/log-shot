import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_CONFIG } from '@/src/constants';

/**
 * 모든 데이터 초기화 Hook
 */
export function useReset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '초기화에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: () => {
      // 모든 쿼리 캐시 무효화 및 리페치
      queryClient.invalidateQueries({ queryKey: [QUERY_CONFIG.KEYS.PHOTOS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_CONFIG.KEYS.PROJECTS] });
      queryClient.refetchQueries({ queryKey: [QUERY_CONFIG.KEYS.PHOTOS] });
      queryClient.refetchQueries({ queryKey: [QUERY_CONFIG.KEYS.PROJECTS] });
    },
  });
}
