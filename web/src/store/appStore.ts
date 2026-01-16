/**
 * Zustand store for client-side UI state
 */

import { create } from 'zustand';

interface AppState {
  // Filters
  selectedAccount: string | null;
  selectedTags: string[];
  searchQuery: string;
  isUnreadOnly: boolean;

  // UI state
  syncStatus: 'idle' | 'syncing' | 'error';
  drawerOpen: boolean;

  // Actions
  setSelectedAccount: (accountId: string | null) => void;
  toggleTag: (tag: string) => void;
  clearTags: () => void;
  setSearchQuery: (query: string) => void;
  setIsUnreadOnly: (value: boolean) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  selectedAccount: null,
  selectedTags: [],
  searchQuery: '',
  isUnreadOnly: false,
  syncStatus: 'idle',
  drawerOpen: true,

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
}));
