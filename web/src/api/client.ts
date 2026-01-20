/**
 * API client for axios-ai-mail backend
 */

import axios from 'axios';
import type {
  MessagesListResponse,
  Message,
  Account,
  AccountStats,
  TagsListResponse,
  Stats,
  SyncStatus,
  UpdateTagsRequest,
  MarkReadRequest,
  TriggerSyncRequest,
  SmartReplyResponse,
} from './types';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    indexes: null, // Serialize arrays as ?tags=work&tags=finance (FastAPI compatible)
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Message endpoints
export const messages = {
  list: (params?: {
    account_id?: string;
    tag?: string;
    tags?: string[];
    is_unread?: boolean;
    folder?: string;
    thread_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => api.get<MessagesListResponse>('/messages', { params }).then((r) => r.data),

  get: (id: string) => api.get<Message>(`/messages/${id}`).then((r) => r.data),

  getBody: (id: string) =>
    api
      .get<{
        id: string;
        body_text: string | null;
        body_html: string | null;
        inline_attachments?: Array<{ content_id: string; data_url: string }>;
      }>(`/messages/${id}/body`)
      .then((r) => r.data),

  updateTags: (id: string, data: UpdateTagsRequest) =>
    api.put<Message>(`/messages/${id}/tags`, data).then((r) => r.data),

  markRead: (id: string, data: MarkReadRequest) =>
    api.post<Message>(`/messages/${id}/read`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ status: string; message_id: string }>(`/messages/${id}`).then((r) => r.data),

  // Bulk operations
  bulkMarkRead: (data: { message_ids: string[]; is_unread: boolean }) =>
    api.post<{ updated: number; total: number; errors: any[] }>('/messages/bulk/read', data).then((r) => r.data),

  bulkDelete: (data: { message_ids: string[] }) =>
    api.post<{ moved_to_trash: number; total: number; errors: any[] }>('/messages/bulk/delete', data).then((r) => r.data),

  bulkRestore: (data: { message_ids: string[] }) =>
    api.post<{ restored: number; total: number; errors: any[] }>('/messages/bulk/restore', data).then((r) => r.data),

  bulkPermanentDelete: (data: { message_ids: string[] }) =>
    api.post<{ deleted: number; total: number; errors: any[] }>('/messages/bulk/permanent-delete', data).then((r) => r.data),

  // Restore a single message from trash
  restore: (id: string) =>
    api.post<Message>(`/messages/${id}/restore`).then((r) => r.data),

  // Delete all messages matching filters (moves to trash)
  deleteAll: (params?: {
    account_id?: string;
    tags?: string[];
    is_unread?: boolean;
    folder?: string;
    search?: string;
  }) =>
    api.post<{ moved_to_trash: number; total: number; errors: any[] }>('/messages/delete-all', null, { params }).then((r) => r.data),

  // Clear trash (permanently delete all messages in trash)
  clearTrash: () =>
    api.post<{ deleted: number; total: number; errors: any[] }>('/messages/clear-trash').then((r) => r.data),

  // Smart replies (AI-generated reply suggestions)
  getSmartReplies: (id: string) =>
    api.get<SmartReplyResponse>(`/messages/${id}/smart-replies`).then((r) => r.data),
};

// Account endpoints
export const accounts = {
  list: () => api.get<Account[]>('/accounts').then((r) => r.data),

  getStats: (id: string) =>
    api.get<AccountStats>(`/accounts/${id}/stats`).then((r) => r.data),
};

// Tag endpoints
export const tags = {
  list: () => api.get<TagsListResponse>('/tags').then((r) => r.data),
};

// Stats endpoint
export const stats = {
  get: () => api.get<Stats>('/stats').then((r) => r.data),
};

// Sync endpoints
export const sync = {
  status: () => api.get<SyncStatus>('/sync/status').then((r) => r.data),

  trigger: (data: TriggerSyncRequest = {}) =>
    api.post<SyncStatus>('/sync', data).then((r) => r.data),
};

// Health check
export const health = {
  check: () => api.get('/health').then((r) => r.data),
};

export default api;
