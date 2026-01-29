# Proposal: PWA Background Sync

> **Note**: This proposal is independent of `enhance-pwa` (which covers push
> notifications and forced cache updates). Background sync handles offline
> operation queuing and is a separate concern.

## What
Queue operations performed while offline and automatically sync when connectivity returns, enabling true offline-first mobile experience.

## Why
Currently, operations fail silently when offline. Background sync enables:
- Reliable offline operation (mark read, delete, etc.)
- Automatic retry when connectivity returns
- Confidence that actions won't be lost

## How

### Offline Queue (IndexedDB)
1. Create IndexedDB store for pending operations
2. Intercept failed API calls and queue them
3. Store operation type, payload, timestamp

### Service Worker Sync
1. Register for `sync` event when operations are queued
2. Handle `sync` event to process queued operations
3. Retry failed operations with exponential backoff
4. Clear queue on success

### UI Feedback
1. Show "Offline - changes will sync" indicator
2. Show "Syncing..." when background sync runs
3. Notify user of sync completion/failure

## Scope
- IndexedDB queue for pending operations
- Service worker sync event handling
- Retry logic with backoff
- Basic UI feedback

## Out of Scope
- Offline message viewing (would require caching message content)
- Conflict resolution for concurrent edits
- Selective sync (all-or-nothing for now)
