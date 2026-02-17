'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { PhotoGrid } from './PhotoGrid';
import { DetailPanel } from './DetailPanel';
import { MobileTabBar } from './MobileTabBar';
import { FileUploader } from './FileUploader';
import styles from './MainLayout.module.scss';

export const MainLayout: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'capture' | 'group' | 'save' | 'profile'>('group');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  if (isMobile) {
    // Mobile Layout
    return (
      <div className={styles.mobileLayout}>
        <main className={styles.mobileMain}>
          {activeTab === 'capture' && (
            <div className={styles.capturePage}>
              <FileUploader isMobile />
            </div>
          )}
          {activeTab === 'group' && (
            <PhotoGrid
              onPhotoSelect={setSelectedPhotoId}
              selectedPhotoId={selectedPhotoId}
              projectId={selectedProjectId}
              dateRange={dateRange}
            />
          )}
          {activeTab === 'save' && (
            <div className={styles.savedPage}>
              <h2>저장된 파일</h2>
              <p>다운로드한 사진 목록이 여기 표시됩니다.</p>
            </div>
          )}
          {activeTab === 'profile' && (
            <div className={styles.profilePage}>
              <h2>프로필</h2>
              <p>설정 및 프로필 정보</p>
            </div>
          )}
        </main>
        <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {selectedPhotoId && (
          <DetailPanel photoId={selectedPhotoId} onClose={() => setSelectedPhotoId(null)} />
        )}
      </div>
    );
  }

  // Desktop Layout (3-Column)
  return (
    <div className={styles.desktopLayout}>
      <Sidebar
        selectedProjectId={selectedProjectId}
        onProjectSelect={setSelectedProjectId}
        selectedTag={selectedTag}
        onTagSelect={setSelectedTag}
      />
      <main className={styles.main}>
        <FileUploader />
        <PhotoGrid
          onPhotoSelect={setSelectedPhotoId}
          selectedPhotoId={selectedPhotoId}
          projectId={selectedProjectId}
          selectedTag={selectedTag}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </main>
      <DetailPanel
        photoId={selectedPhotoId}
        onClose={selectedPhotoId ? () => setSelectedPhotoId(null) : undefined}
      />
    </div>
  );
};
