'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePhoto, useUpdatePhoto, useDeletePhoto } from '@/src/hooks/usePhotos';
import { useProjects } from '@/src/hooks/useProjects';
import { photoEditSchema, type PhotoEditFormData } from '@/src/lib/validation';
import { Button, Input, Loading } from '@/src/components/common';
import { WhiteBalanceControl } from '@/src/features/photo-detail/WhiteBalanceControl';
import { useToast } from '@/src/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/src/constants';
import styles from './DetailPanel.module.scss';

interface DetailPanelProps {
  photoId?: string | null;
  onClose?: () => void;
}

// Helper: Date to datetime-local input format
const formatDateForInput = (date: Date | string | null | undefined): string => {
  if (!date) return new Date().toISOString().slice(0, 16);
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 16);
};

// Helper: Format date for watermark (yyyy-mm-dd hh:mm:ss)
const formatDateForWatermark = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Helper: tags array to comma-separated string
const tagsToString = (tags: string[] | null | undefined | any): string => {
  if (!tags) return '';
  if (typeof tags === 'string') return tags;
  if (Array.isArray(tags)) return tags.join(', ');
  return '';
};

// Helper: comma-separated string to tags array
const stringToTags = (str: string): string[] => {
  // Remove special characters like [], {}, etc.
  const cleaned = str.replace(/[\[\]{}()]/g, '');

  return cleaned
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
};

// Helper: Validate tags input
const validateTagsInput = (str: string): string | null => {
  // Check for consecutive commas
  if (str.includes(',,')) {
    return '쉼표를 연속으로 사용할 수 없습니다';
  }
  return null;
};

export const DetailPanel: React.FC<DetailPanelProps> = ({ photoId, onClose }) => {
  const { data: photo, isLoading } = usePhoto(photoId || '');
  const { data: projects } = useProjects();
  const updatePhoto = useUpdatePhoto();
  const deletePhoto = useDeletePhoto();
  const toast = useToast();
  const [whiteBalance, setWhiteBalance] = useState({ temperature: 0, tint: 0 });
  const [tagsInput, setTagsInput] = useState('');
  const [displayDateInput, setDisplayDateInput] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PhotoEditFormData>({
    resolver: zodResolver(photoEditSchema),
    defaultValues: {
      displayDate: new Date(),
      tags: [],
    },
  });

  // Reset form when photo data is loaded
  useEffect(() => {
    if (photo?.data) {
      const displayDate = photo.data.displayDate
        ? new Date(photo.data.displayDate)
        : new Date();

      reset({
        displayDate,
        tags: photo.data.tags || [],
      });

      // Set input values
      setDisplayDateInput(formatDateForInput(displayDate));
      setTagsInput(tagsToString(photo.data.tags));

      // Set project (default to 'ALL' if no project)
      setSelectedProjectId(photo.data.projectId || 'ALL');

      // Load adjustments if exists
      if (photo.data.adjustments?.whiteBalance) {
        setWhiteBalance(photo.data.adjustments.whiteBalance);
      }
    }
  }, [photo?.data, reset]);

  const handleDisplayDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayDateInput(value);

    // Update form value
    if (value) {
      setValue('displayDate', new Date(value));
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagsInput(value);

    // Real-time validation
    const error = validateTagsInput(value);
    if (error) {
      toast.error(error);
    }

    // Update form value
    const tags = stringToTags(value);
    setValue('tags', tags);
  };

  const onSubmit = async (data: PhotoEditFormData) => {
    try {
      if (!photoId) {
        toast.error('사진 ID가 없습니다.');
        return;
      }

      // Validate tags before saving
      const validationError = validateTagsInput(tagsInput);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Convert tags from input string to array
      const tags = stringToTags(tagsInput);

      const updateData: any = {
        displayDate: data.displayDate,
        tags,
        adjustments: { whiteBalance },
      };

      // Add projectId (null if 'ALL' selected)
      if (selectedProjectId === 'ALL') {
        updateData.projectId = null;
      } else {
        updateData.projectId = selectedProjectId;
      }

      console.log('Saving photo with data:', JSON.stringify(updateData, null, 2));

      const result = await updatePhoto.mutateAsync({
        id: photoId,
        data: updateData,
      });

      console.log('Save result:', result);
      toast.success(SUCCESS_MESSAGES.PHOTO_UPDATED);
    } catch (error: any) {
      console.error('Save error:', error);
      console.error('Error response:', error?.response);
      const errorMessage = error?.response?.data?.details || error?.message || '저장에 실패했습니다.';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await deletePhoto.mutateAsync(photoId);
      toast.success(SUCCESS_MESSAGES.PHOTO_DELETED);
      onClose();
    } catch (error) {
      toast.error('삭제에 실패했습니다.');
    }
  };

  // No photo selected state
  if (!photoId) {
    return (
      <aside className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Photo Details</h2>
        </div>
        <div className={styles.emptyState}>
          <p>사진을 선택해 주세요</p>
        </div>
      </aside>
    );
  }

  if (isLoading) {
    return (
      <aside className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Photo Details</h2>
          {onClose && (
            <button className={styles.closeButton} onClick={onClose} aria-label="닫기">
              ×
            </button>
          )}
        </div>
        <Loading />
      </aside>
    );
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Photo Details</h2>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose} aria-label="닫기">
            ×
          </button>
        )}
      </div>

      <div className={styles.content}>
        {/* Image Preview */}
        <div className={styles.imagePreview}>
          <img src={photo?.data?.compressedUrl} alt="" />
          <div className={styles.timestamp}>
            {displayDateInput ? formatDateForWatermark(displayDateInput) : ''}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Date/Time */}
          <Input
            label="Date/Time"
            type="datetime-local"
            value={displayDateInput}
            onChange={handleDisplayDateChange}
            error={errors.displayDate?.message}
            fullWidth
          />

          {/* Project */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Project</label>
            <select
              className={styles.select}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="ALL">All (프로젝트 없음)</option>
              {projects?.data?.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.hashtag} - {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <Input
            label="Tags"
            placeholder="태그 입력 (쉼표로 구분, 예: 테스트, 테스트2)"
            value={tagsInput}
            onChange={handleTagsChange}
            error={errors.tags?.message}
            fullWidth
          />
          {tagsInput && (
            <div style={{ fontSize: '12px', color: '#888', marginTop: '-8px' }}>
              미리보기: {stringToTags(tagsInput).map((tag, i) => (
                <span key={i} style={{
                  display: 'inline-block',
                  background: '#333',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  marginRight: '4px'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* White Balance */}
          <WhiteBalanceControl
            imageUrl={photo?.data?.compressedUrl || ''}
            value={whiteBalance}
            onChange={setWhiteBalance}
          />

          {/* Actions */}
          <div className={styles.actions}>
            <Button type="submit" variant="primary" fullWidth loading={updatePhoto.isPending}>
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={handleDelete}
              loading={deletePhoto.isPending}
            >
              Delete
            </Button>
          </div>
        </form>
      </div>
    </aside>
  );
};
