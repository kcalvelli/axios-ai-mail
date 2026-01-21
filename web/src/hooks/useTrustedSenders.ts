/**
 * React Query hooks for trusted senders
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trustedSenders } from '../api/client';

// Query keys
export const trustedSenderKeys = {
  all: ['trustedSenders'] as const,
  list: (accountId: string) => [...trustedSenderKeys.all, 'list', accountId] as const,
  check: (accountId: string, senderEmail: string) =>
    [...trustedSenderKeys.all, 'check', accountId, senderEmail] as const,
};

/**
 * Get list of trusted senders for an account
 */
export function useTrustedSenders(accountId: string | undefined) {
  return useQuery({
    queryKey: trustedSenderKeys.list(accountId || ''),
    queryFn: () => trustedSenders.list(accountId!),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Check if a sender is trusted (for auto-loading images)
 */
export function useIsSenderTrusted(accountId: string | undefined, senderEmail: string | undefined) {
  return useQuery({
    queryKey: trustedSenderKeys.check(accountId || '', senderEmail || ''),
    queryFn: () => trustedSenders.check(accountId!, senderEmail!),
    enabled: !!accountId && !!senderEmail,
    staleTime: 5 * 60 * 1000, // 5 minutes - trust status doesn't change often
  });
}

/**
 * Add a trusted sender
 */
export function useAddTrustedSender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { account_id: string; email_or_domain: string; is_domain?: boolean }) =>
      trustedSenders.add(data),
    onSuccess: (_, variables) => {
      // Invalidate the list and any check queries for this account
      queryClient.invalidateQueries({ queryKey: trustedSenderKeys.list(variables.account_id) });
      // Also invalidate any check queries that might now be trusted
      queryClient.invalidateQueries({
        queryKey: [...trustedSenderKeys.all, 'check', variables.account_id],
      });
    },
  });
}

/**
 * Remove a trusted sender
 */
export function useRemoveTrustedSender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => trustedSenders.remove(id),
    onSuccess: () => {
      // Invalidate all trusted sender queries
      queryClient.invalidateQueries({ queryKey: trustedSenderKeys.all });
    },
  });
}
