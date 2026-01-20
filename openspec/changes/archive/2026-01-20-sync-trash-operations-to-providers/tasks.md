# Implementation Tasks

> **STATUS: COMPLETE (Superseded by async-provider-sync)**
>
> This proposal's goals were achieved via the async-provider-sync implementation,
> which queues all provider operations (mark_read, mark_unread, trash, restore, delete)
> and processes them asynchronously during sync cycles.

## Provider Operations (via PendingOperation Queue)

- [x] 1.1 `trash` operation - Moves message to provider's Trash folder
- [x] 1.2 `restore` operation - Moves message from Trash back to Inbox
- [x] 1.3 `delete` operation - Permanently deletes from provider
- [x] 1.4 `mark_read` operation - Syncs read state to provider
- [x] 1.5 `mark_unread` operation - Syncs unread state to provider

## Gmail Provider Implementation

- [x] 2.1 `mark_read()` via `users.messages.modify` (remove UNREAD label)
- [x] 2.2 `mark_unread()` via `users.messages.modify` (add UNREAD label)
- [x] 2.3 `trash()` via `users.messages.trash()` API
- [x] 2.4 `restore()` via `users.messages.untrash()` API
- [x] 2.5 `delete()` via `users.messages.delete()` API

## IMAP Provider Implementation

- [x] 3.1 `mark_read()` via `STORE +FLAGS (\Seen)`
- [x] 3.2 `mark_unread()` via `STORE -FLAGS (\Seen)`
- [x] 3.3 `trash()` via `COPY` to Trash + `STORE +FLAGS (\Deleted)` + `EXPUNGE`
- [x] 3.4 `restore()` via `COPY` to INBOX + `STORE +FLAGS (\Deleted)` + `EXPUNGE`
- [x] 3.5 `delete()` via `STORE +FLAGS (\Deleted)` + `EXPUNGE`

## API Integration (Async Queue)

- [x] 4.1 All message write endpoints queue operations instead of blocking
- [x] 4.2 Local DB updates happen immediately (instant UI feedback)
- [x] 4.3 Operations processed at start of each sync cycle
- [x] 4.4 Smart deduplication (opposite operations cancel out)
- [x] 4.5 Retry logic with attempt tracking and error logging

## Implementation Details

The async-provider-sync implementation uses a `PendingOperation` model to queue operations:

```python
class PendingOperation(Base):
    id: str                 # UUID
    account_id: str         # FK to accounts
    message_id: str         # FK to messages
    operation: str          # mark_read, mark_unread, trash, restore, delete
    status: str             # pending, completed, failed
    attempts: int           # Retry count
    last_error: str | None  # Error message if failed
    created_at: datetime    # Ordering
```

This is superior to the original synchronous proposal because:
1. **No UI blocking** - Local updates are instant
2. **Reliable** - Operations queued even if provider is unavailable
3. **Efficient** - Opposite operations cancel out (mark_read + mark_unread = noop)
4. **Fault tolerant** - Failed operations logged but don't break UI
