/**
 * useNotifications hook - Handle browser notifications for new emails
 */

import { useEffect, useState, useCallback } from 'react';

export type NotificationPermission = 'default' | 'granted' | 'denied';

interface NotificationMessage {
  id: string;
  subject: string;
  from_email: string;
  snippet: string;
}

interface UseNotificationsResult {
  /** Current notification permission status */
  permission: NotificationPermission;
  /** Whether notifications are supported in this browser */
  isSupported: boolean;
  /** Request notification permission from user */
  requestPermission: () => Promise<NotificationPermission>;
  /** Show a notification for new messages */
  showNewMessageNotification: (messages: NotificationMessage[]) => void;
}

export function useNotifications(): UseNotificationsResult {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  // Initialize permission state
  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission as NotificationPermission);
    }
  }, [isSupported]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      return result as NotificationPermission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }, [isSupported]);

  // Show notification for new messages
  const showNewMessageNotification = useCallback(
    (messages: NotificationMessage[]) => {
      if (!isSupported || permission !== 'granted' || messages.length === 0) {
        return;
      }

      // Don't show notifications if the app is in focus
      if (document.hasFocus()) {
        return;
      }

      try {
        if (messages.length === 1) {
          // Single message notification
          const msg = messages[0];
          const notification = new Notification(msg.from_email, {
            body: msg.subject,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `new-message-${msg.id}`,
            data: { messageId: msg.id },
            requireInteraction: false,
          });

          // Handle click - navigate to message
          notification.onclick = () => {
            window.focus();
            window.location.href = `/messages/${msg.id}`;
            notification.close();
          };

          // Auto-close after 5 seconds
          setTimeout(() => notification.close(), 5000);
        } else {
          // Multiple messages notification
          const notification = new Notification('New emails', {
            body: `You have ${messages.length} new messages`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'new-messages-batch',
            requireInteraction: false,
          });

          // Handle click - navigate to inbox
          notification.onclick = () => {
            window.focus();
            window.location.href = '/?folder=inbox';
            notification.close();
          };

          // Auto-close after 5 seconds
          setTimeout(() => notification.close(), 5000);
        }
      } catch (error) {
        console.error('Failed to show notification:', error);
      }
    },
    [isSupported, permission]
  );

  return {
    permission,
    isSupported,
    requestPermission,
    showNewMessageNotification,
  };
}
