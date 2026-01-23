/**
 * React Query hooks for messages
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messages } from '../api/client';
import { statsKeys } from './useStats';
import type { UpdateTagsRequest, MarkReadRequest } from '../api/types';

// Query keys
export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (filters: any) => [...messageKeys.lists(), filters] as const,
  details: () => [...messageKeys.all, 'detail'] as const,
  detail: (id: string) => [...messageKeys.details(), id] as const,
  smartReplies: (id: string) => [...messageKeys.detail(id), 'smart-replies'] as const,
};

// Hooks
export function useMessages(filters: {
  account_id?: string;
  tag?: string;
  tags?: string[];
  is_unread?: boolean;
  folder?: string;
  thread_id?: string;
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

export function useThreadMessages(threadId: string | null | undefined) {
  return useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => messages.list({ thread_id: threadId!, limit: 100 }),
    enabled: !!threadId,
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
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches for this message
      await queryClient.cancelQueries({ queryKey: messageKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: messageKeys.lists() });

      // Snapshot previous values
      const previousMessage = queryClient.getQueryData(messageKeys.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: messageKeys.lists() });

      // Optimistically update the message detail cache
      queryClient.setQueryData(messageKeys.detail(id), (old: any) => {
        if (!old) return old;
        return { ...old, tags: data.tags };
      });

      // Optimistically update all list caches
      queryClient.setQueriesData({ queryKey: messageKeys.lists() }, (old: any) => {
        if (!old?.messages) return old;
        return {
          ...old,
          messages: old.messages.map((m: any) =>
            m.id === id ? { ...m, tags: data.tags } : m
          ),
        };
      });

      return { previousMessage, previousLists };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousMessage) {
        queryClient.setQueryData(messageKeys.detail(id), context.previousMessage);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_, __, { id }) => {
      // Background refetch to sync with server (non-blocking)
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: messageKeys.detail(id) });
    },
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MarkReadRequest }) =>
      messages.markRead(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches for this message
      await queryClient.cancelQueries({ queryKey: messageKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: messageKeys.lists() });

      // Snapshot previous values
      const previousMessage = queryClient.getQueryData(messageKeys.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: messageKeys.lists() });

      // Optimistically update the message detail cache
      queryClient.setQueryData(messageKeys.detail(id), (old: any) => {
        if (!old) return old;
        return { ...old, is_unread: data.is_unread };
      });

      // Optimistically update all list caches
      queryClient.setQueriesData({ queryKey: messageKeys.lists() }, (old: any) => {
        if (!old?.messages) return old;
        return {
          ...old,
          messages: old.messages.map((m: any) =>
            m.id === id ? { ...m, is_unread: data.is_unread } : m
          ),
        };
      });

      return { previousMessage, previousLists };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousMessage) {
        queryClient.setQueryData(messageKeys.detail(id), context.previousMessage);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Background refetch lists and unread count to sync (non-blocking)
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: statsKeys.unreadCount });
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
      // Invalidate and refetch messages list, unread count, and tags
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: statsKeys.unreadCount });
      queryClient.invalidateQueries({ queryKey: statsKeys.tags });
    },
  });
}

export function useBulkMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageIds, isUnread }: { messageIds: string[]; isUnread: boolean }) => {
      console.log('useBulkMarkRead mutation called with:', { messageIds, isUnread });
      return messages.bulkMarkRead({ message_ids: messageIds, is_unread: isUnread });
    },
    onSuccess: (data) => {
      console.log('useBulkMarkRead success:', data);
      // Force refetch after backend confirms update
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: messageKeys.details() });
      queryClient.invalidateQueries({ queryKey: statsKeys.unreadCount });
    },
    onError: (error) => {
      console.error('useBulkMarkRead error:', error);
    },
  });
}

export function useBulkDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageIds: string[]) =>
      messages.bulkDelete({ message_ids: messageIds }),
    onMutate: async (messageIds) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: messageKeys.lists() });

      // Snapshot previous value
      const previousQueries = queryClient.getQueriesData({ queryKey: messageKeys.lists() });

      // Optimistically update - remove messages from all list queries
      queryClient.setQueriesData({ queryKey: messageKeys.lists() }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.filter((m: any) => !messageIds.includes(m.id)),
        };
      });

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: messageKeys.details() });
      queryClient.invalidateQueries({ queryKey: statsKeys.unreadCount });
      queryClient.invalidateQueries({ queryKey: statsKeys.tags });
    },
  });
}

export function useDeleteAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filters: {
      account_id?: string;
      tags?: string[];
      is_unread?: boolean;
      folder?: string;
      search?: string;
    }) => messages.deleteAll(filters),
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: messageKeys.details() });
      queryClient.invalidateQueries({ queryKey: statsKeys.unreadCount });
      queryClient.invalidateQueries({ queryKey: statsKeys.tags });
    },
  });
}

export function useBulkRestore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageIds: string[]) =>
      messages.bulkRestore({ message_ids: messageIds }),
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: messageKeys.details() });
      queryClient.invalidateQueries({ queryKey: statsKeys.unreadCount });
      queryClient.invalidateQueries({ queryKey: statsKeys.tags });
    },
  });
}

export function useBulkPermanentDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageIds: string[]) =>
      messages.bulkPermanentDelete({ message_ids: messageIds }),
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: messageKeys.details() });
      queryClient.invalidateQueries({ queryKey: statsKeys.unreadCount });
      queryClient.invalidateQueries({ queryKey: statsKeys.tags });
    },
  });
}

export function useClearTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => messages.clearTrash(),
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: messageKeys.details() });
      queryClient.invalidateQueries({ queryKey: statsKeys.unreadCount });
      queryClient.invalidateQueries({ queryKey: statsKeys.tags });
    },
  });
}

export function useSmartReplies(messageId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: messageKeys.smartReplies(messageId),
    queryFn: () => messages.getSmartReplies(messageId),
    enabled: !!messageId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - replies don't need to be refreshed often
    retry: false, // Don't retry on failure (graceful degradation)
  });
}
