/**
 * SwipeableMessageCard component - Message card with swipe gestures for mobile
 * Swipe left: Delete (move to trash)
 * Swipe right: Reply
 */

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
import type { Message } from '../api/types';

interface SwipeableMessageCardProps {
  message: Message;
  onClick?: () => void;
  onDelete?: (messageId: string) => void;
  onReply?: (message: Message) => void;
}

export function SwipeableMessageCard({
  message,
  onClick,
  onDelete,
  onReply,
}: SwipeableMessageCardProps) {
  const theme = useTheme();
  const isOnline = useOnlineStatus();
  const toast = useToast();

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

  return (
    <SwipeableListItem
      leadingActions={leadingActions()}
      trailingActions={trailingActions()}
      threshold={0.4}
      listType={ListType.IOS}
    >
      <Box sx={{ width: '100%', backgroundColor: theme.palette.background.paper }}>
        <MessageCard
          message={message}
          onClick={onClick}
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
