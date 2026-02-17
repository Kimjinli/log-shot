'use client';

import React, { useState, useEffect } from 'react';
import { Button, Tooltip } from '@/src/components/common';
import { WHITE_BALANCE } from '@/src/constants';
import { autoWhiteBalance, type WhiteBalanceAdjustment } from '@/src/services/imageAdjustment';
import styles from './WhiteBalanceControl.module.scss';

export interface WhiteBalanceControlProps {
  imageUrl: string;
  value: WhiteBalanceAdjustment;
  onChange: (value: WhiteBalanceAdjustment) => void;
}

export const WhiteBalanceControl: React.FC<WhiteBalanceControlProps> = ({
  imageUrl,
  value,
  onChange,
}) => {
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);

  /**
   * 자동 화이트밸런스
   */
  const handleAuto = async () => {
    setIsAutoProcessing(true);
    try {
      const adjustment = await autoWhiteBalance(imageUrl);
      onChange(adjustment);
    } catch (error) {
      console.error('[WhiteBalance] Auto adjustment failed:', error);
    } finally {
      setIsAutoProcessing(false);
    }
  };

  /**
   * 리셋
   */
  const handleReset = () => {
    onChange({
      temperature: WHITE_BALANCE.DEFAULT_TEMPERATURE,
      tint: WHITE_BALANCE.DEFAULT_TINT,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          화이트밸런스
          <Tooltip content="이미지의 색온도를 조정합니다. 원본 파일은 수정되지 않습니다.">
            <span className={styles.helpIcon}>?</span>
          </Tooltip>
        </h3>

        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" onClick={handleAuto} loading={isAutoProcessing}>
            자동
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            리셋
          </Button>
        </div>
      </div>

      {/* 온도 슬라이더 */}
      <div className={styles.control}>
        <label className={styles.label}>
          <span>온도</span>
          <span className={styles.value}>{value.temperature}</span>
        </label>
        <input
          type="range"
          min={WHITE_BALANCE.TEMPERATURE_MIN}
          max={WHITE_BALANCE.TEMPERATURE_MAX}
          step={WHITE_BALANCE.TEMPERATURE_STEP}
          value={value.temperature}
          onChange={(e) =>
            onChange({
              ...value,
              temperature: parseInt(e.target.value),
            })
          }
          className={styles.slider}
        />
        <div className={styles.sliderLabels}>
          <span className={styles.cold}>차갑게</span>
          <span className={styles.warm}>따뜻하게</span>
        </div>
      </div>

      {/* 틴트 슬라이더 */}
      <div className={styles.control}>
        <label className={styles.label}>
          <span>틴트</span>
          <span className={styles.value}>{value.tint}</span>
        </label>
        <input
          type="range"
          min={WHITE_BALANCE.TINT_MIN}
          max={WHITE_BALANCE.TINT_MAX}
          step={WHITE_BALANCE.TINT_STEP}
          value={value.tint}
          onChange={(e) =>
            onChange({
              ...value,
              tint: parseInt(e.target.value),
            })
          }
          className={styles.slider}
        />
        <div className={styles.sliderLabels}>
          <span className={styles.green}>초록</span>
          <span className={styles.magenta}>마젠타</span>
        </div>
      </div>
    </div>
  );
};
