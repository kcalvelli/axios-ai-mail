/**
 * BulkActionBar component - Floating action bar for bulk operations
 */

import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Delete,
  Close,
  MarkEmailRead,
  MarkEmailUnread,
} from '@mui/icons-material';
import { useAppStore } from '../store/appStore';

interface BulkActionBarProps {
  onDelete: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
}

export function BulkActionBar({
  onDelete,
  onMarkRead,
  onMarkUnread,
}: BulkActionBarProps) {
  const { selectedMessageIds, clearSelection } = useAppStore();

  const selectedCount = selectedMessageIds.size;

  // Don't render if no messages selected
  if (selectedCount === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        pb: 2,
        pointerEvents: 'none', // Allow clicks through the Box
      }}
    >
      <Paper
        elevation={8}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 3,
          py: 1.5,
          borderRadius: 2,
          pointerEvents: 'auto', // Re-enable clicks on the Paper
        }}
      >
        {/* Selected count */}
        <Typography variant="body2" fontWeight={600}>
          {selectedCount} {selectedCount === 1 ? 'message' : 'messages'} selected
        </Typography>

        <Divider orientation="vertical" flexItem />

        {/* Mark as Read */}
        <Tooltip title="Mark as read">
          <IconButton
            size="small"
            color="primary"
            onClick={onMarkRead}
          >
            <MarkEmailRead />
          </IconButton>
        </Tooltip>

        {/* Mark as Unread */}
        <Tooltip title="Mark as unread">
          <IconButton
            size="small"
            color="primary"
            onClick={onMarkUnread}
          >
            <MarkEmailUnread />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {/* Delete */}
        <Tooltip title="Delete selected">
          <IconButton
            size="small"
            color="error"
            onClick={onDelete}
          >
            <Delete />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {/* Clear Selection */}
        <Button
          size="small"
          startIcon={<Close />}
          onClick={clearSelection}
          variant="text"
        >
          Clear
        </Button>
      </Paper>
    </Box>
  );
}
