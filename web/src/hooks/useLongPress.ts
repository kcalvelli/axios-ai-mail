/**
 * useLongPress hook - Detect long press gestures on touch devices
 * Returns event handlers to attach to an element
 */

import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  /** Duration in ms before long press triggers (default: 500ms) */
  threshold?: number;
  /** Callback when long press is detected */
  onLongPress: () => void;
  /** Callback for regular click/tap */
  onClick?: () => void;
}

interface UseLongPressResult {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onClick: (e: React.MouseEvent) => void;
}

export function useLongPress({
  threshold = 500,
  onLongPress,
  onClick,
}: UseLongPressOptions): UseLongPressResult {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isLongPressRef.current = false;
      startPosRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        onLongPress();
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      clearTimer();

      // If it was a long press, prevent the click
      if (isLongPressRef.current) {
        e.preventDefault();
        isLongPressRef.current = false;
        return;
      }

      // Regular tap - trigger onClick
      if (onClick) {
        onClick();
      }
    },
    [clearTimer, onClick]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // Cancel long press if user moves finger significantly (>10px)
      if (startPosRef.current) {
        const moveX = Math.abs(e.touches[0].clientX - startPosRef.current.x);
        const moveY = Math.abs(e.touches[0].clientY - startPosRef.current.y);
        if (moveX > 10 || moveY > 10) {
          clearTimer();
        }
      }
    },
    [clearTimer]
  );

  const handleClick = useCallback(
    (_e: React.MouseEvent) => {
      // For non-touch devices, just trigger onClick
      // Touch devices will use onTouchEnd instead
      if (onClick && !('ontouchstart' in window)) {
        onClick();
      }
    },
    [onClick]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchMove,
    onClick: handleClick,
  };
}
