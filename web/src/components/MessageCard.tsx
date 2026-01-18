/**
 * MessageCard component - Single message card
 */

import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  IconButton,
  Checkbox,
  useTheme as useMuiTheme,
} from '@mui/material';
import { Mail, MailOutline, AttachFile } from '@mui/icons-material';
import { TagChip } from './TagChip';
import { ConfidenceBadge } from './ConfidenceBadge';
import { useAppStore } from '../store/appStore';
import { useMarkRead } from '../hooks/useMessages';
import type { Message } from '../api/types';

interface MessageCardProps {
  message: Message;
  onClick?: () => void;
}

export function MessageCard({ message, onClick }: MessageCardProps) {
  const theme = useMuiTheme();
  const { toggleTag, toggleMessageSelection, isMessageSelected } = useAppStore();
  const markRead = useMarkRead();
  const isDark = theme.palette.mode === 'dark';

  const isSelected = isMessageSelected(message.id);

  // Theme-aware background colors
  const getBackgroundColor = () => {
    if (isSelected) {
      return isDark ? 'rgba(144, 202, 249, 0.15)' : '#e3f2fd';
    }
    if (message.is_unread) {
      return isDark ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5';
    }
    return theme.palette.background.paper;
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    toggleMessageSelection(message.id);
  };

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markRead.mutate({
      id: message.id,
      data: { is_unread: !message.is_unread },
    });
  };

  const handleTagClick = (tag: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTag(tag);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        mb: 1,
        backgroundColor: getBackgroundColor(),
        borderLeft: message.is_unread ? `4px solid ${theme.palette.primary.main}` : 'none',
        border: isSelected ? `2px solid ${theme.palette.primary.main}` : undefined,
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start">
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
            sx={{ p: 0, mr: 2 }}
          />

          <Box flex={1}>
            {/* From and Date */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography
                variant="subtitle2"
                fontWeight={message.is_unread ? 600 : 400}
                sx={{ color: 'text.primary' }}
              >
                {message.from_email}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                {message.has_attachments && (
                  <AttachFile fontSize="small" color="primary" />
                )}
                <Typography variant="caption" color="text.secondary">
                  {formatDate(message.date)}
                </Typography>
              </Box>
            </Box>

            {/* Subject */}
            <Typography
              variant="body2"
              fontWeight={message.is_unread ? 600 : 400}
              sx={{
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {message.subject}
            </Typography>

            {/* Snippet */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {message.snippet}
            </Typography>

            {/* Tags and Confidence */}
            {(message.tags.length > 0 || message.confidence !== undefined) && (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} alignItems="center">
                {message.tags.map((tag) => (
                  <TagChip
                    key={tag}
                    tag={tag}
                    onClick={handleTagClick(tag)}
                  />
                ))}
                <ConfidenceBadge confidence={message.confidence} size="small" />
              </Stack>
            )}
          </Box>

          {/* Read/Unread Toggle */}
          <IconButton
            size="small"
            onClick={handleMarkRead}
            sx={{ ml: 1 }}
          >
            {message.is_unread ? (
              <Mail color="primary" />
            ) : (
              <MailOutline color="action" />
            )}
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}
