/**
 * Main entry point - Renders React app to DOM
 *
 * Auto-reloads on deploy via service worker controllerchange event.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ── Auto-reload on deploy via SW lifecycle ──────────────────────────
// When a new service worker activates and calls clients.claim(), the
// browser fires `controllerchange`. We reload so the page picks up
// new assets. This cannot loop: after reload the new SW is already the
// controller, so no second transition occurs.
if ('serviceWorker' in navigator) {
  // Guard: don't reload on first visit (controller goes null → SW)
  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  // Poll for SW updates every 60s (supplements browser's nav/24h checks)
  navigator.serviceWorker.ready.then((registration) => {
    setInterval(() => registration.update(), 60_000);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
