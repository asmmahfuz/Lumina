/**
 * Lumina Reader - Reading Statistics Domain Types
 * Word counts, reading pace (WPM), time remaining, and streak tracking
 */

export interface ReadingSession {
  bookId: string;
  startTime: number;
  durationSeconds: number;
  wordsRead: number;
  date: string; // YYYY-MM-DD
}

export interface BookReadingStat {
  totalSeconds: number;
  wordsRead: number;
  lastRead: number;
}

export interface ReadingStats {
  totalReadingTimeSeconds: number;
  totalWordsRead: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  targetWpm: number; // Words Per Minute (default 220)
  dailyActivity: Record<string, number>; // YYYY-MM-DD -> total seconds
  bookStats: Record<string, BookReadingStat>; // bookId -> stat
}

export interface ChapterReadingEstimate {
  wordCount: number;
  estimatedMinutes: number;
  formattedTime: string;
}

export const DEFAULT_READING_STATS: ReadingStats = {
  totalReadingTimeSeconds: 0,
  totalWordsRead: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  lastActiveDate: '',
  targetWpm: 220,
  dailyActivity: {},
  bookStats: {},
};
