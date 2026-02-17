'use client';

import React, { useMemo, useState } from 'react';
import { useProjects, useCreateProject } from '@/src/hooks/useProjects';
import { usePhotos } from '@/src/hooks/usePhotos';
import { useToast } from '@/src/hooks/useToast';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  selectedProjectId: string | null;
  onProjectSelect: (id: string | null) => void;
  selectedTag?: string | null;
  onTagSelect?: (tag: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedProjectId,
  onProjectSelect,
  selectedTag,
  onTagSelect
}) => {
  const { data: projects, isLoading, error } = useProjects();
  const { data: photos } = usePhotos();
  const createProject = useCreateProject();
  const toast = useToast();

  const [newProjectName, setNewProjectName] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);

  // Extract unique tags from all photos
  const uniqueTags = useMemo(() => {
    if (!photos?.data?.items) return [];

    const tagSet = new Set<string>();
    photos.data.items.forEach((photo: any) => {
      if (photo.tags && Array.isArray(photo.tags)) {
        photo.tags.forEach((tag: string) => tagSet.add(tag));
      }
    });

    return Array.from(tagSet).sort();
  }, [photos?.data?.items]);

  // Add new project
  const handleAddProject = async () => {
    const trimmedName = newProjectName.trim();

    if (!trimmedName) {
      toast.error('프로젝트 이름을 입력해주세요');
      return;
    }

    // Check for duplicate project name
    const existingProject = projects?.data?.find(
      (p: any) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingProject) {
      toast.error('이미 존재하는 프로젝트 이름입니다');
      return;
    }

    try {
      // Generate hashtag from name
      const hashtag = `#${trimmedName.toLowerCase().replace(/\s+/g, '_')}`;

      await createProject.mutateAsync({
        name: trimmedName,
        hashtag,
      });

      toast.success('프로젝트가 추가되었습니다');
      setNewProjectName('');
      setIsAddingProject(false);
    } catch (error) {
      toast.error('프로젝트 추가에 실패했습니다');
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h1 className={styles.logo}>Log-Shot</h1>
        <button className={styles.menuButton} aria-label="메뉴">
          ☰
        </button>
      </div>

      <nav className={styles.nav}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Projects</h2>
            <button
              className={styles.addButton}
              onClick={() => setIsAddingProject(!isAddingProject)}
              title="프로젝트 추가"
            >
              {isAddingProject ? '−' : '+'}
            </button>
          </div>

          {/* Add Project Form */}
          {isAddingProject && (
            <div className={styles.addProjectForm}>
              <input
                type="text"
                className={styles.projectInput}
                placeholder="프로젝트 이름"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddProject();
                  if (e.key === 'Escape') {
                    setIsAddingProject(false);
                    setNewProjectName('');
                  }
                }}
                autoFocus
              />
              <div className={styles.formActions}>
                <button
                  className={styles.confirmButton}
                  onClick={handleAddProject}
                  disabled={createProject.isPending}
                >
                  {createProject.isPending ? '...' : '추가'}
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setIsAddingProject(false);
                    setNewProjectName('');
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <p className={styles.loading}>Loading...</p>
          ) : error ? (
            <div className={styles.errorMessage}>
              <p>⚠️ DB 연결 실패</p>
              <p className={styles.errorHint}>터미널에서 실행:</p>
              <code>npm run db:migrate</code>
            </div>
          ) : (
            <ul className={styles.projectList}>
              {/* 전체 보기 - 항상 표시 */}
              <li
                className={`${styles.projectItem} ${!selectedProjectId ? styles.active : ''}`}
                onClick={() => onProjectSelect(null)}
              >
                <span className={styles.hashtag}>#All</span>
                <span className={styles.count}>
                  {projects?.data?.reduce((sum: number, p: any) => sum + (p._count?.photos || 0), 0) || 0}
                </span>
              </li>

              {/* 프로젝트 목록 */}
              {projects?.data && projects.data.length > 0 ? (
                projects.data.map((project: any) => (
                  <li
                    key={project.id}
                    className={`${styles.projectItem} ${selectedProjectId === project.id ? styles.active : ''}`}
                    onClick={() => onProjectSelect(project.id)}
                  >
                    <span className={styles.hashtag}>{project.hashtag}</span>
                    <span className={styles.dotIndicator} data-status="active" />
                  </li>
                ))
              ) : (
                <li className={styles.emptyMessage}>
                  프로젝트를 추가해주세요
                </li>
              )}
            </ul>
          )}
        </section>

        {/* Tags Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tags</h2>
          {uniqueTags.length === 0 ? (
            <p className={styles.emptyMessage}>태그가 없습니다</p>
          ) : (
            <ul className={styles.tagList}>
              {uniqueTags.map((tag) => (
                <li
                  key={tag}
                  className={`${styles.tagItem} ${selectedTag === tag ? styles.active : ''}`}
                  onClick={() => onTagSelect?.(selectedTag === tag ? null : tag)}
                >
                  <span className={styles.tagName}>#{tag}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Info</h2>
          <div className={styles.infoText}>
            <p>프로젝트를 클릭하여 필터링하세요.</p>
            <p>타임라인 점을 클릭하여 날짜별로 탐색하세요.</p>
          </div>
        </section>
      </nav>
    </aside>
  );
};
