/**
 * Toast notification hook using Zustand for state management
 */

import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    // Auto-remove after 6 seconds if no action
    if (!toast.action) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, 6000);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export function useToast() {
  const { addToast } = useToastStore();

  return {
    success: (message: string, action?: Toast['action']) =>
      addToast({ message, severity: 'success', action }),
    error: (message: string) => addToast({ message, severity: 'error' }),
    info: (message: string) => addToast({ message, severity: 'info' }),
    warning: (message: string) => addToast({ message, severity: 'warning' }),
  };
}
