/**
 * SwipeableMessageCard component - Message card with swipe gestures for mobile
 * Swipe left: Delete (move to trash)
 * Swipe right: Select (enter selection mode with this message selected)
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
}

export function SwipeableMessageCard({
  message,
  onClick,
  onDelete,
}: SwipeableMessageCardProps) {
  const theme = useTheme();
  const isOnline = useOnlineStatus();
  const toast = useToast();
  const { enterSelectionMode, selectionMode, toggleMessageSelection } = useAppStore();

  // Haptic feedback
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
    // Always enter selection mode with this message - simple and clear
    enterSelectionMode(message.id);
  }, [triggerHaptic, enterSelectionMode, message.id]);

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

  // In selection mode, show simple tappable cards (no swipe)
  if (selectionMode) {
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
          selectionMode={true}
        />
      </Box>
    );
  }

  // Normal mode - swipeable
  return (
    <SwipeableListItem
      leadingActions={leadingActions()}
      trailingActions={trailingActions()}
      threshold={0.3}
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
    <SwipeableList threshold={0.3} type={ListType.IOS}>
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
