'use client';

import React, { useState, useMemo } from 'react';
import { usePhotos } from '@/src/hooks/usePhotos';
import { Loading } from '@/src/components/common';
import { format, startOfDay, endOfDay } from 'date-fns';
import styles from './PhotoGrid.module.scss';

interface PhotoGridProps {
  onPhotoSelect: (id: string) => void;
  selectedPhotoId: string | null;
  projectId?: string | null;
  selectedTag?: string | null;
  dateRange?: { start: Date | null; end: Date | null };
  onDateRangeChange?: (range: { start: Date | null; end: Date | null }) => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  onPhotoSelect,
  selectedPhotoId,
  projectId,
  selectedTag,
  dateRange,
  onDateRangeChange,
}) => {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [activeTimelineIndex, setActiveTimelineIndex] = useState(0);
  const timelineRef = React.useRef<HTMLDivElement>(null);

  // API 호출 시 projectId 포함
  const { data, isLoading, error } = usePhotos(
    projectId ? { projectId } : undefined
  );

  // 시간순으로 그룹핑 (태그 필터링 포함)
  const photosByTime = useMemo(() => {
    let photos = data?.data?.items || [];

    // 태그 필터링
    if (selectedTag) {
      photos = photos.filter((photo: any) =>
        photo.tags && Array.isArray(photo.tags) && photo.tags.includes(selectedTag)
      );
    }

    // 시간순 정렬 (최신순)
    const sortedPhotos = [...photos].sort((a: any, b: any) => {
      return new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime();
    });

    // 날짜별로 그룹핑
    const grouped = new Map<string, any[]>();
    sortedPhotos.forEach((photo: any) => {
      const date = format(new Date(photo.displayDate), 'yyyy-MM-dd');
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(photo);
    });

    return Array.from(grouped.entries());
  }, [data, selectedTag]);

  // 타임라인용 시간 포인트 (시간순으로 모든 사진)
  const timelinePoints = useMemo(() => {
    let photos = data?.data?.items || [];

    if (photos.length === 0) {
      console.log('[PhotoGrid] No photos found for timeline');
      return [];
    }

    if (selectedTag) {
      photos = photos.filter((photo: any) =>
        photo.tags && Array.isArray(photo.tags) && photo.tags.includes(selectedTag)
      );
    }

    const points = photos
      .map((photo: any) => ({
        id: photo.id,
        time: new Date(photo.displayDate),
        dateStr: format(new Date(photo.displayDate), 'yyyy-MM-dd'),
      }))
      .sort((a, b) => a.time.getTime() - b.time.getTime());

    console.log('[PhotoGrid] Timeline points:', points.length);
    return points;
  }, [data, selectedTag]);

  // 체크박스 토글
  const togglePhotoSelection = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    const allPhotoIds = (data?.data?.items || []).map((p: any) => p.id);
    if (selectedPhotos.size === allPhotoIds.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(allPhotoIds));
    }
  };

  // 선택된 사진 다운로드
  const handleDownloadSelected = async () => {
    if (selectedPhotos.size === 0) return;

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds: Array.from(selectedPhotos) }),
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `log-shot-${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSelectedPhotos(new Set());
    } catch (error) {
      console.error('Download error:', error);
      alert('다운로드에 실패했습니다.');
    }
  };

  // 타임라인 클릭 - 해당 날짜로 스크롤
  const handleTimeClick = (dateStr: string, index: number) => {
    setActiveTimelineIndex(index);
    const dateElement = document.querySelector(`[data-date="${dateStr}"]`);
    if (dateElement) {
      dateElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 타임라인 스크롤
  const scrollTimeline = (direction: 'left' | 'right') => {
    if (!timelineRef.current) return;

    const scrollAmount = 300;
    const currentScroll = timelineRef.current.scrollLeft;
    const newScroll = direction === 'left'
      ? Math.max(0, currentScroll - scrollAmount)
      : currentScroll + scrollAmount;

    timelineRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth',
    });
  };

  if (isLoading) {
    return <Loading text="사진을 불러오는 중..." />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>사진을 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  const photos = data?.data?.items || [];

  if (photos.length === 0) {
    return (
      <div className={styles.empty}>
        <p>아직 사진이 없습니다.</p>
        <p>파일을 업로드하거나 카메라로 촬영해보세요!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Timeline */}
      {timelinePoints.length > 0 && (
        <div className={styles.timeline}>
          <div className={styles.timelineHeader}>
            <button
              className={styles.timelineArrow}
              onClick={() => scrollTimeline('left')}
              title="이전"
            >
              ◀
            </button>
            <h3 className={styles.timelineTitle}>
              🕐 Timeline Navigator
              <span className={styles.timelineHint}>시간순으로 사진을 탐색해보세요</span>
            </h3>
            <button
              className={styles.timelineArrow}
              onClick={() => scrollTimeline('right')}
              title="다음"
            >
              ▶
            </button>
          </div>
          <div className={styles.timelineTrack} ref={timelineRef}>
            {timelinePoints.map((point, index) => (
              <div
                key={point.id}
                className={styles.timelinePoint}
                onClick={() => handleTimeClick(point.dateStr, index)}
              >
                <div className={styles.timeLabel}>
                  {format(point.time, 'HH:mm')}
                </div>
                <div
                  className={`${styles.timelineDot} ${index === activeTimelineIndex ? styles.active : ''}`}
                />
              </div>
            ))}
          </div>
          <div className={styles.dateRange}>
            {timelinePoints.length > 0 && (
              <>
                {format(timelinePoints[0].time, 'MMM dd HH:mm')} -{' '}
                {format(timelinePoints[timelinePoints.length - 1].time, 'MMM dd HH:mm, yyyy')}
              </>
            )}
          </div>
        </div>
      )}

      {/* Selection Actions */}
      <div className={styles.selectionHeader}>
        <button
          className={styles.selectAllButton}
          onClick={toggleSelectAll}
          title={selectedPhotos.size === photos.length ? '전체 선택 해제' : '전체 선택'}
        >
          {selectedPhotos.size === photos.length ? '☑️ 전체 선택 해제' : '☐ 전체 선택'}
        </button>
        {selectedPhotos.size > 0 && (
          <div className={styles.selectionBar}>
            <span>{selectedPhotos.size}개 선택됨</span>
            <div className={styles.selectionActions}>
              <button onClick={handleDownloadSelected}>다운로드</button>
              <button>삭제</button>
            </div>
          </div>
        )}
      </div>

      {/* Photo Grid by Date */}
      <div className={styles.photosByDate}>
        {photosByTime.map(([date, datePhotos]) => (
          <div key={date} className={styles.dateGroup} data-date={date}>
            <h3 className={styles.dateHeader}>{format(new Date(date), 'MMMM dd, yyyy')}</h3>
            <div className={styles.grid}>
              {datePhotos.map((photo: any) => (
                <div
                  key={photo.id}
                  className={`${styles.photoCard} ${selectedPhotoId === photo.id ? styles.selected : ''}`}
                  onClick={() => onPhotoSelect(photo.id)}
                >
                  <img
                    src={photo.thumbnailUrl || photo.compressedUrl}
                    alt={photo.originalFileName}
                    className={styles.image}
                  />

                  {/* Checkbox - 사진 선택용 */}
                  <div
                    className={`${styles.checkbox} ${selectedPhotos.has(photo.id) ? styles.checked : ''}`}
                    onClick={(e) => togglePhotoSelection(photo.id, e)}
                    title="사진 선택 (다중 선택 가능)"
                  >
                    {selectedPhotos.has(photo.id) && '✓'}
                  </div>

                  {/* Badge - 저장됨 표시 */}
                  <div className={styles.badge} title="저장된 사진">
                    ✓
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
