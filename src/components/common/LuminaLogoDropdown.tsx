/**
 * Lumina Reader - Brand Logo & Application Action Dropdown
 * Unified desktop application menu for File Open, Save, Save As, and global settings
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  FolderOpen,
  Save,
  Download,
  Library,
  Flame,
  Sliders,
} from 'lucide-react';
import { useReaderContext } from '@/app/Providers';

interface LuminaLogoDropdownProps {
  onOpenFileClick: () => void;
  onSaveFile?: () => void;
  onSaveAsFile?: () => void;
  onOpenTypography: () => void;
  onOpenStats?: () => void;
  activeBookTitle?: string;
  isReading?: boolean;
}

export const LuminaLogoDropdown: React.FC<LuminaLogoDropdownProps> = ({
  onOpenFileClick,
  onSaveFile,
  onSaveAsFile,
  onOpenTypography,
  onOpenStats,
  activeBookTitle,
  isReading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { activeView, setActiveView } = useReaderContext();

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleOpenClick = () => {
    setIsOpen(false);
    onOpenFileClick();
  };

  const handleSaveClick = () => {
    setIsOpen(false);
    onSaveFile?.();
  };

  const handleSaveAsClick = () => {
    setIsOpen(false);
    onSaveAsFile?.();
  };

  const handleLibraryClick = () => {
    setIsOpen(false);
    setActiveView('library');
  };

  const handleTypographyClick = () => {
    setIsOpen(false);
    onOpenTypography();
  };

  const handleStatsClick = () => {
    setIsOpen(false);
    onOpenStats?.();
  };

  const hasActiveDocument = Boolean(isReading || activeBookTitle);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title="Lumina Application Menu (Open, Save, Settings)"
        aria-haspopup="true"
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          height: '22px',
          padding: '0 6px',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid',
          borderColor: isOpen ? 'var(--color-accent)' : 'transparent',
          backgroundColor: isOpen ? 'var(--color-surface-hover)' : 'transparent',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '12px',
          transition: 'all 120ms ease',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <BookOpen size={14} style={{ color: 'var(--color-accent)' }} />
        <span>Lumina</span>
      </button>

      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: '200px',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg), 0 8px 24px var(--color-shadow)',
            padding: '4px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            animation: 'fadeIn 120ms ease-out',
            fontSize: '11px',
          }}
        >
          {/* Header Info */}
          <div
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--color-border)',
              marginBottom: '2px',
            }}
          >
            <span>Lumina Reader</span>
            <span
              style={{
                fontSize: '9px',
                padding: '1px 4px',
                borderRadius: '3px',
                backgroundColor: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
                fontWeight: 600,
              }}
            >
              Local-First
            </span>
          </div>

          {/* Open File */}
          <button
            onClick={handleOpenClick}
            style={dropdownItemStyle}
            onMouseEnter={handleItemHover}
            onMouseLeave={handleItemLeave}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FolderOpen size={13} style={{ color: 'var(--color-accent)' }} />
              <span>Open File...</span>
            </div>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>Ctrl+O</span>
          </button>

          {/* Save File */}
          <button
            onClick={handleSaveClick}
            disabled={!hasActiveDocument}
            style={{
              ...dropdownItemStyle,
              opacity: hasActiveDocument ? 1 : 0.45,
              cursor: hasActiveDocument ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e) => {
              if (hasActiveDocument) handleItemHover(e);
            }}
            onMouseLeave={handleItemLeave}
            title={hasActiveDocument ? 'Save active document' : 'Open a document to save'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={13} style={{ color: 'var(--color-accent)' }} />
              <span>Save File</span>
            </div>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>Ctrl+S</span>
          </button>

          {/* Save As... */}
          <button
            onClick={handleSaveAsClick}
            disabled={!hasActiveDocument}
            style={{
              ...dropdownItemStyle,
              opacity: hasActiveDocument ? 1 : 0.45,
              cursor: hasActiveDocument ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e) => {
              if (hasActiveDocument) handleItemHover(e);
            }}
            onMouseLeave={handleItemLeave}
            title={hasActiveDocument ? 'Save copy of active document with custom name' : 'Open a document to save as'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={13} style={{ color: 'var(--color-accent)' }} />
              <span>Save As...</span>
            </div>
          </button>

          <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '3px 0' }} />

          {/* Library Catalog */}
          <button
            onClick={handleLibraryClick}
            style={dropdownItemStyle}
            onMouseEnter={handleItemHover}
            onMouseLeave={handleItemLeave}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Library size={13} style={{ color: 'var(--color-text-secondary)' }} />
              <span>Library Catalog</span>
            </div>
            {activeView === 'library' && (
              <span style={{ fontSize: '9px', color: 'var(--color-accent)', fontWeight: 600 }}>Active</span>
            )}
          </button>

          {/* Reading Insights */}
          {onOpenStats && (
            <button
              onClick={handleStatsClick}
              style={dropdownItemStyle}
              onMouseEnter={handleItemHover}
              onMouseLeave={handleItemLeave}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={13} style={{ color: '#f97316' }} />
                <span>Reading Insights</span>
              </div>
            </button>
          )}

          {/* Typography Settings */}
          <button
            onClick={handleTypographyClick}
            style={dropdownItemStyle}
            onMouseEnter={handleItemHover}
            onMouseLeave={handleItemLeave}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={13} style={{ color: 'var(--color-text-secondary)' }} />
              <span>Typography & Themes</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

const dropdownItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  padding: '5px 8px',
  borderRadius: 'var(--radius-xs)',
  backgroundColor: 'transparent',
  border: 'none',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  fontSize: '11px',
  textAlign: 'left',
  width: '100%',
  transition: 'background-color 100ms ease, color 100ms ease',
};

const handleItemHover = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
};

const handleItemLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.backgroundColor = 'transparent';
};
