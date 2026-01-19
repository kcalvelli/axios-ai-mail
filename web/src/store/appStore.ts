/**
 * Zustand store for client-side UI state
 */

import { create } from 'zustand';

// Check if we're on mobile (< 900px) for initial drawer state
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 900;
};

interface AppState {
  // Filters
  selectedAccount: string | null;
  selectedTags: string[];
  searchQuery: string;
  isUnreadOnly: boolean;

  // UI state
  syncStatus: 'idle' | 'syncing' | 'error';
  drawerOpen: boolean;

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

  // Bulk selection actions
  toggleMessageSelection: (id: string) => void;
  selectAllMessages: (ids: string[]) => void;
  clearSelection: () => void;
  isMessageSelected: (id: string) => boolean;
  enterSelectionMode: (initialMessageId?: string) => void;
  exitSelectionMode: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  selectedAccount: null,
  selectedTags: [],
  searchQuery: '',
  isUnreadOnly: false,
  syncStatus: 'idle',
  // Start with drawer closed on mobile, open on desktop
  drawerOpen: !isMobileDevice(),
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
