/**
 * Lumina Reader - Typography & Theme Settings Popover Modal
 * Configures circadian reading themes, editorial typography, and reader margins
 */

import React from 'react';
import { useReaderContext } from '@/app/Providers';
import { FontFamilyChoice, ReadingTheme } from '@/types/book';
import { X, Check, AlignJustify, AlignLeft, Columns, Book, BookOpen, ScrollText } from 'lucide-react';

interface TypographyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TypographyModal: React.FC<TypographyModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, typography, updateTypography } = useReaderContext();

  if (!isOpen) return null;

  const themes: { id: ReadingTheme; label: string; bg: string; text: string; accent: string }[] = [
    { id: 'oled', label: 'OLED Dark', bg: '#000000', text: '#E4E4E7', accent: '#6366F1' },
    { id: 'slate', label: 'Slate Night', bg: '#0F172A', text: '#F8FAFC', accent: '#38BDF8' },
    { id: 'sepia', label: 'Warm Sepia', bg: '#FBF0D9', text: '#423223', accent: '#B45309' },
    { id: 'paper', label: 'Soft Paper', bg: '#FAF8F5', text: '#2D2A26', accent: '#3B82F6' },
    { id: 'light', label: 'Crisp Light', bg: '#FFFFFF', text: '#18181B', accent: '#4F46E5' },
  ];

  const fonts: { id: FontFamilyChoice; name: string; category: string }[] = [
    { id: 'serif', name: 'Literata', category: 'Commissioned Serif' },
    { id: 'slab', name: 'Bitter', category: 'Contemporary Slab' },
    { id: 'sans', name: 'Inter', category: 'Humanist Sans' },
    { id: 'hyperlegible', name: 'Atkinson', category: 'High Legibility' },
    { id: 'mono', name: 'JetBrains', category: 'Monospace' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        padding: '48px 16px 16px 16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-slide-down"
        style={{
          width: '340px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600 }}>Reading Ergonomics & Themes</h3>
          <button
            onClick={onClose}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* 1. Theme Selection */}
        <div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            THEME PALETTE
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginTop: '6px' }}>
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  height: '48px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: t.bg,
                  border: theme === t.id ? `2px solid ${t.accent}` : '1px solid var(--color-border)',
                  color: t.text,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  boxShadow: theme === t.id ? `0 0 8px ${t.accent}40` : 'none',
                }}
                title={t.label}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: t.accent }} />
                <span style={{ fontSize: '9px', fontWeight: 500 }}>{t.id.toUpperCase()}</span>
                {theme === t.id && <Check size={10} style={{ color: t.accent }} />}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Font Selection */}
        <div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            TYPEFACE ENGINE
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px' }}>
            {fonts.map((f) => (
              <button
                key={f.id}
                onClick={() => updateTypography({ fontFamily: f.id })}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor:
                    typography.fontFamily === f.id ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
                  color: typography.fontFamily === f.id ? 'var(--color-accent)' : 'var(--color-text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{f.name}</span>
                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>{f.category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Font Size & Line Spacing Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Font Size (Default: 12px)</span>
              <span style={{ fontWeight: 600 }}>{typography.fontSize}px</span>
            </div>
            <input
              type="range"
              min={9}
              max={28}
              value={typography.fontSize}
              onChange={(e) => updateTypography({ fontSize: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--color-accent)', marginTop: '4px' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Line Spacing (Leading)</span>
              <span style={{ fontWeight: 600 }}>{typography.lineHeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={1.2}
              max={2.2}
              step={0.05}
              value={typography.lineHeight}
              onChange={(e) => updateTypography({ lineHeight: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--color-accent)', marginTop: '4px' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Page Margin</span>
              <span style={{ fontWeight: 600 }}>{typography.marginPercent}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={25}
              step={1}
              value={typography.marginPercent}
              onChange={(e) => updateTypography({ marginPercent: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--color-accent)', marginTop: '4px' }}
            />
          </div>
        </div>

        {/* 4. Layout & Reading Mode Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => updateTypography({ readingMode: 'paginated' })}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: (typography.readingMode || 'paginated') === 'paginated' ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
                color: (typography.readingMode || 'paginated') === 'paginated' ? 'var(--color-accent)' : 'inherit',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer',
              }}
            >
              <BookOpen size={12} />
              <span>Paginated</span>
            </button>

            <button
              onClick={() => updateTypography({ readingMode: 'continuous' })}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: typography.readingMode === 'continuous' ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
                color: typography.readingMode === 'continuous' ? 'var(--color-accent)' : 'inherit',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer',
              }}
            >
              <ScrollText size={12} />
              <span>Continuous</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => updateTypography({ textAlign: typography.textAlign === 'justify' ? 'left' : 'justify' })}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer',
              }}
            >
              {typography.textAlign === 'justify' ? <AlignJustify size={12} /> : <AlignLeft size={12} />}
              <span>{typography.textAlign === 'justify' ? 'Justified' : 'Ragged Left'}</span>
            </button>

            <button
              onClick={() => updateTypography({ twoPageSpread: !typography.twoPageSpread })}
              disabled={typography.readingMode === 'continuous'}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: typography.twoPageSpread ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
                color: typography.twoPageSpread ? 'var(--color-accent)' : 'inherit',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: typography.readingMode === 'continuous' ? 'not-allowed' : 'pointer',
                opacity: typography.readingMode === 'continuous' ? 0.5 : 1,
              }}
            >
              {typography.twoPageSpread ? <Columns size={12} /> : <Book size={12} />}
              <span>{typography.twoPageSpread ? '2-Page Spread' : 'Single Page'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
