/**
 * Lumina Reader - Global State Providers
 * Handles themes, typography engine, platform adapters, and zen mode state
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  DEFAULT_READER_SETTINGS,
  ReaderSettings,
  ReaderTypography,
  ReadingTheme,
} from '@/types/book';
import { getPlatformAdapter, isDesktopEnvironment } from '@/services/platform';

interface ReaderContextValue {
  settings: ReaderSettings;
  theme: ReadingTheme;
  typography: ReaderTypography;
  zenMode: boolean;
  isDesktop: boolean;
  activeView: 'library' | 'reader' | 'comic' | 'fixed' | 'scaffold' | 'epub-engine';
  setTheme: (theme: ReadingTheme) => void;
  updateTypography: (updates: Partial<ReaderTypography>) => void;
  toggleZenMode: () => void;
  setActiveView: (view: 'library' | 'reader' | 'comic' | 'fixed' | 'scaffold' | 'epub-engine') => void;
}

const ReaderContext = createContext<ReaderContextValue | null>(null);

export const ReaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS);
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'library' | 'reader' | 'comic' | 'fixed' | 'scaffold' | 'epub-engine'>('library');
  const [isDesktop] = useState<boolean>(isDesktopEnvironment());

  // Load initial settings on mount
  useEffect(() => {
    const adapter = getPlatformAdapter();
    adapter
      .init()
      .then(() => adapter.getSettings())
      .then((loadedSettings) => {
        setSettings(loadedSettings);
        applyThemeToDom(loadedSettings.theme);
        applyTypographyToDom(loadedSettings.typography);
      })
      .catch((err) => {
        console.warn('Failed to initialize adapter settings:', err);
      });
  }, []);

  const applyThemeToDom = (theme: ReadingTheme) => {
    document.documentElement.setAttribute('data-theme', theme);
  };

  const applyTypographyToDom = (typo: ReaderTypography) => {
    const root = document.documentElement;
    root.style.setProperty('--reader-font-size', `${typo.fontSize}px`);
    root.style.setProperty('--reader-line-height', `${typo.lineHeight}`);
    root.style.setProperty('--reader-margin-horizontal', `${typo.marginPercent}%`);
    root.style.setProperty('--reader-text-align', typo.textAlign);

    const fontFamilies: Record<string, string> = {
      serif: 'var(--font-serif)',
      slab: 'var(--font-slab)',
      sans: 'var(--font-sans)',
      hyperlegible: 'var(--font-hyperlegible)',
      mono: 'var(--font-mono)',
    };
    root.style.setProperty('--reader-font-family', fontFamilies[typo.fontFamily] || 'var(--font-serif)');
  };

  const setTheme = (newTheme: ReadingTheme) => {
    const updated = { ...settings, theme: newTheme };
    setSettings(updated);
    applyThemeToDom(newTheme);
    getPlatformAdapter().saveSettings(updated).catch(console.error);
  };

  const updateTypography = (updates: Partial<ReaderTypography>) => {
    const updatedTypo = { ...settings.typography, ...updates };
    const updated = { ...settings, typography: updatedTypo };
    setSettings(updated);
    applyTypographyToDom(updatedTypo);
    getPlatformAdapter().saveSettings(updated).catch(console.error);
  };

  const toggleZenMode = () => {
    setZenMode((prev) => !prev);
  };

  return (
    <ReaderContext.Provider
      value={{
        settings,
        theme: settings.theme,
        typography: settings.typography,
        zenMode,
        isDesktop,
        activeView,
        setTheme,
        updateTypography,
        toggleZenMode,
        setActiveView,
      }}
    >
      {children}
    </ReaderContext.Provider>
  );
};

export function useReaderContext(): ReaderContextValue {
  const ctx = useContext(ReaderContext);
  if (!ctx) {
    throw new Error('useReaderContext must be used within ReaderProvider');
  }
  return ctx;
}
