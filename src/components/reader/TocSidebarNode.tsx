/**
 * Lumina Reader - Table of Contents Sidebar Node
 * Recursive navigation item for table of contents in left sidebar
 */

import React from 'react';
import { TableOfContentsItem } from '@/types/epub';

interface TocSidebarNodeProps {
  item: TableOfContentsItem;
  onSelectHref: (href: string) => void;
  depth: number;
  currentSpineIndex: number;
  spineIndex?: number;
  getSpineIndexForHref?: (href: string) => number;
}

export const TocSidebarNode: React.FC<TocSidebarNodeProps> = ({
  item,
  onSelectHref,
  depth,
  currentSpineIndex,
  spineIndex: propSpineIndex,
  getSpineIndexForHref,
}) => {
  const resolvedSpineIndex =
    propSpineIndex !== undefined
      ? propSpineIndex
      : getSpineIndexForHref
      ? getSpineIndexForHref(item.href)
      : -1;

  const isActive = resolvedSpineIndex !== -1 && resolvedSpineIndex === currentSpineIndex;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={() => onSelectHref(item.href)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 8px',
          paddingLeft: `${depth * 12 + 8}px`,
          borderRadius: 'var(--radius-xs)',
          border: '1px solid',
          borderColor: isActive ? 'var(--color-accent)' : 'transparent',
          backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'transparent',
          color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)',
          cursor: 'pointer',
          fontSize: '11px',
          textAlign: 'left',
          fontWeight: isActive ? 600 : 400,
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {resolvedSpineIndex !== -1 && (
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
              fontFamily: 'monospace',
              minWidth: '28px',
            }}
          >
            #{resolvedSpineIndex + 1}
          </span>
        )}
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.label}
        </span>
      </button>

      {item.subitems && item.subitems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {item.subitems.map((sub) => (
            <TocSidebarNode
              key={sub.id}
              item={sub}
              onSelectHref={onSelectHref}
              depth={depth + 1}
              currentSpineIndex={currentSpineIndex}
              getSpineIndexForHref={getSpineIndexForHref}
            />
          ))}
        </div>
      )}
    </div>
  );
};
