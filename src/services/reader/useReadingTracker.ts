/**
 * Lumina Reader - Active Reading Session & Stats Tracker Hook
 * Tracks active reading time with idle detection and calculates chapter time remaining.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StatsEngine } from './statsEngine';
import { ReadingStats, ChapterReadingEstimate } from '@/types/stats';

const IDLE_TIMEOUT_MS = 45000; // 45 seconds idle pause
const TICK_INTERVAL_MS = 5000; // record every 5s

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
  const isUserActiveRef = useRef<boolean>(true);

  // 1. Calculate word count of current chapter
  const wordCount = useMemo(() => {
    if (chapterContent) {
      return StatsEngine.calculateWordCount(chapterContent);
    }
    return 0;
  }, [chapterContent]);

  // 2. Compute chapter reading estimate
  const chapterEstimate: ChapterReadingEstimate = useMemo(() => {
    if (pagesInfo && !chapterContent) {
      // For Comics & PDF: estimate based on remaining pages (~1 min per page)
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

  // 3. User activity listener (idle detection)
  useEffect(() => {
    const handleActivity = () => {
      lastActiveRef.current = Date.now();
      isUserActiveRef.current = true;
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

  // 4. Session timer tick
  useEffect(() => {
    if (!isReadingActive || !bookId) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const idleElapsed = now - lastActiveRef.current;

      if (idleElapsed < IDLE_TIMEOUT_MS) {
        // Active reading: record 5 seconds
        const secondsDelta = Math.round(TICK_INTERVAL_MS / 1000);
        // Estimate words read in this 5-second slice
        const wordsDelta = Math.round((stats.targetWpm / 60) * secondsDelta);
        const updated = StatsEngine.recordActivity(bookId, secondsDelta, wordsDelta);
        setStats(updated);
      } else {
        isUserActiveRef.current = false;
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isReadingActive, bookId, stats.targetWpm]);

  const updateWpm = useCallback((wpm: number) => {
    const updated = StatsEngine.updateTargetWpm(wpm);
    setStats(updated);
  }, []);

  const refreshStats = useCallback(() => {
    setStats(StatsEngine.loadStats());
  }, []);

  return {
    stats,
    chapterEstimate,
    updateWpm,
    refreshStats,
  };
}
