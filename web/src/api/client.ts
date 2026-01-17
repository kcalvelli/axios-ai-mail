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
} from './types';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
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
    is_unread?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) => api.get<MessagesListResponse>('/messages', { params }).then((r) => r.data),

  get: (id: string) => api.get<Message>(`/messages/${id}`).then((r) => r.data),

  getBody: (id: string) =>
    api
      .get<{ id: string; body_text: string | null; body_html: string | null }>(
        `/messages/${id}/body`
      )
      .then((r) => r.data),

  updateTags: (id: string, data: UpdateTagsRequest) =>
    api.put<Message>(`/messages/${id}/tags`, data).then((r) => r.data),

  markRead: (id: string, data: MarkReadRequest) =>
    api.post<Message>(`/messages/${id}/read`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ status: string; message_id: string }>(`/messages/${id}`).then((r) => r.data),
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
