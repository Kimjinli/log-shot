/**
 * Photos Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_CONFIG, API_ENDPOINTS } from '@/src/constants';
import type { Photo } from '@/src/db';

/**
 * 사진 목록 조회
 */
export function usePhotos(filters?: any) {
  return useQuery({
    queryKey: [QUERY_CONFIG.KEYS.PHOTOS, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            params.append(key, String(value));
          }
        });
      }
      const response = await fetch(`${API_ENDPOINTS.PHOTOS}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch photos');
      return response.json();
    },
    staleTime: QUERY_CONFIG.STALE_TIME.SHORT,
  });
}

/**
 * 사진 상세 조회
 */
export function usePhoto(id: string) {
  return useQuery({
    queryKey: [QUERY_CONFIG.KEYS.PHOTO_DETAIL, id],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.PHOTO_DETAIL(id));
      if (!response.ok) throw new Error('Failed to fetch photo');
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * 사진 업데이트
 */
export function useUpdatePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Photo> }) => {
      const response = await fetch(API_ENDPOINTS.PHOTO_DETAIL(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update photo');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_CONFIG.KEYS.PHOTOS] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_CONFIG.KEYS.PHOTO_DETAIL, variables.id],
      });
    },
  });
}

/**
 * 사진 삭제
 */
export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(API_ENDPOINTS.PHOTO_DETAIL(id), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete photo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_CONFIG.KEYS.PHOTOS] });
    },
  });
}
