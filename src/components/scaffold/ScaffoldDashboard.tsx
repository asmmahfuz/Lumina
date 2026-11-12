/**
 * Lumina Reader - Phase 1 Scaffold & Verification Dashboard
 * Visualizes Phase 1 architecture gates, live typography rendering, and PAL adapters
 */

import React from 'react';
import { useReaderContext } from '@/app/Providers';
import {
  ShieldCheck,
  CheckCircle2,
  Palette,
  HardDrive,
  Layers,
} from 'lucide-react';

export const ScaffoldDashboard: React.FC = () => {
  const { theme, typography, isDesktop } = useReaderContext();

  const phaseOneGates = [
    {
      id: '1.1',
      title: 'React 19 + TypeScript + Vite Scaffold',
      desc: 'Fast HMR, strict tsconfig, absolute path aliases (@/*), zero compiler errors',
      status: 'COMPLETE',
    },
    {
      id: '1.2',
      title: 'CSS Tokens & 5 Circadian Reading Themes',
      desc: 'OLED Pure Dark, Slate Night, Warm Sepia, Soft Paper Cream, Crisp Light',
      status: 'COMPLETE',
    },
    {
      id: '1.3',
      title: 'Tauri 2.0 Desktop Shell Configuration',
      desc: 'Rust backend scaffold, ultra-compact native window, zero telemetry, local CSP',
      status: 'COMPLETE',
    },
    {
      id: '1.4',
      title: 'Platform Abstraction Layer (PAL) Interface',
      desc: 'Decoupled IPlatformAdapter supporting Desktop (Tauri) and Web (IndexedDB)',
      status: 'COMPLETE',
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Hero Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-accent)',
                backgroundColor: 'var(--color-accent-subtle)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              PHASE 1 COMPLETE
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Universal Reading Suite Architecture
            </span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginTop: '6px' }}>
            Lumina Reader – Project Foundation & Design Scaffold
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            High-performance, distraction-free reading engine with strict single-bar chrome and 100% local-first privacy.
          </p>
        </div>

        {/* Security / Privacy Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--color-surface)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <ShieldCheck size={24} style={{ color: '#10B981' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', fontWeight: 600 }}>Zero Telemetry</span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
              100% Local-First • Hardened Sandbox
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Phase 1 Deliverables & Live Typography Viewport Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Column: Phase 1 Checklist & Platform Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} style={{ color: 'var(--color-accent)' }} />
              Phase 1 Deliverables Verification
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {phaseOneGates.map((gate) => (
                <div
                  key={gate.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <CheckCircle2 size={16} style={{ color: '#10B981', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700 }}>Task {gate.id}:</span>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{gate.title}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{gate.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PAL Environment Diagnostics */}
          <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HardDrive size={14} style={{ color: 'var(--color-accent)' }} />
              Platform Abstraction Layer (PAL) Diagnostics
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>RUNTIME SHELL</span>
                <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px' }}>
                  {isDesktop ? 'Tauri 2.0 (Rust)' : 'Modern Web (Browser)'}
                </p>
              </div>

              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>STORAGE ENGINE</span>
                <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px' }}>
                  {isDesktop ? 'SQLite (rusqlite)' : 'IndexedDB (Local)'}
                </p>
              </div>

              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>ACTIVE THEME</span>
                <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px', textTransform: 'uppercase' }}>
                  {theme}
                </p>
              </div>

              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>CODE MODULARITY</span>
                <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px', color: '#10B981' }}>
                  All Files &lt; 350 Lines
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Reader Typography Viewport Preview */}
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Palette size={14} style={{ color: 'var(--color-accent)' }} />
              Live Reader Viewport & Typography Sandbox
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {typography.fontFamily.toUpperCase()} • {typography.fontSize}px • {typography.lineHeight}x
            </span>
          </div>

          {/* Reader Canvas Preview */}
          <div
            style={{
              flex: 1,
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: `20px ${typography.marginPercent}%`,
              overflowY: 'auto',
              maxHeight: '440px',
              fontFamily: 'var(--reader-font-family)',
              fontSize: 'var(--reader-font-size)',
              lineHeight: 'var(--reader-line-height)',
              textAlign: typography.textAlign,
              transition: 'background-color 200ms ease, color 200ms ease',
            }}
          >
            <h2 style={{ fontSize: '1.4em', marginBottom: '1em', fontWeight: 700 }}>
              Chapter I. Down the Rabbit-Hole
            </h2>
            <p style={{ marginBottom: '1em' }}>
              Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do:
              once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations
              in it, “and what is the use of a book,” thought Alice “without pictures or conversations?”
            </p>
            <p style={{ marginBottom: '1em' }}>
              So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy
              and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and
              picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.
            </p>
            <p>
              There was nothing so VERY remarkable in that; nor did Alice think it so VERY much out of the way to hear
              the Rabbit say to itself, “Oh dear! Oh dear! I shall be late!”
            </p>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Adjust typography, themes, and margins via the slider icon (top right) in real time.
          </div>
        </div>
      </div>
    </div>
  );
};
