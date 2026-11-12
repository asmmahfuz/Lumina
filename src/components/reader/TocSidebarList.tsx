/**
 * Lumina Reader - Table of Contents Sidebar List
 * Renders hierarchical TOC nodes or flat spine list with real-time chapter search
 */

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { TableOfContentsItem, EpubSpineItem } from '@/types/epub';
import { TocSidebarNode } from './TocSidebarNode';

interface TocSidebarListProps {
  toc: TableOfContentsItem[];
  spine: EpubSpineItem[];
  currentSpineIndex: number;
  onSelectSpineIndex: (index: number) => void;
  onSelectTocHref: (href: string) => void;
}

export const TocSidebarList: React.FC<TocSidebarListProps> = ({
  toc,
  spine,
  currentSpineIndex,
  onSelectSpineIndex,
  onSelectTocHref,
}) => {
  const [searchFilter, setSearchFilter] = useState('');

  // Map TOC hrefs to spine indices for rapid lookup
  const spinePathToIndex = useMemo(() => {
    const map = new Map<string, number>();
    spine.forEach((item, idx) => {
      map.set(item.fullPath, idx);
      const fileName = item.fullPath.split('/').pop() || '';
      if (fileName && !map.has(fileName)) {
        map.set(fileName, idx);
      }
    });
    return map;
  }, [spine]);

  const getSpineIndexForHref = (href: string): number => {
    const clean = href.split('#')[0];
    if (spinePathToIndex.has(clean)) return spinePathToIndex.get(clean)!;
    const fileName = clean.split('/').pop() || '';
    if (spinePathToIndex.has(fileName)) return spinePathToIndex.get(fileName)!;
    const idx = spine.findIndex((s) => s.fullPath.endsWith(clean) || clean.endsWith(s.fullPath));
    return idx !== -1 ? idx : -1;
  };

  const hasToc = toc && toc.length > 0;
  const totalChapters = hasToc ? toc.length : spine.length;

  const filteredToc = useMemo(() => {
    if (!hasToc) return [];
    if (!searchFilter.trim()) return toc;
    const term = searchFilter.toLowerCase();

    const matchesItem = (item: TableOfContentsItem): boolean => {
      const labelMatch = item.label.toLowerCase().includes(term);
      const spineIdx = getSpineIndexForHref(item.href);
      const numMatch = spineIdx !== -1 && `chapter ${spineIdx + 1}`.includes(term);
      const subMatch = item.subitems?.some(matchesItem) ?? false;
      return labelMatch || numMatch || subMatch;
    };

    return toc.filter(matchesItem);
  }, [toc, searchFilter, hasToc, spinePathToIndex]);

  const filteredSpine = useMemo(() => {
    if (hasToc) return [];
    if (!searchFilter.trim()) return spine;
    const term = searchFilter.toLowerCase();
    return spine.filter(
      (item) =>
        item.idref.toLowerCase().includes(term) ||
        item.fullPath.toLowerCase().includes(term) ||
        `chapter ${item.index + 1}`.includes(term)
    );
  }, [spine, searchFilter, hasToc]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Chapters Header & Search Filter */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 8px',
            height: '26px',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xs)',
          }}
        >
          <Search size={11} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder={`Search ${totalChapters} chapters...`}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              fontSize: '11px',
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Interactive Chapters List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {hasToc
            ? filteredToc.map((item) => (
                <TocSidebarNode
                  key={item.id}
                  item={item}
                  onSelectHref={onSelectTocHref}
                  depth={0}
                  currentSpineIndex={currentSpineIndex}
                  spineIndex={getSpineIndexForHref(item.href)}
                  getSpineIndexForHref={getSpineIndexForHref}
                />
              ))
            : filteredSpine.map((item) => {
                const isActive = item.index === currentSpineIndex;
                const fileName = item.fullPath.split('/').pop() || item.idref;

                return (
                  <button
                    key={item.idref}
                    onClick={() => onSelectSpineIndex(item.index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 8px',
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
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        fontFamily: 'monospace',
                        minWidth: '28px',
                      }}
                    >
                      #{item.index + 1}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {fileName.replace(/\.x?html?$/i, '').replace(/[-_]/g, ' ')}
                    </span>
                  </button>
                );
              })}
        </div>
      </div>
    </div>
  );
};
