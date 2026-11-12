/**
 * Lumina Reader - Fixed Document Outline (TOC) Tree
 * Hierarchical document outline bookmarks navigator with recursive tree expansion
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Bookmark as BookmarkIcon } from 'lucide-react';
import { FixedDocumentOutline } from '@/types/pdf';

interface FixedOutlineTreeProps {
  outline: FixedDocumentOutline[];
  currentPage: number;
  onSelectPage: (pageNumber: number) => void;
}

const OutlineNode: React.FC<{
  node: FixedDocumentOutline;
  currentPage: number;
  depth: number;
  onSelectPage: (pageNumber: number) => void;
}> = ({ node, currentPage, depth, onSelectPage }) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const hasChildren = node.children && node.children.length > 0;
  const isCurrent = node.pageNumber === currentPage;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.pageNumber) {
      onSelectPage(node.pageNumber);
    } else if (hasChildren) {
      setExpanded((prev) => !prev);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          paddingLeft: `${depth * 14 + 8}px`,
          fontSize: '11px',
          color: isCurrent ? 'var(--color-accent)' : 'var(--color-text-primary)',
          backgroundColor: isCurrent ? 'var(--color-accent-subtle)' : 'transparent',
          borderRadius: 'var(--radius-xs)',
          cursor: node.pageNumber ? 'pointer' : 'default',
          transition: 'background-color 100ms ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => !prev);
              }}
              style={{
                width: '16px',
                height: '16px',
                padding: 0,
                color: 'var(--color-text-secondary)',
              }}
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : (
            <div style={{ width: '16px' }} />
          )}

          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: isCurrent ? 600 : 400,
            }}
          >
            {node.title}
          </span>
        </div>

        {node.pageNumber && (
          <span
            style={{
              fontSize: '10px',
              color: 'var(--color-text-muted)',
              marginLeft: '6px',
              flexShrink: 0,
            }}
          >
            p. {node.pageNumber}
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {node.children!.map((child) => (
            <OutlineNode
              key={child.id}
              node={child}
              currentPage={currentPage}
              depth={depth + 1}
              onSelectPage={onSelectPage}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FixedOutlineTree: React.FC<FixedOutlineTreeProps> = ({
  outline,
  currentPage,
  onSelectPage,
}) => {
  if (outline.length === 0) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <BookmarkIcon size={24} style={{ opacity: 0.4 }} />
        <span>No outline bookmarks embedded in document.</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 4px', overflowY: 'auto' }}>
      {outline.map((item) => (
        <OutlineNode
          key={item.id}
          node={item}
          currentPage={currentPage}
          depth={0}
          onSelectPage={onSelectPage}
        />
      ))}
    </div>
  );
};
