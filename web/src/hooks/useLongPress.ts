/**
 * Custom hook for detecting long-press gestures on mobile.
 *
 * Features:
 * - 500ms threshold for long-press activation
 * - Cancels if finger moves >10px (user is swiping)
 * - Provides haptic feedback on activation
 * - Tracks press state for visual feedback
 */

import { useCallback, useRef, useState } from 'react';

export interface LongPressOptions {
  /** Threshold in ms before long press triggers (default: 500ms) */
  threshold?: number;
  /** Max movement in px before cancelling (default: 10px) */
  movementThreshold?: number;
  /** Callback when long press activates */
  onLongPress: () => void;
  /** Callback for regular tap (not long press) */
  onTap?: () => void;
  /** Whether long press is enabled (default: true) */
  enabled?: boolean;
}

export interface LongPressResult {
  /** Handlers to spread on the target element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchCancel: (e: React.TouchEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
  };
  /** Whether the element is currently being pressed */
  isPressed: boolean;
  /** Progress of the long press (0-1) for visual feedback */
  pressProgress: number;
}

export function useLongPress({
  threshold = 500,
  movementThreshold = 10,
  onLongPress,
  onTap,
  enabled = true,
}: LongPressOptions): LongPressResult {
  const [isPressed, setIsPressed] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTriggeredRef = useRef(false);
  const startTimeRef = useRef<number>(0);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const triggerHapticFeedback = useCallback(() => {
    // Use the Vibration API if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // Short vibration
    }
  }, []);

  const handlePressStart = useCallback(
    (x: number, y: number) => {
      if (!enabled) return;

      startPosRef.current = { x, y };
      longPressTriggeredRef.current = false;
      startTimeRef.current = Date.now();
      setIsPressed(true);
      setPressProgress(0);

      // Start progress animation
      const progressInterval = 50; // Update every 50ms
      progressTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const progress = Math.min(elapsed / threshold, 1);
        setPressProgress(progress);
      }, progressInterval);

      // Set timer for long press
      timerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true;
        triggerHapticFeedback();
        onLongPress();
        clearTimers();
        setIsPressed(false);
        setPressProgress(0);
      }, threshold);
    },
    [enabled, threshold, onLongPress, triggerHapticFeedback, clearTimers]
  );

  const handlePressMove = useCallback(
    (x: number, y: number) => {
      if (!startPosRef.current || longPressTriggeredRef.current) return;

      const dx = Math.abs(x - startPosRef.current.x);
      const dy = Math.abs(y - startPosRef.current.y);
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Cancel long press if moved too much (user is swiping)
      if (distance > movementThreshold) {
        clearTimers();
        setIsPressed(false);
        setPressProgress(0);
        startPosRef.current = null;
      }
    },
    [movementThreshold, clearTimers]
  );

  const handlePressEnd = useCallback(() => {
    const wasLongPress = longPressTriggeredRef.current;
    clearTimers();
    setIsPressed(false);
    setPressProgress(0);
    startPosRef.current = null;

    // If it wasn't a long press and we have a tap handler, call it
    if (!wasLongPress && onTap) {
      onTap();
    }
  }, [clearTimers, onTap]);

  const handlers = {
    // Touch events (mobile)
    onTouchStart: useCallback(
      (e: React.TouchEvent) => {
        const touch = e.touches[0];
        handlePressStart(touch.clientX, touch.clientY);
      },
      [handlePressStart]
    ),
    onTouchMove: useCallback(
      (e: React.TouchEvent) => {
        const touch = e.touches[0];
        handlePressMove(touch.clientX, touch.clientY);
      },
      [handlePressMove]
    ),
    onTouchEnd: useCallback(
      (_e: React.TouchEvent) => {
        handlePressEnd();
      },
      [handlePressEnd]
    ),
    onTouchCancel: useCallback(
      (_e: React.TouchEvent) => {
        clearTimers();
        setIsPressed(false);
        setPressProgress(0);
        startPosRef.current = null;
      },
      [clearTimers]
    ),

    // Mouse events (desktop fallback for testing)
    onMouseDown: useCallback(
      (e: React.MouseEvent) => {
        // Only handle left click
        if (e.button !== 0) return;
        handlePressStart(e.clientX, e.clientY);
      },
      [handlePressStart]
    ),
    onMouseMove: useCallback(
      (e: React.MouseEvent) => {
        handlePressMove(e.clientX, e.clientY);
      },
      [handlePressMove]
    ),
    onMouseUp: useCallback(
      (_e: React.MouseEvent) => {
        handlePressEnd();
      },
      [handlePressEnd]
    ),
    onMouseLeave: useCallback(
      (_e: React.MouseEvent) => {
        clearTimers();
        setIsPressed(false);
        setPressProgress(0);
        startPosRef.current = null;
      },
      [clearTimers]
    ),
  };

  return {
    handlers,
    isPressed,
    pressProgress,
  };
}
