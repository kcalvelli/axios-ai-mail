# Implementation Tasks

## Phase 1: Connection Pooling & Caching

### 1.1 IMAP Connection Pool
- [ ] 1.1.1 Create `IMAPConnectionPool` class with connection storage
- [ ] 1.1.2 Implement `get_connection()` with health check
- [ ] 1.1.3 Implement `release_connection()` to return to pool
- [ ] 1.1.4 Add connection idle timeout and cleanup
- [ ] 1.1.5 Add auto-reconnect on connection failure
- [ ] 1.1.6 Add per-account connection locking

### 1.2 Integrate Connection Pool
- [ ] 1.2.1 Refactor `IMAPProvider` to use connection pool
- [ ] 1.2.2 Update `sync_engine.py` to pass pool to providers
- [ ] 1.2.3 Initialize pool at app startup, close at shutdown
- [ ] 1.2.4 Add connection pool metrics/logging

### 1.3 Folder Mapping Cache
- [ ] 1.3.1 Cache folder discovery results per account
- [ ] 1.3.2 Add cache TTL (e.g., 5 minutes)
- [ ] 1.3.3 Invalidate cache on connection reset
- [ ] 1.3.4 Skip folder discovery if cache valid

### 1.4 Gmail Credential Fix
- [ ] 1.4.1 Investigate 401 refresh on every request
- [ ] 1.4.2 Fix credential caching/expiry handling
- [ ] 1.4.3 Pre-emptively refresh before expiry

## Phase 2: Parallel Account Syncing

### 2.1 Async Sync Engine
- [ ] 2.1.1 Convert `sync_account()` to async
- [ ] 2.1.2 Implement `sync_all_accounts()` with asyncio.gather
- [ ] 2.1.3 Add per-account error isolation
- [ ] 2.1.4 Aggregate results for WebSocket broadcast

### 2.2 Concurrency Control
- [ ] 2.2.1 Add configurable concurrency limit
- [ ] 2.2.2 Implement semaphore for connection limiting
- [ ] 2.2.3 Add backpressure handling

### 2.3 Testing & Validation
- [ ] 2.3.1 Test parallel sync with multiple accounts
- [ ] 2.3.2 Verify no race conditions in database writes
- [ ] 2.3.3 Benchmark sync time improvements

## Phase 3: IMAP IDLE (Push Notifications)

### 3.1 IDLE Implementation
- [ ] 3.1.1 Create `IMAPIdleWatcher` class
- [ ] 3.1.2 Implement IDLE command handling
- [ ] 3.1.3 Handle IDLE timeout (re-issue every 25 min)
- [ ] 3.1.4 Parse IDLE responses (EXISTS, EXPUNGE, etc.)

### 3.2 IDLE Integration
- [ ] 3.2.1 Detect IDLE capability from server
- [ ] 3.2.2 Start IDLE watcher per IMAP account at startup
- [ ] 3.2.3 Trigger immediate sync on IDLE notification
- [ ] 3.2.4 Fallback to polling if IDLE fails

### 3.3 Connection Management
- [ ] 3.3.1 Dedicated connection for IDLE (can't share)
- [ ] 3.3.2 Handle IDLE connection drops gracefully
- [ ] 3.3.3 Reconnect and resume IDLE on failure

### 3.4 Multi-Folder Watching
- [ ] 3.4.1 Watch INBOX by default
- [ ] 3.4.2 Option to watch additional folders
- [ ] 3.4.3 Balance connections vs coverage

### 3.5 Testing & Validation
- [ ] 3.5.1 Test IDLE with MXRoute server
- [ ] 3.5.2 Test IDLE timeout handling
- [ ] 3.5.3 Test connection recovery
- [ ] 3.5.4 Measure notification latency

---

## Summary

**Total Tasks:** 35

- Phase 1 (Connection Pooling): 14 tasks
- Phase 2 (Parallel Sync): 9 tasks
- Phase 3 (IMAP IDLE): 12 tasks

**Completed:** 0/35 (0%)

## Priority Order

1. **Phase 1.1-1.2** - Connection pooling (biggest immediate win)
2. **Phase 1.4** - Gmail credential fix (quick fix)
3. **Phase 2** - Parallel sync (multiplies Phase 1 benefits)
4. **Phase 1.3** - Folder caching (minor optimization)
5. **Phase 3** - IMAP IDLE (biggest long-term win, most complex)
