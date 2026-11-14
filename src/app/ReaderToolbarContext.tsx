/**
 * Lumina Reader - Top Header Reader Toolbar Context
 * Lets each active reader register its zoom/fit/mode controls in the top bar
 * without triggering root App component re-renders.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FixedFitMode, FixedReadingMode } from '@/types/pdf';
import { ComicReadingMode } from '@/types/comic';

export interface FixedToolbarControls {
  kind: 'fixed';
  currentPage: number;
  totalPages: number;
  scale: number;
  fitMode: FixedFitMode;
  readingMode: FixedReadingMode;
  showTextLayer: boolean;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onSetFitMode: (mode: FixedFitMode) => void;
  onToggleReadingMode: () => void;
  onToggleTextLayer: () => void;
}

export interface ComicToolbarControls {
  kind: 'comic';
  currentPage: number;
  totalPages: number;
  readingMode: ComicReadingMode;
  isSpread: boolean;
  onGoToPage: (page: number) => void;
  onToggleSettings: () => void;
}

export interface EpubToolbarControls {
  kind: 'epub';
  currentChapter: number;
  totalChapters: number;
  progressPercent?: number;
  chapterTitle?: string;
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

export type ActiveToolbarControls =
  | FixedToolbarControls
  | ComicToolbarControls
  | EpubToolbarControls
  | null;

interface ReaderToolbarContextValue {
  toolbarControls: ActiveToolbarControls;
  setToolbarControls: (controls: ActiveToolbarControls) => void;
}

const ReaderToolbarContext = createContext<ReaderToolbarContextValue>({
  toolbarControls: null,
  setToolbarControls: () => {},
});

export const ReaderToolbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toolbarControls, setToolbarControlsState] = useState<ActiveToolbarControls>(null);
  const setToolbarControls = useCallback((controls: ActiveToolbarControls) => {
    setToolbarControlsState(controls);
  }, []);

  return (
    <ReaderToolbarContext.Provider value={{ toolbarControls, setToolbarControls }}>
      {children}
    </ReaderToolbarContext.Provider>
  );
};

export function useReaderToolbar(): ReaderToolbarContextValue {
  return useContext(ReaderToolbarContext);
}
