/**
 * Lumina Reader - Table of Contents Recursive Tree View
 * Visualizes hierarchical navigation items and chapter jump targets
 */

import React, { useState } from 'react';
import { TableOfContentsItem } from '@/types/epub';
import { ChevronRight, ChevronDown, Bookmark, Hash } from 'lucide-react';

interface TocTreeViewProps {
  items: TableOfContentsItem[];
  depth?: number;
}

export const TocTreeView: React.FC<TocTreeViewProps> = ({ items, depth = 0 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {items.map((item) => (
        <TocNode key={item.id} item={item} depth={depth} />
      ))}
    </div>
  );
};

const TocNode: React.FC<{ item: TableOfContentsItem; depth: number }> = ({ item, depth }) => {
  const [collapsed, setCollapsed] = useState(false);
  const hasSubitems = item.subitems && item.subitems.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 8px',
          paddingLeft: `${depth * 18 + 8}px`,
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          fontSize: '12px',
          transition: 'background-color 150ms ease',
        }}
      >
        {hasSubitems ? (
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </button>
        ) : (
          <Bookmark size={12} style={{ color: 'var(--color-accent)', opacity: 0.7 }} />
        )}

        <span style={{ fontWeight: hasSubitems ? 600 : 400, flex: 1, color: 'var(--color-text-primary)' }}>
          {item.label}
        </span>

        <span
          style={{
            fontSize: '10px',
            color: 'var(--color-text-muted)',
            fontFamily: 'monospace',
            backgroundColor: 'var(--color-bg)',
            padding: '1px 6px',
            borderRadius: 'var(--radius-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}
          title={item.href}
        >
          <Hash size={9} />
          {item.href.split('/').pop()}
        </span>
      </div>

      {hasSubitems && !collapsed && (
        <div style={{ marginTop: '4px', marginLeft: '6px' }}>
          <TocTreeView items={item.subitems!} depth={depth + 1} />
        </div>
      )}
    </div>
  );
};
