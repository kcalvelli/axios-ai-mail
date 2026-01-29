/**
 * useVersionCheck - Polls /api/version and reloads the page when the
 * deployed version changes, ensuring the PWA always runs the latest build.
 *
 * Uses sessionStorage to prevent reload loops: once we reload for a
 * version mismatch, we record the server version and won't reload again
 * until the server version changes to something new.
 */

import { useEffect } from 'react';
import { useOnlineStatus } from './useOnlineStatus';

declare const __APP_VERSION__: string;

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'axios-version-reloaded-for';

export function useVersionCheck(): void {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!isOnline) return;

    const checkVersion = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;

        const { version } = await res.json();
        if (!version || version === 'dev' || __APP_VERSION__ === 'dev') return;

        // Already running the latest version
        if (version === __APP_VERSION__) {
          sessionStorage.removeItem(STORAGE_KEY);
          return;
        }

        // We already reloaded for this server version — don't loop
        const reloadedFor = sessionStorage.getItem(STORAGE_KEY);
        if (reloadedFor === version) return;

        console.log(
          `[version] Update detected: ${__APP_VERSION__} → ${version}, reloading…`
        );
        sessionStorage.setItem(STORAGE_KEY, version);
        window.location.reload();
      } catch {
        // Silently ignore — we'll retry next interval
      }
    };

    // Check immediately on mount, then every 5 minutes
    checkVersion();
    const id = setInterval(checkVersion, VERSION_CHECK_INTERVAL);
    return () => clearInterval(id);
  }, [isOnline]);
}
