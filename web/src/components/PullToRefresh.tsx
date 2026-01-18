/**
 * PullToRefresh component - Custom pull-to-refresh that triggers email sync
 * Only active on touch devices and when scrolled to top
 */

import { Box, CircularProgress, Typography } from '@mui/material';
import { Sync as SyncIcon } from '@mui/icons-material';
import { useState, useRef, useCallback, ReactNode } from 'react';
import { useTriggerSync, useSyncStatus } from '../hooks/useStats';
import { useIsTouchDevice } from '../hooks/useIsMobile';

interface PullToRefreshProps {
  children: ReactNode;
}

const PULL_THRESHOLD = 80; // Pixels to pull before triggering refresh
const MAX_PULL = 120; // Maximum pull distance

export function PullToRefresh({ children }: PullToRefreshProps) {
  const isTouchDevice = useIsTouchDevice();
  const triggerSync = useTriggerSync();
  const { data: syncStatusData } = useSyncStatus();
  const isSyncing = syncStatusData?.is_syncing || triggerSync.isPending;

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start tracking if at top of scroll
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null || isRefreshing || isSyncing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    // Only track downward pulls when at top
    if (diff > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
      // Apply resistance - pull distance is less than actual touch movement
      const resistance = 0.5;
      const distance = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(distance);

      // Prevent default scroll behavior when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [isRefreshing, isSyncing]);

  const handleTouchEnd = useCallback(() => {
    if (touchStartY.current === null) return;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing && !isSyncing) {
      // Trigger refresh
      setIsRefreshing(true);
      triggerSync.mutate({}, {
        onSettled: () => {
          setIsRefreshing(false);
          setPullDistance(0);
        },
      });
    } else {
      // Reset pull distance
      setPullDistance(0);
    }

    touchStartY.current = null;
  }, [pullDistance, isRefreshing, isSyncing, triggerSync]);

  // Don't add pull-to-refresh behavior on non-touch devices
  if (!isTouchDevice) {
    return <>{children}</>;
  }

  const progress = Math.min((pullDistance / PULL_THRESHOLD) * 100, 100);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <Box
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{
        position: 'relative',
        height: '100%',
        overflow: 'auto',
        // Ensure touch events work correctly
        touchAction: pullDistance > 0 ? 'none' : 'pan-y',
      }}
    >
      {/* Pull indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: Math.max(pullDistance, isRefreshing ? 60 : 0),
          overflow: 'hidden',
          transition: isRefreshing ? 'height 0.2s ease' : 'none',
          backgroundColor: 'background.paper',
          zIndex: 1,
        }}
      >
        {showIndicator && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              opacity: pullDistance > 20 || isRefreshing ? 1 : pullDistance / 20,
            }}
          >
            {isRefreshing ? (
              <>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary">
                  Syncing...
                </Typography>
              </>
            ) : (
              <>
                <SyncIcon
                  sx={{
                    transform: `rotate(${progress * 3.6}deg)`,
                    color: progress >= 100 ? 'primary.main' : 'text.secondary',
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {progress >= 100 ? 'Release to sync' : 'Pull to sync'}
                </Typography>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* Content with offset when pulling */}
      <Box
        sx={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 && !isRefreshing ? 'transform 0.2s ease' : 'none',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
