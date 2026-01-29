/**
 * useVersionCheck - Polls /api/version and reloads the page when the
 * deployed version changes, ensuring the PWA always runs the latest build.
 */

import { useEffect, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';

declare const __APP_VERSION__: string;

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useVersionCheck(): void {
  const isOnline = useOnlineStatus();
  const hasReloaded = useRef(false);

  useEffect(() => {
    if (!isOnline) return;

    const checkVersion = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;

        const { version } = await res.json();
        if (
          version &&
          version !== 'dev' &&
          __APP_VERSION__ !== 'dev' &&
          version !== __APP_VERSION__ &&
          !hasReloaded.current
        ) {
          console.log(
            `[version] Update detected: ${__APP_VERSION__} → ${version}, reloading…`
          );
          hasReloaded.current = true;
          window.location.reload();
        }
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
