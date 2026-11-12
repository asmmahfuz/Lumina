/**
 * Lumina Reader - Series Card
 * Displays series/book cover, title, author, language, chapter count,
 * reading progress with percentage, and expandable metadata details.
 */

import React, { useState } from 'react';
import { DublinCoreMetadata } from '@/types/epub';
import { BookOpen, User, ChevronDown, ChevronUp, Globe, Layers, PanelLeftClose } from 'lucide-react';

interface SeriesCardProps {
  metadata: DublinCoreMetadata;
  currentSpineIndex: number;
  totalChapters: number;
  progressPercent: number;
  onCollapse?: () => void;
}

export const SeriesCard: React.FC<SeriesCardProps> = ({
  metadata,
  currentSpineIndex,
  totalChapters,
  progressPercent,
  onCollapse,
}) => {
  const [showFullDetails, setShowFullDetails] = useState(false);

  return (
    <div
      style={{
        padding: '12px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {/* 1. Header with Cover, Title, Author & Collapse Button */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '46px',
            height: '64px',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xs)',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {metadata.coverBlobUrl ? (
            <img src={metadata.coverBlobUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <BookOpen size={20} style={{ color: 'var(--color-accent)', opacity: 0.6 }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4px' }}>
            <h3
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                lineHeight: 1.3,
                margin: 0,
                wordBreak: 'break-word',
              }}
              title={metadata.title}
            >
              {metadata.title}
            </h3>

            {onCollapse && (
              <button
                onClick={onCollapse}
                title="Collapse Sidebar"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <PanelLeftClose size={13} />
              </button>
            )}
          </div>

          {metadata.creator && (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: '1px',
              }}
            >
              <User size={10} style={{ color: 'var(--color-accent)' }} />
              {metadata.creator}
            </span>
          )}

          {/* Metadata Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
            {metadata.language && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Globe size={8} />
                {metadata.language.toUpperCase()}
              </span>
            )}

            <span
              style={{
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Layers size={8} />
              {totalChapters} Ch.
            </span>
          </div>
        </div>
      </div>

      {/* 2. Reading Progress & Percentage */}
      <div
        style={{
          padding: '6px 8px',
          backgroundColor: 'var(--color-bg)',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            Chapter {currentSpineIndex + 1} of {totalChapters}
          </span>
          <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '11px' }}>
            {progressPercent}%
          </span>
        </div>
        <div
          style={{
            height: '3px',
            backgroundColor: 'var(--color-surface-hover)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            marginTop: '4px',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: 'var(--color-accent)',
              transition: 'width 200ms ease',
            }}
          />
        </div>
      </div>

      {/* 3. Expandable Details Section */}
      <div>
        <button
          onClick={() => setShowFullDetails(!showFullDetails)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            background: 'none',
            border: 'none',
            padding: '2px 0',
            cursor: 'pointer',
            fontSize: '10px',
            color: 'var(--color-text-muted)',
            fontWeight: 500,
          }}
        >
          <span>{showFullDetails ? 'Hide Series Details' : 'Series Details'}</span>
          {showFullDetails ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        {showFullDetails && (
          <div
            style={{
              marginTop: '6px',
              padding: '6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '10px',
            }}
          >
            {metadata.publisher && (
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '9px', fontWeight: 600 }}>PUBLISHER</span>
                <p style={{ margin: '1px 0 0', color: 'var(--color-text-primary)' }}>{metadata.publisher}</p>
              </div>
            )}
            {metadata.pubdate && (
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '9px', fontWeight: 600 }}>PUBLISHED DATE</span>
                <p style={{ margin: '1px 0 0', color: 'var(--color-text-primary)' }}>{metadata.pubdate}</p>
              </div>
            )}
            {metadata.rights && (
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '9px', fontWeight: 600 }}>RIGHTS</span>
                <p style={{ margin: '1px 0 0', color: 'var(--color-text-primary)' }}>{metadata.rights}</p>
              </div>
            )}
            {metadata.description && (
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '9px', fontWeight: 600 }}>DESCRIPTION</span>
                <p
                  style={{
                    margin: '1px 0 0',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.4,
                    maxHeight: '100px',
                    overflowY: 'auto',
                  }}
                >
                  {metadata.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
