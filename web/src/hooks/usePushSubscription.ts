/**
 * usePushSubscription - Manage Web Push subscription lifecycle.
 *
 * Handles requesting permission, subscribing to push via the browser's
 * PushManager, and syncing the subscription with the backend.
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

interface PushSubscriptionState {
  /** Current Notification permission state */
  permission: PushPermission;
  /** Whether the browser is subscribed to push */
  isSubscribed: boolean;
  /** Loading state for subscribe/unsubscribe actions */
  loading: boolean;
  /** Error message if the last action failed */
  error: string | null;
  /** Whether Web Push is supported in this browser */
  supported: boolean;
  /** Subscribe to push notifications */
  subscribe: () => Promise<void>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<void>;
}

function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function usePushSubscription(): PushSubscriptionState {
  const supported = isPushSupported();

  const [permission, setPermission] = useState<PushPermission>(
    supported ? (Notification.permission as PushPermission) : 'unsupported',
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check current subscription state on mount
  useEffect(() => {
    if (!supported) return;

    const checkSubscription = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(sub !== null);
      } catch {
        // Silently ignore — permission might not be granted yet
      }
    };

    checkSubscription();
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result as PushPermission);

      if (result !== 'granted') {
        setError('Notification permission was denied');
        return;
      }

      // 2. Fetch VAPID public key from backend
      const { data } = await axios.get<{ publicKey: string }>('/api/push/vapid-key');

      // 3. Subscribe via PushManager
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });

      // 4. Send subscription to backend
      const subJson = sub.toJSON();
      await axios.post('/api/push/subscribe', {
        endpoint: sub.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh ?? '',
          auth: subJson.keys?.auth ?? '',
        },
      });

      setIsSubscribed(true);
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Failed to subscribe to push notifications';
      setError(message);
      console.error('Push subscribe error:', err);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;

    setLoading(true);
    setError(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        // Remove from backend first
        try {
          await axios.delete('/api/push/unsubscribe', {
            data: { endpoint: sub.endpoint },
          });
        } catch {
          // Backend might not have it — continue with local unsubscribe
        }

        // Unsubscribe locally
        await sub.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        'Failed to unsubscribe from push notifications';
      setError(message);
      console.error('Push unsubscribe error:', err);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  return {
    permission,
    isSubscribed,
    loading,
    error,
    supported,
    subscribe,
    unsubscribe,
  };
}

/**
 * Convert a base64url-encoded string to a Uint8Array.
 * Required by PushManager.subscribe for the applicationServerKey.
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}
