/**
 * Lumina Reader - Book Format Badge Styling Helper
 * Color mappings for library book format indicators
 */

import { BookFormat } from '@/types/book';

export interface FormatBadgeStyle {
  bg: string;
  text: string;
  border: string;
}

export const getFormatBadgeColor = (format: BookFormat): FormatBadgeStyle => {
  switch (format) {
    case 'epub':
      return { bg: 'var(--color-accent-subtle)', text: 'var(--color-accent)', border: 'var(--color-accent)' };
    case 'cbz':
    case 'cbr':
    case 'cbt':
    case 'cb7':
      return { bg: 'rgba(236, 72, 153, 0.15)', text: '#ec4899', border: '#ec4899' };
    case 'pdf':
      return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: '#38bdf8' };
    case 'djvu':
      return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' };
    case 'mobi':
    case 'azw3':
      return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' };
    case 'fb2':
      return { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: '#a855f7' };
    case 'md':
      return { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', border: '#06b6d4' };
    case 'txt':
      return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: '#3b82f6' };
    default:
      return { bg: 'var(--color-surface-hover)', text: 'var(--color-text-secondary)', border: 'var(--color-border)' };
  }
};
