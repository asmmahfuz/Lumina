/**
 * Lumina Reader - Active Reading Session & Stats Tracker Hook
 * Tracks reading time silently in memory without triggering 5s root React re-renders,
 * flushing to localStorage on book switch, idle pause, or tab close.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StatsEngine } from './statsEngine';
import { ReadingStats, ChapterReadingEstimate } from '@/types/stats';

const IDLE_TIMEOUT_MS = 45000;
const FLUSH_INTERVAL_MS = 30000;
const TICK_MS = 5000;

interface UseReadingTrackerProps {
  bookId?: string | null;
  chapterContent?: string;
  isReadingActive?: boolean;
  pagesInfo?: { current: number; total: number };
}

export function useReadingTracker({
  bookId,
  chapterContent,
  isReadingActive = false,
  pagesInfo,
}: UseReadingTrackerProps) {
  const [stats, setStats] = useState<ReadingStats>(() => StatsEngine.loadStats());
  const lastActiveRef = useRef<number>(Date.now());
  const pendingSecondsRef = useRef<number>(0);
  const wpmRef = useRef<number>(stats.targetWpm);
  wpmRef.current = stats.targetWpm;

  const flushPendingActivity = useCallback((targetBookId?: string | null) => {
    const secs = pendingSecondsRef.current;
    if (secs <= 0 || !targetBookId) return;
    pendingSecondsRef.current = 0;
    const wordsDelta = Math.round((wpmRef.current / 60) * secs);
    StatsEngine.recordActivity(targetBookId, secs, wordsDelta);
  }, []);

  const wordCount = useMemo(() => {
    return chapterContent ? StatsEngine.calculateWordCount(chapterContent) : 0;
  }, [chapterContent]);

  const chapterEstimate: ChapterReadingEstimate = useMemo(() => {
    if (pagesInfo && !chapterContent) {
      const remainingPages = Math.max(0, pagesInfo.total - pagesInfo.current);
      const estimatedMinutes = Math.ceil(remainingPages * 1.0);
      return {
        wordCount: remainingPages * 150,
        estimatedMinutes,
        formattedTime: estimatedMinutes < 1 ? '< 1 min' : `${estimatedMinutes} min`,
      };
    }
    return StatsEngine.estimateReadingTime(wordCount, stats.targetWpm);
  }, [wordCount, stats.targetWpm, pagesInfo, chapterContent]);

  useEffect(() => {
    const handleActivity = () => {
      lastActiveRef.current = Date.now();
    };
    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  // Silent accumulator: never calls setState in background loop
  useEffect(() => {
    if (!isReadingActive || !bookId) return;

    const sampleTimer = window.setInterval(() => {
      if (Date.now() - lastActiveRef.current < IDLE_TIMEOUT_MS) {
        pendingSecondsRef.current += Math.round(TICK_MS / 1000);
      }
    }, TICK_MS);

    const flushTimer = window.setInterval(() => {
      flushPendingActivity(bookId);
    }, FLUSH_INTERVAL_MS);

    const onVisibilityOrUnload = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingActivity(bookId);
      }
    };
    window.addEventListener('beforeunload', onVisibilityOrUnload);
    document.addEventListener('visibilitychange', onVisibilityOrUnload);

    return () => {
      window.clearInterval(sampleTimer);
      window.clearInterval(flushTimer);
      window.removeEventListener('beforeunload', onVisibilityOrUnload);
      document.removeEventListener('visibilitychange', onVisibilityOrUnload);
      flushPendingActivity(bookId);
    };
  }, [isReadingActive, bookId, flushPendingActivity]);

  const updateWpm = useCallback((wpm: number) => {
    const updated = StatsEngine.updateTargetWpm(wpm);
    setStats(updated);
  }, []);

  const refreshStats = useCallback(() => {
    flushPendingActivity(bookId);
    setStats(StatsEngine.loadStats());
  }, [bookId, flushPendingActivity]);

  return {
    stats,
    chapterEstimate,
    updateWpm,
    refreshStats,
  };
}
