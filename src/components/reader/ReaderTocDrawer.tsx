/**
 * Lumina Reader - Slide-Over Table of Contents Drawer
 * Slide-over navigation panel for fast chapter jumping during active reading
 */

import React from 'react';
import { TableOfContentsItem } from '@/types/epub';
import { X, Bookmark, ChevronRight } from 'lucide-react';

interface ReaderTocDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  toc: TableOfContentsItem[];
  onSelectChapter: (href: string) => void;
  bookTitle?: string;
}

export const ReaderTocDrawer: React.FC<ReaderTocDrawerProps> = ({
  isOpen,
  onClose,
  toc,
  onSelectChapter,
  bookTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-drawer)',
        display: 'flex',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '320px',
          maxWidth: '85vw',
          height: '100%',
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700 }}>Table of Contents</h3>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              {bookTitle || 'Chapters'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* TOC Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {toc.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              No chapters in navigation manifest
            </div>
          ) : (
            toc.map((item) => (
              <TocDrawerItem key={item.id} item={item} onSelect={onSelectChapter} onClose={onClose} depth={0} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const TocDrawerItem: React.FC<{
  item: TableOfContentsItem;
  onSelect: (href: string) => void;
  onClose: () => void;
  depth: number;
}> = ({ item, onSelect, onClose, depth }) => {
  const hasSubitems = item.subitems && item.subitems.length > 0;

  const handleClick = () => {
    onSelect(item.href);
    onClose();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 10px',
          paddingLeft: `${depth * 14 + 10}px`,
          borderRadius: 'var(--radius-sm)',
          background: 'none',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
          color: 'var(--color-text-primary)',
          fontSize: '12px',
          transition: 'background-color 150ms ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Bookmark size={12} style={{ color: 'var(--color-accent)', flexShrink: 0, opacity: 0.8 }} />
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.label}
        </span>
        <ChevronRight size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
      </button>

      {hasSubitems && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {item.subitems!.map((sub) => (
            <TocDrawerItem key={sub.id} item={sub} onSelect={onSelect} onClose={onClose} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
