/**
 * Lumina Reader - Book Details Panel
 * Displays Dublin Core metadata, language, publisher, and overview in sidebar
 */

import React from 'react';
import { DublinCoreMetadata } from '@/types/epub';

interface BookDetailsPanelProps {
  metadata: DublinCoreMetadata;
  totalChapters: number;
}

export const BookDetailsPanel: React.FC<BookDetailsPanelProps> = ({ metadata, totalChapters }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '6px', fontSize: '11px' }}>
      <div>
        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>TITLE</span>
        <p style={{ margin: '2px 0 0', fontWeight: 600 }}>{metadata.title}</p>
      </div>
      {metadata.creator && (
        <div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>AUTHOR</span>
          <p style={{ margin: '2px 0 0' }}>{metadata.creator}</p>
        </div>
      )}
      {metadata.publisher && (
        <div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>PUBLISHER</span>
          <p style={{ margin: '2px 0 0' }}>{metadata.publisher}</p>
        </div>
      )}
      {metadata.language && (
        <div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>LANGUAGE</span>
          <p style={{ margin: '2px 0 0' }}>{metadata.language.toUpperCase()}</p>
        </div>
      )}
      <div>
        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>TOTAL CHAPTERS</span>
        <p style={{ margin: '2px 0 0', fontWeight: 600 }}>{totalChapters} Spine Items</p>
      </div>
      {metadata.description && (
        <div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>DESCRIPTION</span>
          <p
            style={{
              margin: '2px 0 0',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.4,
              maxHeight: '120px',
              overflowY: 'auto',
            }}
          >
            {metadata.description}
          </p>
        </div>
      )}
    </div>
  );
};
