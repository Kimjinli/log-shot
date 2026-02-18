'use client';

import React from 'react';
import styles from './ProgressBar.module.scss';

export interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 진행 상태 표시 프로그레스 바 컴포넌트
 *
 * @example
 * ```tsx
 * <ProgressBar progress={75} label="다운로드 중..." showPercentage />
 * ```
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  variant = 'primary',
  size = 'md',
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={styles.container}>
      {(label || showPercentage) && (
        <div className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {showPercentage && (
            <span className={styles.percentage}>{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className={`${styles.track} ${styles[size]}`}>
        <div
          className={`${styles.fill} ${styles[variant]}`}
          style={{ width: `${clampedProgress}%` }}
        >
          {clampedProgress > 0 && <div className={styles.shine} />}
        </div>
      </div>
    </div>
  );
};
