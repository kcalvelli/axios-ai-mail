# Implementation Tasks

## 1. Database Schema

### 1.1 PendingOperation Model
- [ ] 1.1.1 Create PendingOperation SQLAlchemy model
- [ ] 1.1.2 Add foreign keys to accounts and messages
- [ ] 1.1.3 Add status enum (pending, completed, failed)
- [ ] 1.1.4 Add retry tracking fields (attempts, last_attempt, last_error)

### 1.2 Database Methods
- [ ] 1.2.1 `queue_pending_operation(account_id, message_id, operation)`
- [ ] 1.2.2 `get_pending_operations(account_id, limit, status="pending")`
- [ ] 1.2.3 `complete_pending_operation(operation_id)`
- [ ] 1.2.4 `fail_pending_operation(operation_id, error_message)`
- [ ] 1.2.5 `get_failed_operations(account_id)` for visibility

### 1.3 Migration
- [ ] 1.3.1 Create Alembic migration for pending_operations table

## 2. API Changes

### 2.1 Mark Read/Unread
- [ ] 2.1.1 Remove synchronous provider.mark_as_read/unread calls
- [ ] 2.1.2 Queue operation after local DB update
- [ ] 2.1.3 Update both single and bulk endpoints

### 2.2 Move to Trash
- [ ] 2.2.1 Remove synchronous provider.move_to_trash calls
- [ ] 2.2.2 Queue operation after local DB update
- [ ] 2.2.3 Update both single and bulk endpoints

### 2.3 Permanent Delete
- [ ] 2.3.1 Remove synchronous provider.delete_message calls
- [ ] 2.3.2 Queue operation after local DB update
- [ ] 2.3.3 Update both single and bulk endpoints

## 3. Sync Engine

### 3.1 Process Queue
- [ ] 3.1.1 Add `process_pending_operations()` method
- [ ] 3.1.2 Call during sync after message fetch
- [ ] 3.1.3 Handle each operation type (mark_read, mark_unread, trash, delete)

### 3.2 Retry Logic
- [ ] 3.2.1 Implement max attempts check (default: 3)
- [ ] 3.2.2 Update attempt count on failure
- [ ] 3.2.3 Mark as "failed" after max attempts
- [ ] 3.2.4 Log failed operations for debugging

### 3.3 Deduplication
- [ ] 3.3.1 Coalesce multiple read/unread toggles for same message
- [ ] 3.3.2 Cancel pending trash if message is restored
- [ ] 3.3.3 Skip completed operations

## 4. Observability

### 4.1 Logging
- [ ] 4.1.1 Log queued operations
- [ ] 4.1.2 Log successful syncs
- [ ] 4.1.3 Log failures with error details

### 4.2 API Endpoints (Optional)
- [ ] 4.2.1 GET /api/sync/pending - List pending operations
- [ ] 4.2.2 GET /api/sync/failed - List failed operations
- [ ] 4.2.3 POST /api/sync/retry/{id} - Retry failed operation

## 5. Testing

- [ ] 5.1 Unit tests for database queue methods
- [ ] 5.2 Unit tests for sync engine queue processing
- [ ] 5.3 Integration test: mark read -> sync -> verify provider
- [ ] 5.4 Integration test: provider failure -> retry -> success
- [ ] 5.5 Integration test: max retries -> marked failed

## Priority Order

1. **Database Schema** (Foundation)
2. **Sync Engine Queue Processing** (Core logic)
3. **API Changes** (Wire it up)
4. **Retry Logic** (Resilience)
5. **Observability** (Nice to have)
