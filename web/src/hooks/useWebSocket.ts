/**
 * WebSocket hook for real-time updates
 */

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';
import { messageKeys } from './useMessages';
import { statsKeys } from './useStats';
import { useNotifications } from './useNotifications';
import type { WebSocketMessage } from '../api/types';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { setSyncStatus } = useAppStore();
  const { showNewMessageNotification } = useNotifications();

  useEffect(() => {
    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    // Create WebSocket connection
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);

      // Subscribe to all topics
      ws.send(
        JSON.stringify({
          type: 'subscribe',
          topics: ['sync_events', 'classification_updates'],
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('WebSocket message:', message);
        setLastMessage(message);

        // Handle different message types
        switch (message.type) {
          case 'sync_started':
            setSyncStatus('syncing');
            break;

          case 'sync_completed':
            setSyncStatus('idle');
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
            queryClient.invalidateQueries({ queryKey: statsKeys.stats });
            queryClient.invalidateQueries({ queryKey: statsKeys.tags });
            break;

          case 'message_classified':
            // Invalidate specific message
            if (message.message_id) {
              queryClient.invalidateQueries({
                queryKey: messageKeys.detail(message.message_id),
              });
            }
            queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
            break;

          case 'error':
            setSyncStatus('error');
            console.error('WebSocket error:', message.message);
            break;

          case 'new_messages':
            // Show browser notification for new messages
            if (message.messages && Array.isArray(message.messages)) {
              showNewMessageNotification(message.messages);
            }
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [queryClient, setSyncStatus, showNewMessageNotification]);

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}
