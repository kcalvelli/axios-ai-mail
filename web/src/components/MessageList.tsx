/**
 * MessageList component - List of messages
 */

import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';
import { MessageCard } from './MessageCard';
import { useMessages } from '../hooks/useMessages';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';

export function MessageList() {
  const navigate = useNavigate();
  const {
    selectedAccount,
    selectedTags,
    searchQuery,
    isUnreadOnly,
  } = useAppStore();

  // Build filters
  const filters: any = {
    limit: 50,
    offset: 0,
  };

  if (selectedAccount) {
    filters.account_id = selectedAccount;
  }

  if (selectedTags.length > 0) {
    // Pass all selected tags (backend uses OR logic - matches any tag)
    filters.tags = selectedTags;
  }

  if (isUnreadOnly) {
    filters.is_unread = true;
  }

  if (searchQuery) {
    filters.search = searchQuery;
  }

  // Fetch messages
  const { data, isLoading, error } = useMessages(filters);

  // Loading state
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load messages: {error.message}
        </Alert>
      </Box>
    );
  }

  // Empty state
  if (!data || data.messages.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="400px"
        textAlign="center"
        p={4}
      >
        <InboxOutlined sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No messages found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {searchQuery
            ? 'Try adjusting your search query'
            : 'Run a sync to fetch messages'}
        </Typography>
      </Box>
    );
  }

  // Render messages
  return (
    <Box p={2}>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {data.total} {data.total === 1 ? 'message' : 'messages'}
      </Typography>

      {data.messages.map((message) => (
        <MessageCard
          key={message.id}
          message={message}
          onClick={() => navigate(`/messages/${message.id}`)}
        />
      ))}
    </Box>
  );
}
