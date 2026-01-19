/**
 * BulkActionBar component - Floating action bar for bulk operations
 * Fixed at bottom of viewport on all devices for easy thumb access
 * Uses Portal to render outside scroll containers so position:fixed works correctly
 */

import { createPortal } from 'react-dom';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Delete,
  Close,
  MarkEmailRead,
  MarkEmailUnread,
  RestoreFromTrash,
} from '@mui/icons-material';
import { useAppStore } from '../store/appStore';

interface BulkActionBarProps {
  onDelete: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
  isTrash?: boolean;
}

export function BulkActionBar({
  onDelete,
  onMarkRead,
  onMarkUnread,
  onRestore,
  onPermanentDelete,
  isTrash = false,
}: BulkActionBarProps) {
  const { selectedMessageIds, exitSelectionMode, selectionMode } = useAppStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const selectedCount = selectedMessageIds.size;

  // Don't render if no messages selected
  if (selectedCount === 0) {
    return null;
  }

  // Use portal to render at body level so position:fixed works correctly
  // (not affected by scroll containers or transform parents)
  return createPortal(
    <Box
      sx={{
        position: 'fixed',
        // Fixed at bottom of viewport for thumb access
        bottom: isMobile ? 16 : 0,
        left: 0,
        right: 0,
        pb: isMobile ? 0 : 2,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
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

        {isTrash ? (
          // Trash folder actions
          <>
            {/* Restore */}
            <Tooltip title="Restore to original folder">
              <IconButton
                size="small"
                color="primary"
                onClick={onRestore}
              >
                <RestoreFromTrash />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            {/* Permanent Delete */}
            <Tooltip title="Permanently delete selected">
              <IconButton
                size="small"
                color="error"
                onClick={onPermanentDelete}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          // Normal folder actions
          <>
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

            {/* Delete (moves to trash) */}
            <Tooltip title="Move to trash">
              <IconButton
                size="small"
                color="error"
                onClick={onDelete}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </>
        )}

        <Divider orientation="vertical" flexItem />

        {/* Clear Selection / Exit Selection Mode */}
        <Button
          size="small"
          startIcon={<Close />}
          onClick={exitSelectionMode}
          variant="text"
        >
          {selectionMode ? 'Exit' : 'Clear'}
        </Button>
      </Paper>
    </Box>,
    document.body
  );
}
