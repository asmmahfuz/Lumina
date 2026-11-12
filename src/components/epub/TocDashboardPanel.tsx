/**
 * Lumina Reader - Table of Contents Dashboard Panel
 * Renders hierarchical TOC tree card in the Phase 2 engine inspector
 */

import React from 'react';
import { FolderTree } from 'lucide-react';
import { TableOfContentsItem } from '@/types/book';
import { TocTreeView } from './TocTreeView';

interface TocDashboardPanelProps {
  toc: TableOfContentsItem[];
}

export const TocDashboardPanel: React.FC<TocDashboardPanelProps> = ({ toc }) => {
  return (
    <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
      <h3
        style={{
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <FolderTree size={14} style={{ color: 'var(--color-accent)' }} />
        Recursive Table of Contents (NCX / NAV)
      </h3>
      {toc.length > 0 ? (
        <TocTreeView items={toc} />
      ) : (
        <div style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
          No Table of Contents navigation elements found in this document.
        </div>
      )}
    </div>
  );
};
