# Implementation Tasks

## 1. Database Schema

### 1.1 PendingOperation Model
- [x] 1.1.1 Create PendingOperation SQLAlchemy model
- [x] 1.1.2 Add foreign keys to accounts and messages
- [x] 1.1.3 Add status enum (pending, completed, failed)
- [x] 1.1.4 Add retry tracking fields (attempts, last_attempt, last_error)

### 1.2 Database Methods
- [x] 1.2.1 `queue_pending_operation(account_id, message_id, operation)`
- [x] 1.2.2 `get_pending_operations(account_id, limit, status="pending")`
- [x] 1.2.3 `complete_pending_operation(operation_id)`
- [x] 1.2.4 `fail_pending_operation(operation_id, error_message)`
- [x] 1.2.5 `get_failed_operations(account_id)` for visibility
- [x] 1.2.6 `delete_pending_operation(operation_id)` for cleanup
- [x] 1.2.7 `cleanup_completed_operations(older_than_hours)` for maintenance

### 1.3 Migration
- [x] 1.3.1 SQLAlchemy auto-creates table via Base.metadata.create_all()

## 2. API Changes

### 2.1 Mark Read/Unread
- [x] 2.1.1 Remove synchronous provider.mark_as_read/unread calls
- [x] 2.1.2 Queue operation after local DB update
- [x] 2.1.3 Update both single and bulk endpoints

### 2.2 Move to Trash
- [x] 2.2.1 Remove synchronous provider.move_to_trash calls
- [x] 2.2.2 Queue operation after local DB update
- [x] 2.2.3 Update both single and bulk endpoints

### 2.3 Restore from Trash
- [x] 2.3.1 Remove synchronous provider.restore_from_trash calls
- [x] 2.3.2 Queue operation after local DB update
- [x] 2.3.3 Update both single and bulk endpoints

### 2.4 Permanent Delete
- [N/A] Keep synchronous - user needs immediate feedback for destructive operations

## 3. Sync Engine

### 3.1 Process Queue
- [x] 3.1.1 Add `_process_pending_operations()` method
- [x] 3.1.2 Call at START of sync (user actions take priority)
- [x] 3.1.3 Handle each operation type (mark_read, mark_unread, trash, restore, delete)

### 3.2 Retry Logic
- [x] 3.2.1 Implement max attempts check (default: 3)
- [x] 3.2.2 Update attempt count on failure
- [x] 3.2.3 Mark as "failed" after max attempts
- [x] 3.2.4 Log failed operations for debugging

### 3.3 Deduplication
- [x] 3.3.1 Coalesce multiple read/unread toggles for same message (cancel pairs)
- [x] 3.3.2 Cancel pending trash if message is restored (and vice versa)
- [x] 3.3.3 Skip duplicate operations for same message

### 3.4 Cleanup
- [x] 3.4.1 Clean up completed operations older than 24 hours during sync

## 4. Observability

### 4.1 Logging
- [x] 4.1.1 Log queued operations
- [x] 4.1.2 Log successful syncs
- [x] 4.1.3 Log failures with error details

### 4.2 SyncResult Updates
- [x] 4.2.1 Add pending_ops_processed count
- [x] 4.2.2 Add pending_ops_failed count
- [x] 4.2.3 Include in string representation

### 4.3 API Endpoints (Optional - Future)
- [ ] 4.3.1 GET /api/sync/pending - List pending operations
- [ ] 4.3.2 GET /api/sync/failed - List failed operations
- [ ] 4.3.3 POST /api/sync/retry/{id} - Retry failed operation

## 5. Testing

- [ ] 5.1 Unit tests for database queue methods
- [ ] 5.2 Unit tests for sync engine queue processing
- [ ] 5.3 Integration test: mark read -> sync -> verify provider
- [ ] 5.4 Integration test: provider failure -> retry -> success
- [ ] 5.5 Integration test: max retries -> marked failed

## Priority Order

1. ✅ **Database Schema** (Foundation)
2. ✅ **Sync Engine Queue Processing** (Core logic)
3. ✅ **API Changes** (Wire it up)
4. ✅ **Retry Logic** (Resilience)
5. ✅ **Observability** (Logging, SyncResult updates)
6. ⏳ **Testing** (Manual testing first, then unit tests)
