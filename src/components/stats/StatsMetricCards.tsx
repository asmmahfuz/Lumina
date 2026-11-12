/**
 * Lumina Reader - Reading Metric Cards Grid
 * Displays Streak, Read Time, Pace (WPM), and Total Words
 */

import React from 'react';
import { Flame, Clock, Zap, BookOpen } from 'lucide-react';
import { ReadingStats } from '@/types/stats';
import { StatsEngine } from '@/services/reader/statsEngine';

interface StatsMetricCardsProps {
  stats: ReadingStats;
}

export const StatsMetricCards: React.FC<StatsMetricCardsProps> = ({ stats }) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 12px',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {/* 1. Streak */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <Flame size={13} style={{ color: '#f97316' }} />
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Daily Streak</span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {stats.currentStreakDays} {stats.currentStreakDays === 1 ? 'Day' : 'Days'}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
          Longest: {stats.longestStreakDays} days
        </div>
      </div>

      {/* 2. Total Time */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <Clock size={13} style={{ color: 'var(--color-accent)' }} />
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Total Time</span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {StatsEngine.formatDuration(stats.totalReadingTimeSeconds)}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Active reading</div>
      </div>

      {/* 3. Reading Pace (WPM) */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <Zap size={13} style={{ color: '#eab308' }} />
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Pace (WPM)</span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {stats.targetWpm} <span style={{ fontSize: '11px', fontWeight: 500 }}>wpm</span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Words per minute</div>
      </div>

      {/* 4. Words Read */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <BookOpen size={13} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Words Read</span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {stats.totalWordsRead.toLocaleString()}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Across library</div>
      </div>
    </div>
  );
};
