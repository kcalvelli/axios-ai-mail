/**
 * useKeyboardNavigation hook - Gmail-style keyboard shortcuts
 *
 * Navigation:
 *   j/ArrowDown - Next message
 *   k/ArrowUp - Previous message
 *   Enter - Open message
 *   Escape - Close/go back
 *   o - Expand/collapse thread
 *
 * Actions:
 *   r - Reply
 *   f - Forward
 *   e - Archive (mark read)
 *   # or d - Delete
 *   u - Toggle read/unread
 *   ? - Show help
 */

import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

interface KeyboardNavigationOptions {
  /** List of message IDs for navigation */
  messageIds: string[];
  /** Callback for reply action */
  onReply?: (messageId: string) => void;
  /** Callback for forward action */
  onForward?: (messageId: string) => void;
  /** Callback for delete action */
  onDelete?: (messageId: string) => void;
  /** Callback for toggle read action */
  onToggleRead?: (messageId: string) => void;
  /** Callback for archive action */
  onArchive?: (messageId: string) => void;
  /** Whether keyboard navigation is enabled */
  enabled?: boolean;
}

export function useKeyboardNavigation({
  messageIds,
  onReply,
  onForward,
  onDelete,
  onToggleRead,
  onArchive,
  enabled = true,
}: KeyboardNavigationOptions) {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const {
    selectedMessageId,
    setSelectedMessageId,
    selectNextMessage,
    selectPrevMessage,
    layoutMode,
    setLayoutMode,
  } = useAppStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      // Ignore if modifier keys are pressed (except for ?)
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      switch (e.key) {
        // Navigation
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          selectNextMessage(messageIds);
          break;

        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          selectPrevMessage(messageIds);
          break;

        case 'Enter':
          e.preventDefault();
          if (selectedMessageId) {
            if (layoutMode === 'list-only') {
              navigate(`/messages/${selectedMessageId}`);
            }
            // In split mode, message is already shown
          }
          break;

        case 'Escape':
          e.preventDefault();
          if (layoutMode === 'detail-only') {
            setLayoutMode('list-only');
          } else {
            setSelectedMessageId(null);
          }
          break;

        case 'o':
          // Toggle between split and list-only
          e.preventDefault();
          if (layoutMode === 'split') {
            setLayoutMode('list-only');
          } else {
            setLayoutMode('split');
          }
          break;

        // Actions (require selected message)
        case 'r':
          e.preventDefault();
          if (selectedMessageId && onReply) {
            onReply(selectedMessageId);
          }
          break;

        case 'f':
          e.preventDefault();
          if (selectedMessageId && onForward) {
            onForward(selectedMessageId);
          }
          break;

        case '#':
        case 'd':
          e.preventDefault();
          if (selectedMessageId && onDelete) {
            onDelete(selectedMessageId);
            // Auto-select next message
            selectNextMessage(messageIds);
          }
          break;

        case 'u':
          e.preventDefault();
          if (selectedMessageId && onToggleRead) {
            onToggleRead(selectedMessageId);
          }
          break;

        case 'e':
          e.preventDefault();
          if (selectedMessageId && onArchive) {
            onArchive(selectedMessageId);
            selectNextMessage(messageIds);
          }
          break;

        case '?':
          e.preventDefault();
          setHelpOpen((prev) => !prev);
          break;
      }
    },
    [
      messageIds,
      selectedMessageId,
      layoutMode,
      navigate,
      selectNextMessage,
      selectPrevMessage,
      setSelectedMessageId,
      setLayoutMode,
      onReply,
      onForward,
      onDelete,
      onToggleRead,
      onArchive,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  return {
    helpOpen,
    setHelpOpen,
  };
}

// Keyboard shortcuts data for help modal
export const KEYBOARD_SHORTCUTS = [
  {
    category: 'Navigation',
    shortcuts: [
      { key: 'j / ↓', description: 'Next message' },
      { key: 'k / ↑', description: 'Previous message' },
      { key: 'Enter', description: 'Open message' },
      { key: 'Escape', description: 'Close / Go back' },
      { key: 'o', description: 'Toggle split view' },
    ],
  },
  {
    category: 'Actions',
    shortcuts: [
      { key: 'r', description: 'Reply' },
      { key: 'f', description: 'Forward' },
      { key: 'u', description: 'Toggle read/unread' },
      { key: 'e', description: 'Archive' },
      { key: '# / d', description: 'Delete' },
    ],
  },
  {
    category: 'Help',
    shortcuts: [{ key: '?', description: 'Show keyboard shortcuts' }],
  },
];
