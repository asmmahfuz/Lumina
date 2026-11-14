/**
 * Lumina Reader - Consolidated Header Menu
 * Unifies File actions, 5-theme palette swatches, reader settings, and insights into a single menu
 */

import React, { useState, useRef, useEffect } from 'react';
import { useReaderContext } from '@/app/Providers';
import { ReadingStats } from '@/types/stats';
import {
  Menu,
  FolderOpen,
  Save,
  Download,
  Library,
  Sliders,
  Flame,
  Check,
  Sun,
  Moon,
  Sparkles,
  Coffee,
  FileText,
  Plus,
  Minus,
  PanelBottom,
  PanelRight,
  Maximize2,
} from 'lucide-react';

export interface ConsolidatedHeaderMenuProps {
  onOpenFileClick: () => void;
  onSaveFile?: () => void;
  onSaveAsFile?: () => void;
  onOpenTypography: () => void;
  onOpenStats?: () => void;
  activeBookTitle?: string;
  isReading: boolean;
  stats?: ReadingStats;
}

export const ConsolidatedHeaderMenu: React.FC<ConsolidatedHeaderMenuProps> = ({
  onOpenFileClick,
  onSaveFile,
  onSaveAsFile,
  onOpenTypography,
  onOpenStats,
  activeBookTitle,
  isReading,
  stats,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme, typography, updateTypography, settings, updateSettings, isFullscreen, toggleFullscreen, setActiveView } = useReaderContext();
  const navPosition = settings.navPosition || 'bottom';

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const themes = [
    { id: 'oled' as const, label: 'OLED', bg: '#000000', text: '#e4e4e7', icon: <Moon size={11} /> },
    { id: 'slate' as const, label: 'Slate', bg: '#0f172a', text: '#f8fafc', icon: <Sparkles size={11} /> },
    { id: 'sepia' as const, label: 'Sepia', bg: '#fbf0d9', text: '#423223', icon: <Coffee size={11} /> },
    { id: 'paper' as const, label: 'Paper', bg: '#faf8f5', text: '#2d2a26', icon: <FileText size={11} /> },
    { id: 'light' as const, label: 'Light', bg: '#ffffff', text: '#18181b', icon: <Sun size={11} /> },
  ];

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title="Application Menu (File, Themes, Settings, Insights)"
        aria-label="Application Menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
        style={{
          height: '26px', width: '26px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
          backgroundColor: isOpen ? 'var(--color-surface-hover)' : 'var(--color-surface)',
          color: isOpen ? 'var(--color-accent)' : 'var(--color-text-primary)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Menu size={14} />
      </button>

      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: '280px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            zIndex: 9999,
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Header Title */}
          <div style={{ padding: '4px 6px 2px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lumina Menu</span>
            {activeBookTitle && (
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={activeBookTitle}>
                {activeBookTitle}
              </span>
            )}
          </div>

          {/* Section 1: File Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <button
              onClick={() => { onOpenFileClick(); setIsOpen(false); }}
              style={itemBtnStyle}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderOpen size={13} style={{ color: 'var(--color-accent)' }} />
                <span>Open File...</span>
              </div>
              <kbd style={kbdStyle}>Ctrl+O</kbd>
            </button>

            {isReading && onSaveFile && (
              <button
                onClick={() => { onSaveFile(); setIsOpen(false); }}
                style={itemBtnStyle}
                onMouseEnter={hoverOn}
                onMouseLeave={hoverOff}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={13} />
                  <span>Save File</span>
                </div>
                <kbd style={kbdStyle}>Ctrl+S</kbd>
              </button>
            )}

            {isReading && onSaveAsFile && (
              <button
                onClick={() => { onSaveAsFile(); setIsOpen(false); }}
                style={itemBtnStyle}
                onMouseEnter={hoverOn}
                onMouseLeave={hoverOff}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Download size={13} />
                  <span>Save As...</span>
                </div>
              </button>
            )}

            <button
              onClick={() => { setActiveView('library'); setIsOpen(false); }}
              style={itemBtnStyle}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Library size={13} style={{ color: 'var(--color-text-secondary)' }} />
                <span>Home & History</span>
              </div>
            </button>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--color-border-subtle)' }} />

          {/* Section 2: Circadian Themes Palette */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', paddingLeft: '4px' }}>Theme Palette</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
              {themes.map((t) => {
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    title={`${t.label} Theme`}
                    style={{
                      height: '28px', borderRadius: 'var(--radius-xs)', backgroundColor: t.bg, color: t.text,
                      border: isActive ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      boxShadow: isActive ? '0 0 0 1px var(--color-accent)' : 'none',
                    }}
                  >
                    {isActive ? <Check size={11} style={{ color: 'var(--color-accent)' }} /> : t.icon}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--color-border-subtle)' }} />

          {/* Section 3: Reader Settings */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', paddingLeft: '4px' }}>Font Size & Reader Settings</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Size ({typography.fontSize}px)</span>
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                <button
                  onClick={() => updateTypography({ fontSize: Math.max(9, typography.fontSize - 1) })}
                  title="Decrease Font Size"
                  style={toolBtnStyle}
                >
                  <Minus size={11} />
                </button>
                <button
                  onClick={() => updateTypography({ fontSize: Math.min(28, typography.fontSize + 1) })}
                  title="Increase Font Size"
                  style={toolBtnStyle}
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Control Bar</span>
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                <button
                  onClick={() => updateSettings({ navPosition: 'bottom' })}
                  title="Place Control Bar at Bottom"
                  style={{ ...toolBtnStyle, width: 'auto', padding: '0 6px', gap: '3px', fontSize: '10px', borderColor: navPosition === 'bottom' ? 'var(--color-accent)' : 'var(--color-border)', color: navPosition === 'bottom' ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
                >
                  <PanelBottom size={11} />
                  <span>Bottom</span>
                </button>
                <button
                  onClick={() => updateSettings({ navPosition: 'right' })}
                  title="Place Control Bar on Right (Vertical)"
                  style={{ ...toolBtnStyle, width: 'auto', padding: '0 6px', gap: '3px', fontSize: '10px', borderColor: navPosition === 'right' ? 'var(--color-accent)' : 'var(--color-border)', color: navPosition === 'right' ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
                >
                  <PanelRight size={11} />
                  <span>Right</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => { toggleFullscreen(); setIsOpen(false); }}
              style={itemBtnStyle}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Maximize2 size={13} style={{ color: 'var(--color-text-secondary)' }} />
                <span>{isFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
              </div>
              <span style={kbdStyle}>F11</span>
            </button>

            <button
              onClick={() => { onOpenTypography(); setIsOpen(false); }}
              style={itemBtnStyle}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={13} style={{ color: 'var(--color-accent)' }} />
                <span>All Typography Settings...</span>
              </div>
            </button>
          </div>

          {/* Section 4: Reading Insights */}
          {onOpenStats && (
            <>
              <div style={{ height: '1px', backgroundColor: 'var(--color-border-subtle)' }} />
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', paddingLeft: '4px' }}>Reading Insights</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '0 4px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  <span>🔥 {stats?.currentStreakDays ?? 0}d streak</span>
                  <span>⏱️ {Math.round((stats?.dailyActivity?.[new Date().toISOString().slice(0, 10)] ?? 0) / 60)}m today</span>
                  <span>⚡ {stats?.targetWpm ?? 220} wpm</span>
                </div>
                <button
                  onClick={() => { onOpenStats(); setIsOpen(false); }}
                  style={itemBtnStyle}
                  onMouseEnter={hoverOn}
                  onMouseLeave={hoverOff}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Flame size={13} style={{ color: '#f97316' }} />
                    <span>Detailed Stats & Pace...</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const itemBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
  padding: '6px 8px', borderRadius: 'var(--radius-xs)', border: 'none', backgroundColor: 'transparent',
  color: 'var(--color-text-primary)', fontSize: '12px', cursor: 'pointer', textAlign: 'left',
};

const toolBtnStyle: React.CSSProperties = {
  width: '22px', height: '22px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};

const kbdStyle: React.CSSProperties = {
  fontSize: '9px', padding: '1px 4px', borderRadius: '2px',
  backgroundColor: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)',
};

const hoverOn = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; };
const hoverOff = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = 'transparent'; };
