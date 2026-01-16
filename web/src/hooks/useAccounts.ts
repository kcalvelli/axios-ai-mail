/**
 * React Query hooks for accounts
 */

import { useQuery } from '@tanstack/react-query';
import { accounts } from '../api/client';

export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: () => [...accountKeys.lists()] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
  stats: (id: string) => [...accountKeys.detail(id), 'stats'] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.list(),
    queryFn: () => accounts.list(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAccountStats(id: string) {
  return useQuery({
    queryKey: accountKeys.stats(id),
    queryFn: () => accounts.getStats(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
