/**
 * TanStack Query 설정
 * 오프라인 지원을 위한 persistQueryClient 설정 포함
 */

import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QUERY_CONFIG } from '@/src/constants';

/**
 * Query Client 생성
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_CONFIG.STALE_TIME.MEDIUM,
      gcTime: QUERY_CONFIG.CACHE_TIME.MEDIUM,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * 브라우저 환경에서만 persistence 설정
 */
if (typeof window !== 'undefined') {
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
  });

  persistQueryClient({
    queryClient,
    persister,
    maxAge: QUERY_CONFIG.CACHE_TIME.LONG,
  });
}
