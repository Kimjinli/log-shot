/**
 * Projects Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_CONFIG, API_ENDPOINTS } from '@/src/constants';
import type { Project } from '@/src/db';

/**
 * 프로젝트 목록 조회
 */
export function useProjects() {
  return useQuery({
    queryKey: [QUERY_CONFIG.KEYS.PROJECTS],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.PROJECTS);
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
    staleTime: QUERY_CONFIG.STALE_TIME.LONG,
  });
}

/**
 * 프로젝트 상세 조회
 */
export function useProject(id: string) {
  return useQuery({
    queryKey: [QUERY_CONFIG.KEYS.PROJECT_DETAIL, id],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.PROJECT_DETAIL(id));
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * 프로젝트 생성
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const response = await fetch(API_ENDPOINTS.PROJECTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_CONFIG.KEYS.PROJECTS] });
    },
  });
}
