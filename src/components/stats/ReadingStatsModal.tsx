/**
 * Lumina Reader - Reading Statistics & Insights Modal
 * Visualizes streaks, total reading time, WPM speed calibrator, and weekly activity.
 */

import React from 'react';
import { Flame, ShieldCheck, X } from 'lucide-react';
import { ReadingStats } from '@/types/stats';
import { StatsEngine } from '@/services/reader/statsEngine';
import { StatsMetricCards } from './StatsMetricCards';

interface ReadingStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: ReadingStats;
  onUpdateWpm: (wpm: number) => void;
}

export const ReadingStatsModal: React.FC<ReadingStatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onUpdateWpm,
}) => {
  if (!isOpen) return null;

  const weeklyData = StatsEngine.getWeeklyData(stats.dailyActivity);
  const maxWeeklyMinutes = Math.max(30, ...weeklyData.map((d) => d.minutes));

  const wpmPresets = [
    { label: 'Study', value: 160 },
    { label: 'Fiction', value: 210 },
    { label: 'Standard', value: 250 },
    { label: 'Fast', value: 340 },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flame size={15} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Reading Insights</h3>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--color-text-muted)' }}>
                Personal reading pace & daily streaks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 4-Stat Metric Cards Grid */}
          <StatsMetricCards stats={stats} />

          {/* 7-Day Activity Chart */}
          <div
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
              Past 7 Days Activity
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '64px', gap: '8px' }}>
              {weeklyData.map((d) => {
                const heightPercent = Math.max(8, Math.round((d.minutes / maxWeeklyMinutes) * 100));
                return (
                  <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div
                      title={`${d.date}: ${d.minutes} min`}
                      style={{
                        width: '100%',
                        maxWidth: '24px',
                        height: `${heightPercent}%`,
                        backgroundColor: d.isToday ? 'var(--color-accent)' : 'var(--color-surface-hover)',
                        borderRadius: '3px 3px 0 0',
                        transition: 'all 200ms ease',
                      }}
                    />
                    <span style={{ fontSize: '9px', color: d.isToday ? 'var(--color-accent)' : 'var(--color-text-muted)', fontWeight: d.isToday ? 700 : 400 }}>
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WPM Speed Slider & Presets */}
          <div
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Reading Speed Calibration
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)' }}>
                {stats.targetWpm} WPM
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="500"
              step="10"
              value={stats.targetWpm}
              onChange={(e) => onUpdateWpm(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {wpmPresets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => onUpdateWpm(p.value)}
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid',
                    borderColor: stats.targetWpm === p.value ? 'var(--color-accent)' : 'var(--color-border)',
                    backgroundColor: stats.targetWpm === p.value ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
                    color: stats.targetWpm === p.value ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {p.label} ({p.value})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div
          style={{
            padding: '10px 18px',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '10px',
            color: 'var(--color-text-muted)',
          }}
        >
          <ShieldCheck size={12} style={{ color: '#10b981' }} />
          <span>100% Local-First & Zero Telemetry. Reading times and stats never leave your device.</span>
        </div>
      </div>
    </div>
  );
};
