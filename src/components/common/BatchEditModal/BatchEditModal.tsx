'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal/Modal';
import { Button, Input } from '../';
import { useProjects } from '@/src/hooks/useProjects';
import styles from './BatchEditModal.module.scss';

export interface BatchEditData {
  projectId?: string | null;
  tags?: string[];
  watermark?: {
    text: string;
    opacity: number;
    size: number;
    position: string;
  };
}

export interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: BatchEditData) => void;
  selectedCount: number;
  isLoading?: boolean;
}

/**
 * 일괄 수정 모달 컴포넌트
 * - 프로젝트 변경
 * - 태그 추가/변경
 * - 워터마크 설정
 */
export const BatchEditModal: React.FC<BatchEditModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  isLoading = false,
}) => {
  const { data: projects } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('KEEP');
  const [tagsInput, setTagsInput] = useState('');
  const [tagsMode, setTagsMode] = useState<'keep' | 'add' | 'replace'>('keep');

  const [enableWatermark, setEnableWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState('Log-Shot');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [watermarkSize, setWatermarkSize] = useState(40);
  const [watermarkPosition, setWatermarkPosition] = useState('southeast');

  const handleConfirm = () => {
    const data: BatchEditData = {};

    // 프로젝트 변경
    if (selectedProjectId !== 'KEEP') {
      data.projectId = selectedProjectId === 'NONE' ? null : selectedProjectId;
    }

    // 태그 처리
    if (tagsMode !== 'keep' && tagsInput.trim()) {
      const tags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      if (tags.length > 0) {
        data.tags = tags;
      }
    }

    // 워터마크 설정
    if (enableWatermark) {
      data.watermark = {
        text: watermarkText,
        opacity: watermarkOpacity,
        size: watermarkSize,
        position: watermarkPosition,
      };
    }

    onConfirm(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`일괄 수정 (${selectedCount}개 선택됨)`}
      size="md"
      closeOnOverlayClick={!isLoading}
      closeOnEsc={!isLoading}
    >
      <div className={styles.batchEditModal}>
        {/* 프로젝트 변경 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>프로젝트</h3>
          <select
            className={styles.select}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={isLoading}
          >
            <option value="KEEP">변경 안 함</option>
            <option value="NONE">프로젝트 없음</option>
            {projects?.data?.map((project: any) => (
              <option key={project.id} value={project.id}>
                {project.hashtag} - {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* 태그 수정 */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>태그</h3>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="keep"
                checked={tagsMode === 'keep'}
                onChange={(e) => setTagsMode(e.target.value as any)}
                disabled={isLoading}
              />
              <span>변경 안 함</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="add"
                checked={tagsMode === 'add'}
                onChange={(e) => setTagsMode(e.target.value as any)}
                disabled={isLoading}
              />
              <span>기존 태그에 추가</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="replace"
                checked={tagsMode === 'replace'}
                onChange={(e) => setTagsMode(e.target.value as any)}
                disabled={isLoading}
              />
              <span>태그 전체 교체</span>
            </label>
          </div>
          {tagsMode !== 'keep' && (
            <Input
              placeholder="태그 입력 (쉼표로 구분)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              disabled={isLoading}
              fullWidth
            />
          )}
        </div>

        {/* 워터마크 설정 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>워터마크</h3>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={enableWatermark}
                onChange={(e) => setEnableWatermark(e.target.checked)}
                disabled={isLoading}
              />
              <span>활성화</span>
            </label>
          </div>

          {enableWatermark && (
            <div className={styles.watermarkSettings}>
              <Input
                label="텍스트"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                disabled={isLoading}
                fullWidth
              />

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  투명도: {watermarkOpacity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                  disabled={isLoading}
                  className={styles.range}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  크기: {watermarkSize}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={watermarkSize}
                  onChange={(e) => setWatermarkSize(parseInt(e.target.value))}
                  disabled={isLoading}
                  className={styles.range}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>위치</label>
                <select
                  className={styles.select}
                  value={watermarkPosition}
                  onChange={(e) => setWatermarkPosition(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="southeast">오른쪽 하단</option>
                  <option value="southwest">왼쪽 하단</option>
                  <option value="northeast">오른쪽 상단</option>
                  <option value="northwest">왼쪽 상단</option>
                  <option value="center">중앙</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className={styles.actions}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            fullWidth
          >
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={isLoading}
            fullWidth
          >
            적용
          </Button>
        </div>
      </div>
    </Modal>
  );
};
