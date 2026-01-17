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
import { InboxOutlined, DeleteSweep, CheckBox } from '@mui/icons-material';
import { useState } from 'react';
import { MessageCard } from './MessageCard';
import { BulkActionBar } from './BulkActionBar';
import {
  useMessages,
  useBulkDelete,
  useBulkMarkRead,
  useBulkRestore,
  useClearTrash,
} from '../hooks/useMessages';
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
    selectAllMessages,
  } = useAppStore();

  const bulkDelete = useBulkDelete();
  const bulkMarkRead = useBulkMarkRead();
  const bulkRestore = useBulkRestore();
  const clearTrash = useClearTrash();

  const [clearTrashDialogOpen, setClearTrashDialogOpen] = useState(false);

  // Get folder from URL query params (default to inbox)
  const folder = searchParams.get('folder') || 'inbox';
  const isTrash = folder === 'trash';

  // Bulk operation handlers
  const handleBulkDelete = () => {
    const messageIds = Array.from(selectedMessageIds);
    if (messageIds.length === 0) return;

    bulkDelete.mutate(messageIds, {
      onSuccess: () => {
        clearSelection();
      },
    });
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

  const handleBulkRestore = () => {
    const messageIds = Array.from(selectedMessageIds);
    if (messageIds.length === 0) return;

    bulkRestore.mutate(messageIds, {
      onSuccess: () => {
        clearSelection();
      },
    });
  };

  const handleSelectAll = () => {
    if (!data) return;

    // If all messages are already selected, deselect them
    const allIds = data.messages.map((m) => m.id);
    const allSelected = allIds.every((id) => selectedMessageIds.has(id));

    if (allSelected) {
      clearSelection();
    } else {
      selectAllMessages(allIds);
    }
  };

  const handleClearTrash = () => {
    setClearTrashDialogOpen(true);
  };

  const handleClearTrashConfirm = () => {
    clearTrash.mutate(undefined, {
      onSuccess: () => {
        setClearTrashDialogOpen(false);
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

  // Check if all messages on current page are selected
  const allIds = data.messages.map((m) => m.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedMessageIds.has(id));

  // Render messages
  return (
    <>
      <Box p={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary">
            {data.total} {data.total === 1 ? 'message' : 'messages'}
          </Typography>

          {/* Action buttons */}
          {data.total > 0 && (
            <Box display="flex" gap={1}>
              {/* Select All / Deselect All button - always show */}
              <Button
                size="small"
                color="primary"
                startIcon={<CheckBox />}
                onClick={handleSelectAll}
                variant="outlined"
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>

              {/* Clear Trash button - only in trash folder */}
              {isTrash && (
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteSweep />}
                  onClick={handleClearTrash}
                  variant="outlined"
                >
                  Clear Trash
                </Button>
              )}
            </Box>
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
        onRestore={handleBulkRestore}
        isTrash={isTrash}
      />

      {/* Clear Trash Confirmation Dialog */}
      <Dialog open={clearTrashDialogOpen} onClose={() => setClearTrashDialogOpen(false)}>
        <DialogTitle>Permanently Delete All?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete all {data.total} {data.total === 1 ? 'message' : 'messages'} in Trash?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearTrashDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleClearTrashConfirm}
            color="error"
            variant="contained"
            disabled={clearTrash.isPending}
          >
            {clearTrash.isPending ? 'Deleting...' : 'Permanently Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
