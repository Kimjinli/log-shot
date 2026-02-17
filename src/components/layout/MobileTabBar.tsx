'use client';

import React from 'react';
import styles from './MobileTabBar.module.scss';

interface MobileTabBarProps {
  activeTab: 'capture' | 'group' | 'save' | 'profile';
  onTabChange: (tab: 'capture' | 'group' | 'save' | 'profile') => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className={styles.tabBar}>
      <button
        className={`${styles.tab} ${activeTab === 'capture' ? styles.active : ''}`}
        onClick={() => onTabChange('capture')}
      >
        <span className={styles.icon}>📷</span>
        <span className={styles.label}>Capture</span>
      </button>

      <button
        className={`${styles.tab} ${activeTab === 'group' ? styles.active : ''}`}
        onClick={() => onTabChange('group')}
      >
        <span className={styles.icon}>🖼️</span>
        <span className={styles.label}>Group</span>
      </button>

      <button
        className={`${styles.tab} ${activeTab === 'save' ? styles.active : ''}`}
        onClick={() => onTabChange('save')}
      >
        <span className={styles.icon}>💾</span>
        <span className={styles.label}>Save</span>
      </button>

      <button
        className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
        onClick={() => onTabChange('profile')}
      >
        <span className={styles.icon}>👤</span>
        <span className={styles.label}>Profile</span>
      </button>

      {/* Floating Action Button */}
      <button className={styles.fab} onClick={() => onTabChange('capture')}>
        <span className={styles.fabIcon}>+</span>
      </button>
    </div>
  );
};
