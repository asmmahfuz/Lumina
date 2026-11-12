/**
 * Lumina Reader - Reading Statistics Engine
 * Calculates Words-Per-Minute (WPM), reading streaks, and chapter time remaining.
 * 100% Local-First & Zero Telemetry.
 */

import { ReadingStats, DEFAULT_READING_STATS, ChapterReadingEstimate } from '@/types/stats';

const STATS_STORAGE_KEY = 'lumina_reading_stats';

export class StatsEngine {
  public static calculateWordCount(content: string): number {
    if (!content) return 0;
    // Strip XML/HTML tags
    const cleanText = content.replace(/<[^>]*>/g, ' ');
    // Match word tokens (Unicode letters & numbers)
    const matches = cleanText.match(/[\p{L}\p{N}]+/gu);
    return matches ? matches.length : 0;
  }

  public static estimateReadingTime(wordCount: number, wpm: number = 220): ChapterReadingEstimate {
    const validWpm = Math.max(50, wpm || 220);
    const minutes = Math.ceil(wordCount / validWpm);
    let formattedTime: string;

    if (wordCount === 0 || minutes < 1) {
      formattedTime = '< 1 min';
    } else if (minutes < 60) {
      formattedTime = `${minutes} min`;
    } else {
      const hrs = Math.floor(minutes / 60);
      const rem = minutes % 60;
      formattedTime = rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
    }

    return {
      wordCount,
      estimatedMinutes: minutes,
      formattedTime,
    };
  }

  public static getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  public static getYesterdayKey(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  public static loadStats(): ReadingStats {
    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_READING_STATS,
          ...parsed,
          dailyActivity: parsed.dailyActivity || {},
          bookStats: parsed.bookStats || {},
        };
      }
    } catch (e) {
      console.warn('Failed to load reading stats from localStorage:', e);
    }
    return { ...DEFAULT_READING_STATS };
  }

  public static saveStats(stats: ReadingStats): void {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to save reading stats:', e);
    }
  }

  public static recordActivity(
    bookId: string,
    secondsDelta: number,
    wordsDelta: number = 0
  ): ReadingStats {
    const stats = this.loadStats();
    const today = this.getTodayKey();
    const yesterday = this.getYesterdayKey();

    // 1. Accumulate total reading time & words
    stats.totalReadingTimeSeconds += secondsDelta;
    stats.totalWordsRead += wordsDelta;

    // 2. Daily Activity map
    stats.dailyActivity[today] = (stats.dailyActivity[today] || 0) + secondsDelta;

    // 3. Streak Calculation
    if (stats.lastActiveDate !== today) {
      if (stats.lastActiveDate === yesterday) {
        // Consecutive day
        stats.currentStreakDays += 1;
      } else if (!stats.lastActiveDate) {
        // First session ever
        stats.currentStreakDays = 1;
      } else {
        // Streak broken
        stats.currentStreakDays = 1;
      }
      stats.lastActiveDate = today;
      if (stats.currentStreakDays > stats.longestStreakDays) {
        stats.longestStreakDays = stats.currentStreakDays;
      }
    }

    // 4. Per-book stats
    if (bookId) {
      const bStat = stats.bookStats[bookId] || { totalSeconds: 0, wordsRead: 0, lastRead: 0 };
      bStat.totalSeconds += secondsDelta;
      bStat.wordsRead += wordsDelta;
      bStat.lastRead = Date.now();
      stats.bookStats[bookId] = bStat;
    }

    this.saveStats(stats);
    return stats;
  }

  public static updateTargetWpm(wpm: number): ReadingStats {
    const stats = this.loadStats();
    stats.targetWpm = Math.min(600, Math.max(80, wpm));
    this.saveStats(stats);
    return stats;
  }

  public static formatDuration(seconds: number): string {
    if (!seconds || seconds < 60) return `${Math.max(0, Math.round(seconds || 0))}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  }

  public static getWeeklyData(dailyActivity: Record<string, number>): {
    day: string;
    date: string;
    minutes: number;
    isToday: boolean;
  }[] {
    const result = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const seconds = dailyActivity[dateKey] || 0;
      result.push({
        day: dayNames[d.getDay()],
        date: dateKey,
        minutes: Math.round(seconds / 60),
        isToday: i === 0,
      });
    }
    return result;
  }
}
