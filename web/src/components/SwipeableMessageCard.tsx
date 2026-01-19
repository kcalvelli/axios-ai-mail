/**
 * SwipeableMessageCard component - Message card with swipe gestures for mobile
 * Swipe left: Delete (move to trash)
 * Swipe right: Select (enter selection mode or toggle selection)
 */

import { useCallback } from 'react';
import { Box, useTheme } from '@mui/material';
import { Delete, CheckBox } from '@mui/icons-material';
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
import { useAppStore } from '../store/appStore';
import type { Message } from '../api/types';

interface SwipeableMessageCardProps {
  message: Message;
  onClick?: () => void;
  onDelete?: (messageId: string) => void;
  /** Disable swipe gestures (e.g., when in selection mode) */
  disableSwipe?: boolean;
}

export function SwipeableMessageCard({
  message,
  onClick,
  onDelete,
  disableSwipe = false,
}: SwipeableMessageCardProps) {
  const theme = useTheme();
  const isOnline = useOnlineStatus();
  const toast = useToast();
  const { enterSelectionMode, selectionMode, toggleMessageSelection } = useAppStore();

  // Haptic feedback when swipe commits
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const handleDelete = useCallback(() => {
    if (!isOnline) {
      toast.warning("You're offline. This action will be queued.");
      return;
    }
    triggerHaptic();
    onDelete?.(message.id);
  }, [isOnline, toast, triggerHaptic, onDelete, message.id]);

  const handleSelect = useCallback(() => {
    triggerHaptic();
    if (selectionMode) {
      // Already in selection mode, just toggle this message
      toggleMessageSelection(message.id);
    } else {
      // Enter selection mode with this message selected
      enterSelectionMode(message.id);
    }
  }, [triggerHaptic, selectionMode, toggleMessageSelection, enterSelectionMode, message.id]);

  const handleClick = useCallback(() => {
    if (selectionMode) {
      toggleMessageSelection(message.id);
    } else {
      onClick?.();
    }
  }, [selectionMode, toggleMessageSelection, message.id, onClick]);

  // Leading actions (revealed when swiping right) - Select
  const leadingActions = () => (
    <LeadingActions>
      <SwipeAction onClick={handleSelect}>
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
          <CheckBox sx={{ fontSize: 28 }} />
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
  // but still allow tapping to toggle selection
  if (disableSwipe || selectionMode) {
    return (
      <Box
        sx={{
          width: '100%',
          backgroundColor: theme.palette.background.paper,
        }}
        onClick={handleClick}
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
    >
      <Box
        sx={{
          width: '100%',
          backgroundColor: theme.palette.background.paper,
        }}
        onClick={handleClick}
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
}

/**
 * Container for swipeable message cards
 */
export function SwipeableMessageList({
  messages,
  onMessageClick,
  onDelete,
}: SwipeableMessageListProps) {
  return (
    <SwipeableList threshold={0.4} type={ListType.IOS}>
      {messages.map((message) => (
        <SwipeableMessageCard
          key={message.id}
          message={message}
          onClick={() => onMessageClick(message)}
          onDelete={onDelete}
        />
      ))}
    </SwipeableList>
  );
}
