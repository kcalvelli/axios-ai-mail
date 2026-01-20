/**
 * ReadingPane component - Split view layout with message list and detail
 * Desktop: Resizable split panes
 * Mobile: Single pane (list or detail)
 */

import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useAppStore } from '../store/appStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { MessageDetail } from './MessageDetail';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import type { Message } from '../api/types';

interface ReadingPaneProps {
  /** The message list component to render */
  children: React.ReactNode;
  /** List of messages for keyboard navigation */
  messages: Message[];
  /** Handler for reply action */
  onReply?: (messageId: string) => void;
  /** Handler for delete action */
  onDelete?: (messageId: string) => void;
  /** Handler for toggle read action */
  onToggleRead?: (messageId: string) => void;
}

export function ReadingPane({
  children,
  messages,
  onReply,
  onDelete,
  onToggleRead,
}: ReadingPaneProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useIsMobile();
  const dividerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    layoutMode,
    selectedMessageId,
    setSelectedMessageId,
    readingPaneWidth,
    setReadingPaneWidth,
  } = useAppStore();

  // Memoize to prevent new array reference on every render
  const messageIds = useMemo(() => messages.map((m) => m.id), [messages]);

  // Keyboard navigation
  const { helpOpen, setHelpOpen } = useKeyboardNavigation({
    messageIds,
    enabled: !isMobile,
    onReply,
    onDelete,
    onToggleRead,
  });

  // Handle divider drag for resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = dividerRef.current?.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      // Clamp between 20% and 80%
      const clampedWidth = Math.max(20, Math.min(80, newWidth));
      setReadingPaneWidth(100 - clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setReadingPaneWidth]);

  // On mobile, show either list or detail
  if (isMobile) {
    if (selectedMessageId) {
      return (
        <Box sx={{ height: '100%' }}>
          <MessageDetail
            messageId={selectedMessageId}
            compact
            showBackButton
            onBack={() => setSelectedMessageId(null)}
            onDelete={onDelete ? () => onDelete(selectedMessageId) : undefined}
          />
        </Box>
      );
    }
    return <>{children}</>;
  }

  // Desktop: list-only mode
  if (layoutMode === 'list-only') {
    return (
      <Box>
        {children}
        <KeyboardShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      </Box>
    );
  }

  // Desktop: split mode
  const listWidth = 100 - readingPaneWidth;

  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 140px)', // Account for header and padding
        overflow: 'hidden',
      }}
    >
      {/* Message List Pane */}
      <Box
        sx={{
          width: `${listWidth}%`,
          minWidth: 300,
          height: '100%',
          overflow: 'auto',
          pr: 1,
          flexShrink: 0,
          // Thin scrollbar (single line style)
          '&::-webkit-scrollbar': {
            width: 4,
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: 2,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          },
          // Firefox
          scrollbarWidth: 'thin',
          scrollbarColor: isDark ? 'rgba(255,255,255,0.2) transparent' : 'rgba(0,0,0,0.2) transparent',
        }}
      >
        {children}
      </Box>

      {/* Resizable Divider */}
      <Box
        ref={dividerRef}
        onMouseDown={handleMouseDown}
        sx={{
          width: 8,
          cursor: 'col-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isDragging ? 'primary.main' : 'transparent',
          '&:hover': {
            bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          },
          transition: 'background-color 0.2s',
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 4,
            height: 40,
            bgcolor: isDark ? '#444' : '#ddd',
            borderRadius: 2,
          }}
        />
      </Box>

      {/* Reading Pane */}
      <Box
        sx={{
          flex: 1,
          minWidth: 300,
          height: '100%',
          overflow: 'hidden',
          pl: 1,
        }}
      >
        {selectedMessageId ? (
          <MessageDetail
            messageId={selectedMessageId}
            compact
            showBackButton={false}
            onDelete={onDelete ? () => onDelete(selectedMessageId) : undefined}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
              textAlign: 'center',
              p: 4,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Select a message to read
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use <strong>j</strong>/<strong>k</strong> to navigate, <strong>Enter</strong> to open
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
              Press <strong>?</strong> for keyboard shortcuts
            </Typography>
          </Box>
        )}
      </Box>

      <KeyboardShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Box>
  );
}
