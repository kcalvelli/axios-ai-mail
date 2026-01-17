/**
 * React Query hooks for messages
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messages } from '../api/client';
import type { UpdateTagsRequest, MarkReadRequest } from '../api/types';

// Query keys
export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (filters: any) => [...messageKeys.lists(), filters] as const,
  details: () => [...messageKeys.all, 'detail'] as const,
  detail: (id: string) => [...messageKeys.details(), id] as const,
};

// Hooks
export function useMessages(filters: {
  account_id?: string;
  tag?: string;
  is_unread?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  return useQuery({
    queryKey: messageKeys.list(filters),
    queryFn: () => messages.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMessage(id: string) {
  return useQuery({
    queryKey: messageKeys.detail(id),
    queryFn: () => messages.get(id),
    enabled: !!id,
  });
}

export function useUpdateTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTagsRequest }) =>
      messages.updateTags(id, data),
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
    },
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MarkReadRequest }) =>
      messages.markRead(id, data),
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: messageKeys.details() });
    },
  });
}

export function useMessageBody(id: string) {
  return useQuery({
    queryKey: [...messageKeys.detail(id), 'body'],
    queryFn: () => messages.getBody(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes - bodies don't change
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => messages.delete(id),
    onSuccess: () => {
      // Invalidate and refetch messages list
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
    },
  });
}
