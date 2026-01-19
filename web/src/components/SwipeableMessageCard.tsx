/**
 * SwipeableMessageCard component - Message card with swipe gestures for mobile
 * Swipe left: Delete (move to trash)
 * Swipe right: Reply
 * Long press: Enter selection mode (only if NOT swiping)
 *
 * Architecture: Swipe is primary gesture. Long press only triggers if user
 * holds still (no swipe detected) for 800ms.
 */

import { useState, useCallback } from 'react';
import { Box, useTheme } from '@mui/material';
import { Delete, Reply } from '@mui/icons-material';
import {
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
  LeadingActions,
  Type as ListType,
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';
import { MessageCard } from './MessageCard';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useToast } from '../hooks/useToast';
import { useLongPress } from '../hooks/useLongPress';
import { useAppStore } from '../store/appStore';
import type { Message } from '../api/types';

interface SwipeableMessageCardProps {
  message: Message;
  onClick?: () => void;
  onDelete?: (messageId: string) => void;
  onReply?: (message: Message) => void;
  /** Disable swipe gestures (e.g., when in selection mode) */
  disableSwipe?: boolean;
}

export function SwipeableMessageCard({
  message,
  onClick,
  onDelete,
  onReply,
  disableSwipe = false,
}: SwipeableMessageCardProps) {
  const theme = useTheme();
  const isOnline = useOnlineStatus();
  const toast = useToast();
  const { enterSelectionMode, selectionMode, toggleMessageSelection } = useAppStore();

  // Track if swipe is in progress - when swiping, disable long press entirely
  const [isSwiping, setIsSwiping] = useState(false);

  const handleSwipeStart = useCallback(() => {
    setIsSwiping(true);
  }, []);

  const handleSwipeEnd = useCallback(() => {
    // Small delay before re-enabling long press to avoid accidental triggers
    setTimeout(() => setIsSwiping(false), 100);
  }, []);

  // Long press to enter selection mode
  // Movement threshold is higher (15px) because:
  // 1. Swipe library handles swipe detection via isSwiping state
  // 2. Small finger tremors during tap shouldn't cancel the tap
  // 3. 15px is still enough to cancel long press if user is actually moving
  const { handlers: longPressHandlers, isPressed, pressProgress } = useLongPress({
    enabled: !selectionMode && !isSwiping,
    movementThreshold: 15, // More lenient - let swipe library detect swipes
    onLongPress: () => {
      enterSelectionMode(message.id);
    },
    onTap: () => {
      // Don't trigger tap if we were swiping (swipe library's detection)
      if (isSwiping) return;

      // In selection mode, tap toggles selection
      if (selectionMode) {
        toggleMessageSelection(message.id);
      } else {
        onClick?.();
      }
    },
  });

  // Haptic feedback when swipe commits
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleDelete = () => {
    if (!isOnline) {
      toast.warning("You're offline. This action will be queued.");
      return;
    }
    triggerHaptic();
    onDelete?.(message.id);
  };

  const handleReply = () => {
    triggerHaptic();
    onReply?.(message);
  };

  // Leading actions (revealed when swiping right) - Reply
  const leadingActions = () => (
    <LeadingActions>
      <SwipeAction onClick={handleReply}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            px: 3,
            height: '100%',
            minWidth: 80,
          }}
        >
          <Reply sx={{ fontSize: 28 }} />
        </Box>
      </SwipeAction>
    </LeadingActions>
  );

  // Trailing actions (revealed when swiping left) - Delete
  const trailingActions = () => (
    <TrailingActions>
      <SwipeAction destructive onClick={handleDelete}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            backgroundColor: theme.palette.error.main,
            color: 'white',
            px: 3,
            height: '100%',
            minWidth: 80,
          }}
        >
          <Delete sx={{ fontSize: 28 }} />
        </Box>
      </SwipeAction>
    </TrailingActions>
  );

  // When in selection mode or swipe is disabled, render without swipe wrapper
  if (disableSwipe || selectionMode) {
    return (
      <Box
        sx={{
          width: '100%',
          backgroundColor: theme.palette.background.paper,
          // Visual feedback for long press progress
          transform: isPressed ? `scale(${1 - pressProgress * 0.02})` : 'scale(1)',
          opacity: isPressed ? 1 - pressProgress * 0.1 : 1,
          transition: isPressed ? 'none' : 'transform 0.2s, opacity 0.2s',
        }}
        {...longPressHandlers}
      >
        <MessageCard
          message={message}
          compact
          selectionMode={selectionMode}
        />
      </Box>
    );
  }

  return (
    <SwipeableListItem
      leadingActions={leadingActions()}
      trailingActions={trailingActions()}
      threshold={0.4}
      listType={ListType.IOS}
      onSwipeStart={handleSwipeStart}
      onSwipeEnd={handleSwipeEnd}
    >
      <Box
        sx={{
          width: '100%',
          backgroundColor: theme.palette.background.paper,
          // Visual feedback for long press progress
          transform: isPressed ? `scale(${1 - pressProgress * 0.02})` : 'scale(1)',
          opacity: isPressed ? 1 - pressProgress * 0.1 : 1,
          transition: isPressed ? 'none' : 'transform 0.2s, opacity 0.2s',
        }}
        {...longPressHandlers}
      >
        <MessageCard
          message={message}
          compact
        />
      </Box>
    </SwipeableListItem>
  );
}

interface SwipeableMessageListProps {
  messages: Message[];
  onMessageClick: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onReply: (message: Message) => void;
}

/**
 * Container for swipeable message cards
 */
export function SwipeableMessageList({
  messages,
  onMessageClick,
  onDelete,
  onReply,
}: SwipeableMessageListProps) {
  return (
    <SwipeableList threshold={0.4} type={ListType.IOS}>
      {messages.map((message) => (
        <SwipeableMessageCard
          key={message.id}
          message={message}
          onClick={() => onMessageClick(message)}
          onDelete={onDelete}
          onReply={onReply}
        />
      ))}
    </SwipeableList>
  );
}
