/**
 * MessageList component - List of messages
 */

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { InboxOutlined, DeleteSweep } from '@mui/icons-material';
import { useState } from 'react';
import { MessageCard } from './MessageCard';
import { BulkActionBar } from './BulkActionBar';
import { useMessages, useBulkDelete, useBulkMarkRead, useDeleteAll } from '../hooks/useMessages';
import { useAppStore } from '../store/appStore';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function MessageList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    selectedAccount,
    selectedTags,
    searchQuery,
    isUnreadOnly,
    selectedMessageIds,
    clearSelection,
  } = useAppStore();

  const bulkDelete = useBulkDelete();
  const bulkMarkRead = useBulkMarkRead();
  const deleteAll = useDeleteAll();

  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  // Get folder from URL query params (default to inbox)
  const folder = searchParams.get('folder') || 'inbox';

  // Bulk operation handlers
  const handleBulkDelete = () => {
    const messageIds = Array.from(selectedMessageIds);
    if (messageIds.length === 0) return;

    if (confirm(`Delete ${messageIds.length} message(s)?`)) {
      bulkDelete.mutate(messageIds, {
        onSuccess: () => {
          clearSelection();
        },
      });
    }
  };

  const handleBulkMarkRead = () => {
    const messageIds = Array.from(selectedMessageIds);
    if (messageIds.length === 0) return;

    bulkMarkRead.mutate(
      { messageIds, isUnread: false },
      {
        onSuccess: () => {
          clearSelection();
        },
      }
    );
  };

  const handleBulkMarkUnread = () => {
    const messageIds = Array.from(selectedMessageIds);
    if (messageIds.length === 0) return;

    bulkMarkRead.mutate(
      { messageIds, isUnread: true },
      {
        onSuccess: () => {
          clearSelection();
        },
      }
    );
  };

  const handleDeleteAll = () => {
    setDeleteAllDialogOpen(true);
  };

  const handleDeleteAllConfirm = () => {
    // Build filter object from current state
    const deleteFilters: any = {
      folder: folder,
    };

    if (selectedAccount) {
      deleteFilters.account_id = selectedAccount;
    }

    if (selectedTags.length > 0) {
      deleteFilters.tags = selectedTags;
    }

    if (isUnreadOnly) {
      deleteFilters.is_unread = true;
    }

    if (searchQuery) {
      deleteFilters.search = searchQuery;
    }

    deleteAll.mutate(deleteFilters, {
      onSuccess: () => {
        setDeleteAllDialogOpen(false);
      },
    });
  };

  // Build filters
  const filters: any = {
    limit: 50,
    offset: 0,
    folder: folder,
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

  // Build filter description for delete all confirmation
  const getFilterDescription = () => {
    const parts = [];
    if (folder && folder !== 'inbox') parts.push(`in ${folder}`);
    if (selectedTags.length > 0) parts.push(`tagged with ${selectedTags.join(', ')}`);
    if (isUnreadOnly) parts.push('unread only');
    if (searchQuery) parts.push(`matching "${searchQuery}"`);
    return parts.length > 0 ? ` ${parts.join(', ')}` : '';
  };

  // Render messages
  return (
    <>
      <Box p={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary">
            {data.total} {data.total === 1 ? 'message' : 'messages'}
          </Typography>

          {/* Delete All button - show if there are any filters active or messages exist */}
          {data.total > 0 && (
            <Button
              size="small"
              color="error"
              startIcon={<DeleteSweep />}
              onClick={handleDeleteAll}
              variant="outlined"
            >
              Delete All
            </Button>
          )}
        </Box>

        {data.messages.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
            onClick={() => navigate(`/messages/${message.id}`)}
          />
        ))}
      </Box>

      {/* Bulk Action Bar */}
      <BulkActionBar
        onDelete={handleBulkDelete}
        onMarkRead={handleBulkMarkRead}
        onMarkUnread={handleBulkMarkUnread}
      />

      {/* Delete All Confirmation Dialog */}
      <Dialog open={deleteAllDialogOpen} onClose={() => setDeleteAllDialogOpen(false)}>
        <DialogTitle>Delete All Messages?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {data.total} {data.total === 1 ? 'message' : 'messages'}
            {getFilterDescription()}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteAllConfirm}
            color="error"
            variant="contained"
            disabled={deleteAll.isPending}
          >
            {deleteAll.isPending ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
