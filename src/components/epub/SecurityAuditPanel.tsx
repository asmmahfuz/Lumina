/**
 * Lumina Reader - Security & Zip-Slip Defense Audit Panel
 * Visualizes path traversal defenses, blocked attacks, and safe archive extraction integrity
 */

import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface SecurityAuditPanelProps {
  alerts: string[];
}

export const SecurityAuditPanel: React.FC<SecurityAuditPanelProps> = ({ alerts }) => {
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
        <ShieldCheck size={14} style={{ color: '#10B981' }} />
        Security &amp; Zip-Slip Path Traversal Protection Guard
      </h3>

      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
        All incoming archive files are inspected for malicious directory traversal sequences (such as `../`,
        null bytes, or absolute drive paths) before any byte is decompressed or indexed into memory.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {alerts.length > 0 ? (
          alerts.map((alert, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#EF4444',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
            >
              <ShieldAlert size={14} style={{ flexShrink: 0 }} />
              <span>{alert}</span>
            </div>
          ))
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#10B981',
              fontSize: '12px',
            }}
          >
            <ShieldCheck size={16} />
            <span>Zero security violations detected in current document archive. Zip-Slip guard active.</span>
          </div>
        )}
      </div>
    </div>
  );
};
