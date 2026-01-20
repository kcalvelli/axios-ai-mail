/**
 * React Query hooks for tags and statistics
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tags, stats, sync } from '../api/client';
import type { TriggerSyncRequest } from '../api/types';

export const statsKeys = {
  tags: ['tags'] as const,
  tagsAvailable: ['tags', 'available'] as const,
  stats: ['stats'] as const,
  syncStatus: ['sync', 'status'] as const,
};

export function useTags() {
  return useQuery({
    queryKey: statsKeys.tags,
    queryFn: () => tags.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAvailableTags() {
  return useQuery({
    queryKey: statsKeys.tagsAvailable,
    queryFn: () => tags.available(),
    staleTime: 30 * 60 * 1000, // 30 minutes (taxonomy doesn't change often)
  });
}

export function useStats() {
  return useQuery({
    queryKey: statsKeys.stats,
    queryFn: () => stats.get(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useSyncStatus() {
  return useQuery({
    queryKey: statsKeys.syncStatus,
    queryFn: () => sync.status(),
    refetchInterval: 2000, // Poll every 2 seconds
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TriggerSyncRequest = {}) => sync.trigger(data),
    onSuccess: () => {
      // Invalidate all queries to refresh data after sync
      queryClient.invalidateQueries();
    },
  });
}
