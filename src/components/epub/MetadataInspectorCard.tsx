/**
 * Lumina Reader - Dublin Core Metadata & Cover Inspector Card
 * Visualizes extracted title, creator, publisher, date, language, and cover artwork
 */

import React from 'react';
import { ParsedEpubBook } from '@/types/epub';
import { BookOpen, User, Building, Calendar, Globe, Shield, FileCode } from 'lucide-react';

interface MetadataInspectorCardProps {
  book: ParsedEpubBook;
  onReadBook?: () => void;
}

export const MetadataInspectorCard: React.FC<MetadataInspectorCardProps> = ({ book, onReadBook }) => {
  const { metadata, opfPath, version } = book;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={14} style={{ color: 'var(--color-accent)' }} />
          Dublin Core Metadata &amp; Cover Art
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-accent-subtle)',
              color: 'var(--color-accent)',
            }}
          >
            EPUB {version}
          </span>
          {onReadBook && (
            <button
              onClick={onReadBook}
              style={{
                height: '24px',
                padding: '0 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-accent-text)',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <BookOpen size={12} />
              <span>Read Book</span>
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Cover Art Preview */}
        <div
          style={{
            width: '120px',
            height: '170px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {metadata.coverBlobUrl ? (
            <img
              src={metadata.coverBlobUrl}
              alt={metadata.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '12px', color: 'var(--color-text-muted)' }}>
              <BookOpen size={28} style={{ opacity: 0.5, margin: '0 auto 6px' }} />
              <div style={{ fontSize: '10px' }}>No Cover Image</div>
            </div>
          )}
        </div>

        {/* Metadata Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1.3,
            }}
          >
            {metadata.title}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px' }}>
            {metadata.creator && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <User size={12} style={{ color: 'var(--color-accent)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{metadata.creator}</span>
              </div>
            )}
            {metadata.publisher && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <Building size={12} style={{ color: 'var(--color-accent)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{metadata.publisher}</span>
              </div>
            )}
            {metadata.pubdate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <Calendar size={12} style={{ color: 'var(--color-accent)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{metadata.pubdate}</span>
              </div>
            )}
            {metadata.language && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <Globe size={12} style={{ color: 'var(--color-accent)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>Language: {metadata.language.toUpperCase()}</span>
              </div>
            )}
            {metadata.rights && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <Shield size={12} style={{ color: 'var(--color-accent)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{metadata.rights}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <FileCode size={12} style={{ color: 'var(--color-accent)' }} />
              <span style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{opfPath}</span>
            </div>
          </div>

          {metadata.description && (
            <p
              style={{
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5,
                marginTop: '4px',
                backgroundColor: 'var(--color-surface)',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                maxHeight: '70px',
                overflowY: 'auto',
              }}
            >
              {metadata.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
