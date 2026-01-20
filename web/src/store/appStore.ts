/**
 * Zustand store for client-side UI state
 */

import { create } from 'zustand';

// Check if we're on mobile (< 900px) for initial drawer state
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 900;
};

// Layout modes for reading pane
type LayoutMode = 'list-only' | 'split' | 'detail-only';

interface AppState {
  // Filters
  selectedAccount: string | null;
  selectedTags: string[];
  searchQuery: string;
  isUnreadOnly: boolean;

  // UI state
  syncStatus: 'idle' | 'syncing' | 'error';
  drawerOpen: boolean;

  // Reading pane state
  layoutMode: LayoutMode;
  selectedMessageId: string | null;
  readingPaneWidth: number; // Percentage for split view (0-100)
  preferPlainTextInCompact: boolean; // Show plain text instead of HTML in compact mode

  // Bulk selection
  selectedMessageIds: Set<string>;
  selectionMode: boolean;  // True when in multi-select mode (mobile long-press)

  // Actions
  setSelectedAccount: (accountId: string | null) => void;
  toggleTag: (tag: string) => void;
  clearTags: () => void;
  setSearchQuery: (query: string) => void;
  setIsUnreadOnly: (value: boolean) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;

  // Reading pane actions
  setLayoutMode: (mode: LayoutMode) => void;
  toggleLayoutMode: () => void;
  setSelectedMessageId: (id: string | null) => void;
  setReadingPaneWidth: (width: number) => void;
  setPreferPlainTextInCompact: (value: boolean) => void;
  selectNextMessage: (messageIds: string[]) => void;
  selectPrevMessage: (messageIds: string[]) => void;

  // Bulk selection actions
  toggleMessageSelection: (id: string) => void;
  selectAllMessages: (ids: string[]) => void;
  clearSelection: () => void;
  isMessageSelected: (id: string) => boolean;
  enterSelectionMode: (initialMessageId?: string) => void;
  exitSelectionMode: () => void;
}

// Get saved reading pane width from localStorage
const getSavedPaneWidth = (): number => {
  if (typeof window === 'undefined') return 50;
  const saved = localStorage.getItem('readingPaneWidth');
  return saved ? parseInt(saved, 10) : 50;
};

// Get saved layout mode from localStorage
const getSavedLayoutMode = (): LayoutMode => {
  if (typeof window === 'undefined') return 'split';
  const saved = localStorage.getItem('layoutMode');
  if (saved === 'list-only' || saved === 'split' || saved === 'detail-only') {
    return saved;
  }
  // Default: split on desktop, list-only on mobile
  return isMobileDevice() ? 'list-only' : 'split';
};

// Get saved plain text preference from localStorage
const getSavedPreferPlainText = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('preferPlainTextInCompact') === 'true';
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  selectedAccount: null,
  selectedTags: [],
  searchQuery: '',
  isUnreadOnly: false,
  syncStatus: 'idle',
  // Start with drawer closed on mobile, open on desktop
  drawerOpen: !isMobileDevice(),
  // Reading pane state
  layoutMode: getSavedLayoutMode(),
  selectedMessageId: null,
  readingPaneWidth: getSavedPaneWidth(),
  preferPlainTextInCompact: getSavedPreferPlainText(),
  // Bulk selection
  selectedMessageIds: new Set<string>(),
  selectionMode: false,

  // Actions
  setSelectedAccount: (accountId) => set({ selectedAccount: accountId }),

  toggleTag: (tag) =>
    set((state) => ({
      selectedTags: state.selectedTags.includes(tag)
        ? state.selectedTags.filter((t) => t !== tag)
        : [...state.selectedTags, tag],
    })),

  clearTags: () => set({ selectedTags: [] }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setIsUnreadOnly: (value) => set({ isUnreadOnly: value }),

  setSyncStatus: (status) => set({ syncStatus: status }),

  setDrawerOpen: (open) => set({ drawerOpen: open }),

  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),

  // Reading pane actions
  setLayoutMode: (mode) => {
    localStorage.setItem('layoutMode', mode);
    set({ layoutMode: mode });
  },

  toggleLayoutMode: () => {
    const current = get().layoutMode;
    const next = current === 'split' ? 'list-only' : 'split';
    localStorage.setItem('layoutMode', next);
    set({ layoutMode: next });
  },

  setSelectedMessageId: (id) => set({ selectedMessageId: id }),

  setReadingPaneWidth: (width) => {
    localStorage.setItem('readingPaneWidth', width.toString());
    set({ readingPaneWidth: width });
  },

  setPreferPlainTextInCompact: (value) => {
    localStorage.setItem('preferPlainTextInCompact', value.toString());
    set({ preferPlainTextInCompact: value });
  },

  selectNextMessage: (messageIds) => {
    const current = get().selectedMessageId;
    if (!current || messageIds.length === 0) {
      set({ selectedMessageId: messageIds[0] || null });
      return;
    }
    const currentIndex = messageIds.indexOf(current);
    const nextIndex = Math.min(currentIndex + 1, messageIds.length - 1);
    set({ selectedMessageId: messageIds[nextIndex] });
  },

  selectPrevMessage: (messageIds) => {
    const current = get().selectedMessageId;
    if (!current || messageIds.length === 0) {
      set({ selectedMessageId: messageIds[0] || null });
      return;
    }
    const currentIndex = messageIds.indexOf(current);
    const prevIndex = Math.max(currentIndex - 1, 0);
    set({ selectedMessageId: messageIds[prevIndex] });
  },

  // Bulk selection actions
  toggleMessageSelection: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedMessageIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedMessageIds: newSelection };
    }),

  selectAllMessages: (ids) =>
    set({ selectedMessageIds: new Set(ids) }),

  clearSelection: () => set({ selectedMessageIds: new Set<string>() }),

  isMessageSelected: (id) => get().selectedMessageIds.has(id),

  enterSelectionMode: (initialMessageId) =>
    set((state) => {
      const newSelection = new Set(state.selectedMessageIds);
      if (initialMessageId) {
        newSelection.add(initialMessageId);
      }
      return {
        selectionMode: true,
        selectedMessageIds: newSelection,
      };
    }),

  exitSelectionMode: () =>
    set({
      selectionMode: false,
      selectedMessageIds: new Set<string>(),
    }),
}));
