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
  Pagination,
  Stack,
} from '@mui/material';
import { InboxOutlined, DeleteSweep, CheckBox } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { MessageCard } from './MessageCard';
import { BulkActionBar } from './BulkActionBar';
import {
  useMessages,
  useBulkDelete,
  useBulkMarkRead,
  useBulkRestore,
  useBulkPermanentDelete,
  useClearTrash,
} from '../hooks/useMessages';
import { useAppStore } from '../store/appStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';

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
  const bulkPermanentDelete = useBulkPermanentDelete();
  const clearTrash = useClearTrash();
  const toast = useToast();

  const [clearTrashDialogOpen, setClearTrashDialogOpen] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Get folder from URL query params (default to inbox)
  const folder = searchParams.get('folder') || 'inbox';
  const isTrash = folder === 'trash';

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedAccount, selectedTags, isUnreadOnly, searchQuery, folder]);

  // Bulk operation handlers
  const handleBulkDelete = () => {
    const messageIds = Array.from(selectedMessageIds);
    if (messageIds.length === 0) return;

    bulkDelete.mutate(messageIds, {
      onSuccess: () => {
        clearSelection();
        toast.success(
          `Moved ${messageIds.length} ${messageIds.length === 1 ? 'message' : 'messages'} to trash`,
          {
            label: 'Undo',
            onClick: () => {
              bulkRestore.mutate(messageIds);
            },
          }
        );
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
          toast.success(
            `Marked ${messageIds.length} ${messageIds.length === 1 ? 'message' : 'messages'} as read`
          );
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
          toast.success(
            `Marked ${messageIds.length} ${messageIds.length === 1 ? 'message' : 'messages'} as unread`
          );
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
        toast.success(
          `Restored ${messageIds.length} ${messageIds.length === 1 ? 'message' : 'messages'}`
        );
      },
    });
  };

  const handleBulkPermanentDelete = () => {
    setPermanentDeleteDialogOpen(true);
  };

  const handlePermanentDeleteConfirm = () => {
    const messageIds = Array.from(selectedMessageIds);
    if (messageIds.length === 0) return;

    bulkPermanentDelete.mutate(messageIds, {
      onSuccess: () => {
        clearSelection();
        setPermanentDeleteDialogOpen(false);
        toast.success(
          `Permanently deleted ${messageIds.length} ${messageIds.length === 1 ? 'message' : 'messages'}`
        );
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
        toast.success('Trash cleared successfully');
      },
    });
  };

  // Build filters
  const ITEMS_PER_PAGE = 50;
  const filters: any = {
    limit: ITEMS_PER_PAGE,
    offset: (page - 1) * ITEMS_PER_PAGE,
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

        {/* Pagination */}
        {data.total > ITEMS_PER_PAGE && (
          <Stack spacing={2} alignItems="center" mt={3} mb={2}>
            <Pagination
              count={Math.ceil(data.total / ITEMS_PER_PAGE)}
              page={page}
              onChange={(event, value) => {
                setPage(value);
                clearSelection(); // Clear selections when changing pages
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
              }}
              color="primary"
              showFirstButton
              showLastButton
            />
            <Typography variant="caption" color="text.secondary">
              Showing {data.offset + 1}-{Math.min(data.offset + ITEMS_PER_PAGE, data.total)} of {data.total}
            </Typography>
          </Stack>
        )}
      </Box>

      {/* Bulk Action Bar */}
      <BulkActionBar
        onDelete={handleBulkDelete}
        onMarkRead={handleBulkMarkRead}
        onMarkUnread={handleBulkMarkUnread}
        onRestore={handleBulkRestore}
        onPermanentDelete={handleBulkPermanentDelete}
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

      {/* Permanent Delete Selected Confirmation Dialog */}
      <Dialog open={permanentDeleteDialogOpen} onClose={() => setPermanentDeleteDialogOpen(false)}>
        <DialogTitle>Permanently Delete Selected?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete {selectedMessageIds.size} selected {selectedMessageIds.size === 1 ? 'message' : 'messages'}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermanentDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handlePermanentDeleteConfirm}
            color="error"
            variant="contained"
            disabled={bulkPermanentDelete.isPending}
          >
            {bulkPermanentDelete.isPending ? 'Deleting...' : 'Permanently Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
