/**
 * Lumina Reader - Comic Metadata Information Panel
 * Displays Dublin Core / ComicInfo.xml metadata: series, writer, penciller, issue, and plot summary
 */

import React from 'react';
import { ComicMetadata } from '@/types/comic';

interface ComicInfoPanelProps {
  metadata: ComicMetadata;
  totalPageCount: number;
}

export const ComicInfoPanel: React.FC<ComicInfoPanelProps> = ({ metadata, totalPageCount }) => {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', fontSize: '12px' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
        {metadata.title}
      </div>

      {metadata.series && (
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Series: </span>
          <span style={{ fontWeight: 600 }}>{metadata.series}</span>
          {metadata.number && <span> #{metadata.number}</span>}
        </div>
      )}

      {metadata.writer && (
        <div style={{ marginBottom: '6px' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Writer: </span>
          <span>{metadata.writer}</span>
        </div>
      )}

      {metadata.penciller && (
        <div style={{ marginBottom: '6px' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Art / Penciller: </span>
          <span>{metadata.penciller}</span>
        </div>
      )}

      {metadata.publisher && (
        <div style={{ marginBottom: '6px' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Publisher: </span>
          <span>{metadata.publisher}</span>
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>Total Pages: </span>
        <span style={{ fontWeight: 600 }}>{totalPageCount}</span>
      </div>

      {metadata.summary && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-bg)',
            lineHeight: 1.5,
            color: 'var(--color-text-secondary)',
          }}
        >
          {metadata.summary}
        </div>
      )}
    </div>
  );
};
