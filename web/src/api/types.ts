/**
 * TypeScript types matching the FastAPI Pydantic models
 */

export interface Message {
  id: string;
  account_id: string;
  thread_id?: string | null;
  subject: string;
  from_email: string;
  to_emails: string[];
  date: string; // ISO datetime string
  snippet: string;
  is_unread: boolean;
  provider_labels: string[];
  tags: string[];
  priority?: string | null;
  todo: boolean;
  can_archive: boolean;
  classified_at?: string | null; // ISO datetime string
  has_attachments: boolean;
  confidence?: number | null; // Classification confidence 0.0-1.0
}

export interface MessagesListResponse {
  messages: Message[];
  total: number;
  limit: number;
  offset: number;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  provider: string;
  last_sync?: string | null; // ISO datetime string
}

export interface AccountStats {
  account_id: string;
  total_messages: number;
  unread_messages: number;
  classified_messages: number;
  classification_rate: number;
  last_sync?: string | null;
}

export interface Tag {
  name: string;
  count: number;
  percentage: number;
  type: 'ai' | 'account';
}

export interface TagsListResponse {
  tags: Tag[];
  total_classified: number;
}

export interface Stats {
  total_messages: number;
  classified_messages: number;
  unread_messages: number;
  classification_rate: number;
  accounts_count: number;
  top_tags: Tag[];
}

export interface SyncStatus {
  is_syncing: boolean;
  current_account?: string | null;
  last_sync?: string | null;
  message: string;
}

export interface SyncResult {
  account_id: string;
  fetched: number;
  classified: number;
  labeled: number;
  errors: number;
  duration: number;
}

// Request types
export interface UpdateTagsRequest {
  tags: string[];
}

export interface MarkReadRequest {
  is_unread: boolean;
}

export interface TriggerSyncRequest {
  account_id?: string | null;
  max_messages?: number;
}

// WebSocket message types
export type WebSocketMessageType =
  | 'connected'
  | 'subscribed'
  | 'sync_started'
  | 'sync_completed'
  | 'message_classified'
  | 'error'
  | 'pong';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data?: any;
  timestamp?: string;
  account_id?: string;
  message_id?: string;
  tags?: string[];
  stats?: {
    fetched: number;
    classified: number;
    labeled: number;
    errors: number;
  };
  message?: string;
  details?: string;
}
