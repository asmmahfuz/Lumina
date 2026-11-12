/**
 * Lumina Reader - Platform Abstraction Layer (PAL) Factory
 * Resolves the active singleton adapter based on runtime environment
 */

import { IPlatformAdapter } from '@/types/platform';
import { TauriAdapter } from './TauriAdapter';
import { WebAdapter } from './WebAdapter';

let activeAdapter: IPlatformAdapter | null = null;

export function isDesktopEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function getPlatformAdapter(): IPlatformAdapter {
  if (!activeAdapter) {
    if (isDesktopEnvironment()) {
      activeAdapter = new TauriAdapter();
    } else {
      activeAdapter = new WebAdapter();
    }
  }
  return activeAdapter;
}
