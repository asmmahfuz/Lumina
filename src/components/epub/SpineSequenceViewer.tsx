/**
 * Lumina Reader - Reading Spine Sequence Viewer
 * Displays reading order, linear flags, and resolved archive paths
 */

import React from 'react';
import { EpubSpineItem } from '@/types/epub';
import { Layers } from 'lucide-react';

interface SpineSequenceViewerProps {
  spine: EpubSpineItem[];
  onReadChapter?: (index: number) => void;
}

export const SpineSequenceViewer: React.FC<SpineSequenceViewerProps> = ({ spine, onReadChapter }) => {
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
        <Layers size={14} style={{ color: 'var(--color-accent)' }} />
        Reading Spine Sequence &amp; Archive Manifest Resolution
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {spine.map((spineItem) => (
          <div
            key={spineItem.idref}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              fontSize: '11px',
            }}
          >
            <span
              style={{
                backgroundColor: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              #{spineItem.index + 1}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{spineItem.idref}</span>
            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace', flex: 1 }}>
              {spineItem.fullPath}
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: spineItem.linear ? 'var(--color-bg)' : 'rgba(239, 68, 68, 0.1)',
                color: spineItem.linear ? 'var(--color-text-secondary)' : '#EF4444',
              }}
            >
              {spineItem.linear ? 'Linear' : 'Non-linear'}
            </span>
            {onReadChapter && (
              <button
                onClick={() => onReadChapter(spineItem.index)}
                style={{
                  height: '22px',
                  padding: '0 8px',
                  fontSize: '10px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--color-surface-hover)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-accent)',
                  fontWeight: 600,
                }}
              >
                Read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
