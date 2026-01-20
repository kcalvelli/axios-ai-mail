# Tasks: Phase 5 - Folders and Bulk Operations

> **STATUS: COMPLETE (IMAP IDLE deferred)**
>
> All core features implemented: bulk selection, bulk operations (delete, mark read),
> multi-folder support, WebSocket notifications. IMAP IDLE deferred.

## 1. Database Schema Updates
- [x] 1.1 Folder column on messages
- [x] 1.2 Migration applied
- [x] 1.3 Index on (account_id, folder)
- [x] 1.4 Account folders in settings
- [x] 1.5 Existing messages updated

## 2. Backend - Bulk Operations API
- [x] 2.1 POST /api/messages/bulk/read
- [x] 2.2 POST /api/messages/bulk/delete
- [x] 2.3 POST /api/messages/bulk/restore
- [x] 2.4 All bulk ops queue for provider sync
- [x] 2.5 Async queue deduplication

## 3. Backend - Multi-folder Support
- [x] 3.1 GET /api/messages with folder param
- [x] 3.2 GET /api/folders endpoint
- [x] 3.3 Folder stats (counts)
- [x] 3.4 Database folder filtering
- [x] 3.5 Folder stored on sync

## 4. IMAP Provider - Multi-folder Sync
- [x] 4.1 Folder param in fetch_messages()
- [x] 4.2 Folder listing
- [x] 4.3 Logical folder mapping
- [x] 4.4 Sync all configured folders
- [x] 4.5 Folder stored per message

## 5. Gmail Provider - Multi-folder Support
- [x] 5.1 Label to folder mapping
- [x] 5.2 list_folders() returns standard folders
- [x] 5.3 fetch_messages() filters by label

## 6. IMAP IDLE Implementation
- [ ] 6.1-6.8 DEFERRED - Using polling instead
> **Note**: Polling via systemd timer (5min) is sufficient. IDLE adds complexity.

## 7. Backend - WebSocket Notifications
- [x] 7.1 WebSocket endpoint
- [x] 7.2 Broadcast on sync events
- [x] 7.3 message_created, message_updated, sync_complete events
- [x] 7.4 React Query invalidation on events

## 8. Frontend - Bulk Selection UI
- [x] 8.1 Checkbox on each message card
- [x] 8.2 Selection mode toggle
- [x] 8.3 Select all functionality
- [x] 8.4 Bulk action bar (delete, mark read)
- [x] 8.5 Clear selection after action

## 9. Frontend - Folder Navigation
- [x] 9.1 Folder list in sidebar (Inbox, Sent, Drafts, Trash)
- [x] 9.2 Active folder highlight
- [x] 9.3 Unread badge on Inbox
- [x] 9.4 Draft count badge

## 10. Frontend - Delete/Restore
- [x] 10.1 Delete moves to Trash
- [x] 10.2 Restore from Trash
- [x] 10.3 Clear Trash button
- [x] 10.4 Undo toast on delete

## 11. Mobile Touch Gestures
- [x] 11.1 Swipe left to delete
- [x] 11.2 Swipe right to toggle read/unread
- [x] 11.3 Visual feedback during swipe
- [x] 11.4 Haptic feedback on action
