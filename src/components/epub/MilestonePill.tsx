/**
 * Lumina Reader - Milestone Pill & Tab Button Components
 * UI building blocks for phase verification cards and navigation tabs
 */

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface MilestonePillProps {
  id: string;
  title: string;
  subtitle: string;
  passed: boolean;
}

export const MilestonePill: React.FC<MilestonePillProps> = ({ id, title, subtitle, passed }) => (
  <div
    style={{
      padding: '10px 14px',
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
    }}
  >
    <CheckCircle2 size={16} style={{ color: passed ? '#10B981' : 'var(--color-text-muted)', marginTop: '2px' }} />
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
        Task {id}: {title}
      </span>
      <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{subtitle}</span>
    </div>
  </div>
);

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      fontSize: '11px',
      fontWeight: active ? 600 : 400,
      borderRadius: 'var(--radius-sm)',
      backgroundColor: active ? 'var(--color-surface-hover)' : 'transparent',
      border: '1px solid',
      borderColor: active ? 'var(--color-border)' : 'transparent',
      color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
    }}
  >
    {icon}
    <span>{label}</span>
  </button>
);
