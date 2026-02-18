"use client";

import React, { useState, useMemo } from "react";
import { usePhotos, useBatchDeletePhotos } from "@/src/hooks/usePhotos";
import { useBatchUpdate } from "@/src/hooks/useBatchUpdate";
import { Loading, ConfirmDialog, ProgressBar, BatchEditModal, type BatchEditData } from "@/src/components/common";
import { format } from "date-fns";
import styles from "./PhotoGrid.module.scss";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const timelineRef = React.useRef<HTMLDivElement>(null);

  // API 호출 시 projectId 포함
  const { data, isLoading, error, refetch } = usePhotos(
    projectId ? { projectId } : undefined,
  );

  const batchDeleteMutation = useBatchDeletePhotos();
  const batchUpdateMutation = useBatchUpdate();

  // 시간순으로 그룹핑 (태그 필터링 포함)
  const photosByTime = useMemo(() => {
    let photos = data?.data?.items || [];

    // 태그 필터링
    if (selectedTag) {
      photos = photos.filter(
        (photo: any) =>
          photo.tags &&
          Array.isArray(photo.tags) &&
          photo.tags.includes(selectedTag),
      );
    }

    // 시간 충돌 처리: 같은 시간이면 createdAt 기준으로 1초씩 더함
    const timeMap = new Map<number, number>();
    const adjustedPhotos = photos.map((photo: any, index: number) => {
      let timestamp = new Date(photo.displayDate).getTime();

      // 같은 시간이 이미 존재하면 1초씩 추가
      while (timeMap.has(timestamp)) {
        timestamp += 1000;
      }
      timeMap.set(timestamp, index);

      return {
        ...photo,
        adjustedDisplayDate: new Date(timestamp),
      };
    });

    // 시간순 정렬 (최신순)
    const sortedPhotos = [...adjustedPhotos].sort((a: any, b: any) => {
      return b.adjustedDisplayDate.getTime() - a.adjustedDisplayDate.getTime();
    });

    // 날짜별로 그룹핑
    const grouped = new Map<string, any[]>();
    sortedPhotos.forEach((photo: any) => {
      const date = format(photo.adjustedDisplayDate, "yyyy-MM-dd");
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
      console.log("[PhotoGrid] No photos found for timeline");
      return [];
    }

    if (selectedTag) {
      photos = photos.filter(
        (photo: any) =>
          photo.tags &&
          Array.isArray(photo.tags) &&
          photo.tags.includes(selectedTag),
      );
    }

    // 시간 충돌 처리
    const timeMap = new Map<number, number>();
    const points: Array<{ id: string; time: Date; dateStr: string }> = photos
      .map((photo: any, index: number) => {
        let timestamp = new Date(photo.displayDate).getTime();

        // 같은 시간이 이미 존재하면 1초씩 추가
        while (timeMap.has(timestamp)) {
          timestamp += 1000;
        }
        timeMap.set(timestamp, index);

        const adjustedDate = new Date(timestamp);
        return {
          id: photo.id,
          time: adjustedDate,
          dateStr: format(adjustedDate, "yyyy-MM-dd"),
        };
      })
      .sort((a: { id: string; time: Date; dateStr: string }, b: { id: string; time: Date; dateStr: string }) => a.time.getTime() - b.time.getTime());

    console.log("[PhotoGrid] Timeline points:", points.length);
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

  // 선택 삭제
  const handleDeleteSelected = async () => {
    if (selectedPhotos.size === 0) return;

    try {
      await batchDeleteMutation.mutateAsync(Array.from(selectedPhotos));
      setSelectedPhotos(new Set());
      setIsDeleteDialogOpen(false);
      // 목록 새로고침
      await refetch();
    } catch (error) {
      console.error("Delete error:", error);
      alert(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    }
  };

  // 일괄 수정
  const handleBatchEdit = async (editData: BatchEditData) => {
    if (selectedPhotos.size === 0) return;

    try {
      const updates: any = {};

      // 프로젝트 변경
      if ('projectId' in editData) {
        updates.projectId = editData.projectId;
      }

      // 태그 처리
      if (editData.tags && editData.tags.length > 0) {
        updates.tags = {
          mode: 'replace', // BatchEditModal에서 mode 결정
          values: editData.tags,
        };
      }

      // 워터마크
      if (editData.watermark) {
        updates.watermark = editData.watermark;
      }

      await batchUpdateMutation.mutateAsync({
        photoIds: Array.from(selectedPhotos),
        updates,
      });

      setSelectedPhotos(new Set());
      setIsBatchEditOpen(false);
      await refetch();
      alert(`${selectedPhotos.size}개의 사진이 수정되었습니다.`);
    } catch (error) {
      console.error("Batch edit error:", error);
      alert(error instanceof Error ? error.message : "일괄 수정에 실패했습니다.");
    }
  };

  // 선택된 사진 다운로드 (진행 상태 표시 포함)
  const handleDownloadSelected = async () => {
    if (selectedPhotos.size === 0) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: Array.from(selectedPhotos) }),
      });

      if (!response.ok) throw new Error("Download failed");

      // Content-Length를 통해 총 크기 확인
      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      // ReadableStream으로 다운로드 진행 상태 추적
      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          receivedLength += value.length;

          if (total > 0) {
            const progress = (receivedLength / total) * 100;
            setDownloadProgress(progress);
          }
        }
      }

      // Blob 생성 및 다운로드
      const blob = new Blob(chunks as BlobPart[]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `log-shot-${new Date().toISOString().slice(0, 19).replace(/[-:]/g, "")}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadProgress(100);
      setSelectedPhotos(new Set());

      // 다운로드 완료 후 잠시 후 상태 초기화
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Download error:", error);
      alert("다운로드에 실패했습니다.");
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  // 타임라인 클릭 - 해당 날짜로 스크롤
  const handleTimeClick = (dateStr: string, index: number) => {
    setActiveTimelineIndex(index);
    const dateElement = document.querySelector(`[data-date="${dateStr}"]`);
    if (dateElement) {
      dateElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // 타임라인 스크롤
  const scrollTimeline = (direction: "left" | "right") => {
    if (!timelineRef.current) return;

    const scrollAmount = 300;
    const currentScroll = timelineRef.current.scrollLeft;
    const newScroll =
      direction === "left"
        ? Math.max(0, currentScroll - scrollAmount)
        : currentScroll + scrollAmount;

    timelineRef.current.scrollTo({
      left: newScroll,
      behavior: "smooth",
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
              onClick={() => scrollTimeline("left")}
              title="이전"
            >
              ◀
            </button>
            <h3 className={styles.timelineTitle}>
              🕐 Timeline Navigator
              <span className={styles.timelineHint}>
                시간순으로 사진을 탐색해보세요
              </span>
            </h3>
            <button
              className={styles.timelineArrow}
              onClick={() => scrollTimeline("right")}
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
                  {format(point.time, "HH:mm")}
                </div>
                <div
                  className={`${styles.timelineDot} ${index === activeTimelineIndex ? styles.active : ""}`}
                />
              </div>
            ))}
          </div>
          <div className={styles.dateRange}>
            {timelinePoints.length > 0 && (
              <>
                {format(timelinePoints[0].time, "MMM dd HH:mm")} -{" "}
                {format(
                  timelinePoints[timelinePoints.length - 1].time,
                  "MMM dd HH:mm, yyyy",
                )}
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
          title={
            selectedPhotos.size === photos.length
              ? "전체 선택 해제"
              : "전체 선택"
          }
        >
          {selectedPhotos.size === photos.length
            ? "☑️ 전체 선택 해제"
            : "☐ 전체 선택"}
        </button>
        {selectedPhotos.size > 0 && (
          <div className={styles.selectionBar}>
            <span>{selectedPhotos.size}개 선택됨</span>
            <div className={styles.selectionActions}>
              <button
                className={styles.editButton}
                onClick={() => setIsBatchEditOpen(true)}
                disabled={batchUpdateMutation.isPending}
              >
                ✏️ 일괄수정
              </button>
              <button
                className={styles.downloadButton}
                onClick={handleDownloadSelected}
                disabled={isDownloading}
              >
                {isDownloading ? "다운로드 중..." : "📥 다운로드"}
              </button>
              <button
                className={styles.deleteButton}
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={batchDeleteMutation.isPending}
              >
                🗑️ 삭제
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Download Progress */}
      {isDownloading && (
        <div className={styles.progressContainer}>
          <ProgressBar
            progress={downloadProgress}
            label={`${selectedPhotos.size}개 파일 다운로드 중...`}
            showPercentage
            variant="primary"
            size="md"
          />
        </div>
      )}

      {/* Photo Grid by Date */}
      <div className={styles.photosByDate}>
        {photosByTime.map(([date, datePhotos]) => (
          <div key={date} className={styles.dateGroup} data-date={date}>
            <h3 className={styles.dateHeader}>
              {format(new Date(date), "MMMM dd, yyyy")}
            </h3>
            <div className={styles.grid}>
              {datePhotos.map((photo: any) => (
                <div
                  key={photo.id}
                  className={`${styles.photoCard} ${selectedPhotoId === photo.id ? styles.selected : ""}`}
                  onClick={() => onPhotoSelect(photo.id)}
                >
                  <img
                    src={photo.thumbnailUrl || photo.compressedUrl}
                    alt={photo.originalFileName}
                    className={styles.image}
                  />

                  {/* Checkbox - 사진 선택용 */}
                  <div
                    className={`${styles.checkbox} ${selectedPhotos.has(photo.id) ? styles.checked : ""}`}
                    onClick={(e) => togglePhotoSelection(photo.id, e)}
                    title="사진 선택 (다중 선택 가능)"
                  >
                    {selectedPhotos.has(photo.id) && "✓"}
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

      {/* Batch Edit Modal */}
      <BatchEditModal
        isOpen={isBatchEditOpen}
        onClose={() => setIsBatchEditOpen(false)}
        onConfirm={handleBatchEdit}
        selectedCount={selectedPhotos.size}
        isLoading={batchUpdateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteSelected}
        title="사진 삭제"
        message={`선택한 ${selectedPhotos.size}개의 사진을 삭제하시겠습니까?\n\n삭제된 사진은 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        confirmVariant="danger"
        isLoading={batchDeleteMutation.isPending}
      />
    </div>
  );
};
