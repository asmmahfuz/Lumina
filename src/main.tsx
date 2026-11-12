/**
 * Lumina Reader - Frontend Application Entry Point
 * Mounts React 19 root with global providers and CSS design system
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReaderProvider } from './app/Providers';
import { App } from './app/App';
import './styles/global.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container #root not found in document.');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ReaderProvider>
      <App />
    </ReaderProvider>
  </React.StrictMode>
);

// Register offline Service Worker in browser web mode
if ('serviceWorker' in navigator && !('__TAURI_INTERNALS__' in window)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Lumina Reader PWA ServiceWorker active:', reg.scope);
      })
      .catch((err) => {
        console.warn('Lumina Reader ServiceWorker registration skipped:', err);
      });
  });
}

