/**
 * ThreadView component - Display conversation thread with collapsible messages
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  Paper,
  Divider,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { ExpandMore, ExpandLess, Email } from '@mui/icons-material';
import { SenderAvatar, extractSenderName } from './SenderAvatar';
import { QuotedText, processHtmlQuotes } from './QuotedText';
import { EmailContent } from './EmailContent';
import DOMPurify from 'dompurify';
import { useThreadMessages, useMessageBody } from '../hooks/useMessages';
import type { Message } from '../api/types';

interface ThreadViewProps {
  /** The thread ID to display */
  threadId: string;
  /** The current message ID (to highlight) */
  currentMessageId: string;
}

interface ThreadMessageProps {
  message: Message;
  isCurrentMessage: boolean;
  defaultExpanded: boolean;
}

function ThreadMessage({ message, isCurrentMessage, defaultExpanded }: ThreadMessageProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { data: body, isLoading: bodyLoading } = useMessageBody(message.id);

  const { name: senderName, email: senderEmail } = extractSenderName(message.from_email);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Sanitize HTML content
  const sanitizedHtml = body?.body_html
    ? DOMPurify.sanitize(body.body_html, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'b', 'i', 's',
          'a', 'ul', 'ol', 'li',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'blockquote', 'div', 'span', 'pre', 'code',
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
      })
    : null;

  const { mainHtml } = sanitizedHtml
    ? processHtmlQuotes(sanitizedHtml)
    : { mainHtml: '' };

  return (
    <Paper
      elevation={isCurrentMessage ? 2 : 0}
      sx={{
        mb: 1,
        border: isCurrentMessage ? `2px solid ${theme.palette.primary.main}` : `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Collapsed header - always visible */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          cursor: 'pointer',
          bgcolor: expanded ? (isDark ? '#252525' : '#f5f5f5') : 'transparent',
          '&:hover': {
            bgcolor: isDark ? '#252525' : '#f5f5f5',
          },
        }}
      >
        <SenderAvatar email={senderEmail} name={senderName} size={32} />
        <Box flex={1} minWidth={0}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="body2"
              fontWeight={message.is_unread ? 600 : 500}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {senderName || senderEmail}
            </Typography>
            {message.is_unread && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  flexShrink: 0,
                }}
              />
            )}
          </Box>
          {!expanded && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {message.snippet}
            </Typography>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" flexShrink={0}>
          {formatDate(message.date)}
        </Typography>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* Expanded content */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 2 }}>
          {bodyLoading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : mainHtml ? (
            <Box sx={{ fontSize: '0.9rem' }}>
              <EmailContent html={mainHtml} />
            </Box>
          ) : body?.body_text ? (
            <QuotedText text={body.body_text} defaultCollapsed={false} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {message.snippet}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

export function ThreadView({ threadId, currentMessageId }: ThreadViewProps) {
  const { data, isLoading, error } = useThreadMessages(threadId);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error || !data || data.messages.length <= 1) {
    // No thread or only one message - don't show thread view
    return null;
  }

  // Sort messages by date (oldest first for conversation flow)
  const sortedMessages = [...data.messages].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Box sx={{ mt: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Email color="action" />
        <Typography variant="subtitle2" color="text.secondary">
          Conversation ({sortedMessages.length} messages)
        </Typography>
      </Box>

      {sortedMessages.map((message, index) => (
        <ThreadMessage
          key={message.id}
          message={message}
          isCurrentMessage={message.id === currentMessageId}
          defaultExpanded={message.id === currentMessageId || index === sortedMessages.length - 1}
        />
      ))}
    </Box>
  );
}
