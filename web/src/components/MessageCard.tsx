/**
 * MessageCard component - Single message card
 * Supports compact mode for mobile devices
 *
 * M3 AMOLED: Tonal surface containment, no borders
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
import { sanitizeSnippet } from '../utils/sanitizeSnippet';
import type { Message } from '../api/types';

interface MessageCardProps {
  message: Message;
  onClick?: () => void;
  /** Compact mode for mobile - reduces padding, hides checkbox and some controls */
  compact?: boolean;
  /** Selection mode - when true, clicking toggles selection instead of opening */
  selectionMode?: boolean;
}

export function MessageCard({ message, onClick, compact = false, selectionMode = false }: MessageCardProps) {
  const theme = useMuiTheme();
  const { toggleTag, toggleMessageSelection, isMessageSelected } = useAppStore();
  const markRead = useMarkRead();
  const isDark = theme.palette.mode === 'dark';

  const isSelected = isMessageSelected(message.id);

  // In selection mode, clicking toggles selection instead of opening
  const handleCardClick = () => {
    if (selectionMode) {
      toggleMessageSelection(message.id);
    } else {
      onClick?.();
    }
  };

  // M3 AMOLED: Tonal surface hierarchy for visual distinction
  const getBackgroundColor = () => {
    if (isSelected) {
      // Selected state: slightly elevated surface
      return isDark ? '#2C2C2C' : '#e3f2fd';
    }
    if (message.is_unread) {
      // Unread: Surface Container High for emphasis
      return isDark ? '#252525' : '#f5f5f5';
    }
    // Default: Surface Container (#1E1E1E in dark)
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

  // Show checkbox in selection mode even when compact
  const showCheckbox = !compact || selectionMode;

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        cursor: 'pointer',
        mb: compact ? 0.5 : 1,
        backgroundColor: getBackgroundColor(),
        // M3 AMOLED: No borders, use tonal surfaces for containment
        // Subtle indicator for unread via left border only when selected
        borderLeft: message.is_unread && !isDark
          ? `4px solid ${theme.palette.primary.main}`
          : 'none',
        border: isSelected ? `2px solid ${theme.palette.primary.main}` : 'none',
        // M3: 12px border-radius (via theme)
        borderRadius: '12px',
        // Ensure full width for swipeable wrapper
        width: '100%',
        // M3 AMOLED: No box shadow for dark mode
        boxShadow: isDark ? 'none' : undefined,
      }}
    >
      {/* M3: 16px internal padding */}
      <CardContent sx={{ p: compact ? 1.5 : 2, '&:last-child': { pb: compact ? 1.5 : 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="start">
          {/* Checkbox - show in selection mode even on mobile */}
          {showCheckbox && (
            <Checkbox
              checked={isSelected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              sx={{ p: 0, mr: 1 }}
            />
          )}

          <Box flex={1} minWidth={0}>
            {/* From and Date */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              {/* M3 Typography: Title Medium for sender (fontWeight 500) */}
              <Typography
                variant="subtitle2"
                fontWeight={message.is_unread ? 600 : 500}
                sx={{
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  mr: 1,
                }}
              >
                {message.from_email}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5} flexShrink={0}>
                {message.has_attachments && (
                  <AttachFile fontSize="small" color="primary" />
                )}
                {/* Unread indicator - always visible, especially important on mobile */}
                {message.is_unread && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.primary.main,
                    }}
                  />
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

            {/* M3 Typography: Body Small for snippet (fontWeight 400, On-Surface Variant color) */}
            <Typography
              variant="body2"
              sx={{
                mb: compact ? 0.5 : 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: compact ? 1 : 2,
                WebkitBoxOrient: 'vertical',
                fontWeight: 400,
                // M3: On-Surface Variant (#CAC4D0) for secondary content
                color: isDark ? '#CAC4D0' : 'text.secondary',
              }}
            >
              {/* Strip HTML/CSS from snippet for clean display */}
              {sanitizeSnippet(message.snippet)}
            </Typography>

            {/* Tags and Confidence */}
            {(message.tags.length > 0 || message.confidence !== undefined) && (
              <Stack
                direction="row"
                spacing={0.5}
                flexWrap="wrap"
                gap={0.5}
                alignItems="center"
                sx={{
                  // Limit tag display on mobile
                  maxHeight: compact ? 24 : 'none',
                  overflow: compact ? 'hidden' : 'visible',
                }}
              >
                {message.tags.slice(0, compact ? 3 : undefined).map((tag) => (
                  <TagChip
                    key={tag}
                    tag={tag}
                    onClick={handleTagClick(tag)}
                    size="small"
                  />
                ))}
                {!compact && (
                  <ConfidenceBadge confidence={message.confidence} size="small" />
                )}
              </Stack>
            )}
          </Box>

          {/* Read/Unread Toggle - hidden in compact mode (swipe actions instead) */}
          {!compact && (
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
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
