/**
 * Lumina Reader - Comic & Manga Reading Settings Popover
 * Configures Reading Mode (Single, LTR Spread, RTL Manga, Webtoon), Fit modes, and cover offsets
 */

import React from 'react';
import { ComicSettings, ComicReadingMode, ComicFitMode } from '@/types/comic';
import { useReaderContext } from '@/app/Providers';
import { X, BookOpen, Layers, ArrowLeftRight, AlignVerticalSpaceAround, PanelBottom, PanelRight } from 'lucide-react';

interface ComicSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ComicSettings;
  onUpdateSettings: (updates: Partial<ComicSettings>) => void;
}

export const ComicSettingsModal: React.FC<ComicSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const { settings: appSettings, updateSettings: updateAppSettings } = useReaderContext();
  if (!isOpen) return null;
  const navPosition = appSettings.navPosition || 'bottom';

  const readingModes: { id: ComicReadingMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'dual-rtl',
      label: 'Manga (RTL)',
      icon: <ArrowLeftRight size={14} />,
      desc: 'Japanese reading order (Right to Left dual spread)',
    },
    {
      id: 'dual-ltr',
      label: 'Spread (LTR)',
      icon: <Layers size={14} />,
      desc: 'Western comic reading order (Left to Right dual spread)',
    },
    {
      id: 'single',
      label: 'Single Page',
      icon: <BookOpen size={14} />,
      desc: 'Displays one page at a time centered',
    },
    {
      id: 'webtoon',
      label: 'Webtoon',
      icon: <AlignVerticalSpaceAround size={14} />,
      desc: 'Continuous seamless gapless vertical strip',
    },
  ];

  const fitModes: { id: ComicFitMode; label: string }[] = [
    { id: 'original', label: '100% Original' },
    { id: 'fit-height', label: 'Fit Height' },
    { id: 'fit-width', label: 'Fit Width' },
    { id: 'fit-screen', label: 'Fit Screen' },
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
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '440px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px' }}>
            <Layers size={16} style={{ color: 'var(--color-accent)' }} />
            <span>Comic & Manga Options</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 1. Reading Mode Selection */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
            Reading Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '6px' }}>
            {readingModes.map((m) => {
              const active = settings.readingMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onUpdateSettings({ readingMode: m.id })}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: active ? '1.5px solid var(--color-accent)' : '1px solid var(--color-border)',
                    backgroundColor: active ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
                    color: active ? 'var(--color-accent)' : 'var(--color-text-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '12px' }}>
                    {m.icon}
                    <span>{m.label}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', lineHeight: 1.2 }}>
                    {m.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Fit Mode Selection */}
        {settings.readingMode !== 'webtoon' && (
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Fit Scale
            </label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              {fitModes.map((f) => {
                const active = settings.fitMode === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onUpdateSettings({ fitMode: f.id })}
                    style={{
                      flex: 1,
                      height: '28px',
                      borderRadius: 'var(--radius-xs)',
                      border: active ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                      backgroundColor: active ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
                      color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                      fontSize: '11px',
                      fontWeight: active ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Cover Auto-Split Option for Spread Modes */}
        {settings.readingMode !== 'single' && settings.readingMode !== 'webtoon' && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            <span>First page is Cover (Solo)</span>
            <input
              type="checkbox"
              checked={settings.firstPageCover}
              onChange={(e) => onUpdateSettings({ firstPageCover: e.target.checked })}
              style={{ accentColor: 'var(--color-accent)' }}
            />
          </label>
        )}

        {/* 4. Webtoon Options */}
        {settings.readingMode === 'webtoon' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              <span>Seamless Gapless Strip</span>
              <input
                type="checkbox"
                checked={settings.gapless}
                onChange={(e) => onUpdateSettings({ gapless: e.target.checked })}
                style={{ accentColor: 'var(--color-accent)' }}
              />
            </label>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                <span>Max Strip Width</span>
                <span style={{ fontWeight: 600 }}>{settings.webtoonMaxWidth}px</span>
              </div>
              <input
                type="range"
                min={600}
                max={1200}
                step={20}
                value={settings.webtoonMaxWidth}
                onChange={(e) => onUpdateSettings({ webtoonMaxWidth: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-accent)', marginTop: '4px' }}
              />
            </div>
          </div>
        )}

        {/* 5. Control Bar Placement */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Control Bar Position</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => updateAppSettings({ navPosition: 'bottom' })}
              style={{
                padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                backgroundColor: navPosition === 'bottom' ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
                color: navPosition === 'bottom' ? 'var(--color-accent)' : 'inherit',
                fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer',
              }}
            >
              <PanelBottom size={12} /><span>Bottom</span>
            </button>
            <button
              onClick={() => updateAppSettings({ navPosition: 'right' })}
              style={{
                padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                backgroundColor: navPosition === 'right' ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
                color: navPosition === 'right' ? 'var(--color-accent)' : 'inherit',
                fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer',
              }}
            >
              <PanelRight size={12} /><span>Right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
