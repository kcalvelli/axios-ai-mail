# Tasks: Phase 5 - Folders and Bulk Operations

## 1. Database Schema Updates
- [ ] 1.1 Add `folder` column to messages table (VARCHAR, default 'INBOX')
- [ ] 1.2 Create Alembic migration for folder field
- [ ] 1.3 Add index on (account_id, folder) for efficient folder queries
- [ ] 1.4 Add `folders` field to Account.settings JSON (list of folder names)
- [ ] 1.5 Update existing messages to have folder='INBOX'

## 2. Backend - Bulk Operations API (Test Existing)
- [ ] 2.1 Test POST /api/messages/bulk/read endpoint (already implemented)
- [ ] 2.2 Test POST /api/messages/bulk/delete endpoint (already implemented)
- [ ] 2.3 Add POST /api/messages/bulk/tags endpoint for bulk tag updates
- [ ] 2.4 Add POST /api/messages/delete-all endpoint with filter params
- [ ] 2.5 Ensure all bulk ops sync to email providers (IMAP/Gmail)
- [ ] 2.6 Add transaction support for atomic bulk operations
- [ ] 2.7 Return detailed error info per message (which succeeded/failed)

## 3. Backend - Multi-folder Support
- [ ] 3.1 Update GET /api/messages to accept folder parameter
- [ ] 3.2 Add GET /api/folders endpoint to list folders per account
- [ ] 3.3 Add GET /api/folders/{folder}/stats endpoint (message count, unread)
- [ ] 3.4 Update Database.query_messages() to support folder filtering
- [ ] 3.5 Update sync logic to detect and store folder for each message

## 4. IMAP Provider - Multi-folder Sync
- [ ] 4.1 Add folder parameter to fetch_messages() method
- [ ] 4.2 Implement list_folders() method using IMAP LIST command
- [ ] 4.3 Map logical folder names (Inbox, Sent, etc.) to IMAP folder names
- [ ] 4.4 Update sync to iterate over configured folders
- [ ] 4.5 Store folder name with each message in database
- [ ] 4.6 Handle folder-specific IMAP flags (e.g., \Sent, \Drafts)

## 5. Gmail Provider - Multi-folder Support
- [ ] 5.1 Map Gmail labels to logical folder names
- [ ] 5.2 Implement list_folders() for Gmail (return standard folders)
- [ ] 5.3 Update fetch_messages() to filter by label/folder
- [ ] 5.4 Store folder mapping in account settings

## 6. IMAP IDLE Implementation
- [ ] 6.1 Create IMAPIdleManager class with threading support
- [ ] 6.2 Check IMAP server CAPABILITY for IDLE support
- [ ] 6.3 Implement IDLE connection with 29-minute refresh (RFC 2177)
- [ ] 6.4 Detect new mail via EXISTS/RECENT responses
- [ ] 6.5 Trigger incremental sync when new mail detected
- [ ] 6.6 Handle connection failures with exponential backoff
- [ ] 6.7 Fall back to polling if IDLE not supported
- [ ] 6.8 Add graceful shutdown on SIGTERM/SIGINT

## 7. Backend - WebSocket Notifications
- [ ] 7.1 Add WebSocket endpoint for real-time updates
- [ ] 7.2 Broadcast "new_mail" event when IDLE detects new messages
- [ ] 7.3 Include account_id and folder in notification payload
- [ ] 7.4 Handle client reconnection with missed event replay

## 8. Web UI - Bulk Selection Interface
- [ ] 8.1 Add checkbox column to MessageList (left-most)
- [ ] 8.2 Add "Select All" checkbox in list header
- [ ] 8.3 Implement selection state management (Zustand store)
- [ ] 8.4 Visual feedback for selected rows (highlight, checkmark icon)
- [ ] 8.5 Persist selection across pagination (optional)
- [ ] 8.6 Add "Clear Selection" button

## 9. Web UI - Bulk Action Bar
- [ ] 9.1 Create BulkActionBar component (floating toolbar)
- [ ] 9.2 Show selected count: "X messages selected"
- [ ] 9.3 Add Delete button with trash icon
- [ ] 9.4 Add "Mark as Read" / "Mark as Unread" buttons
- [ ] 9.5 Add "Add Tag" / "Remove Tag" actions
- [ ] 9.6 Position bar at bottom of screen (floating above content)
- [ ] 9.7 Animate bar entrance/exit when selection changes
- [ ] 9.8 Disable actions while operation in progress (loading state)

## 10. Web UI - Delete All Functionality
- [ ] 10.1 Add "Delete All" button to toolbar (near search/filter)
- [ ] 10.2 Show button only when filter/search is active OR in specific folder
- [ ] 10.3 Confirmation dialog: "Delete X messages in [context]?"
- [ ] 10.4 Display current filter criteria in confirmation
- [ ] 10.5 Option to "Move to Trash" vs "Permanently Delete"
- [ ] 10.6 Execute bulk delete with progress indicator
- [ ] 10.7 Toast notification on completion

## 11. Web UI - Folder Navigation
- [ ] 11.1 Add "Folders" section to sidebar
- [ ] 11.2 Fetch and display folders from API
- [ ] 11.3 Show message count per folder (badge)
- [ ] 11.4 Highlight currently selected folder
- [ ] 11.5 Update MessageList to filter by selected folder
- [ ] 11.6 Persist selected folder in URL (?folder=sent)
- [ ] 11.7 Add folder icons (Inbox, Sent, Drafts, Archive, Trash)

## 12. Web UI - React Hooks for Bulk Operations
- [ ] 12.1 Create useBulkMarkRead() hook
- [ ] 12.2 Create useBulkDelete() hook
- [ ] 12.3 Create useBulkUpdateTags() hook
- [ ] 12.4 Create useDeleteAll() hook
- [ ] 12.5 Implement optimistic updates for all bulk operations
- [ ] 12.6 Handle partial success (some messages failed)
- [ ] 12.7 Invalidate React Query cache after bulk operations

## 13. Web UI - Real-time Updates (WebSocket)
- [ ] 13.1 Add WebSocket client connection
- [ ] 13.2 Subscribe to "new_mail" events
- [ ] 13.3 Update message list when new mail arrives
- [ ] 13.4 Show toast notification: "3 new messages"
- [ ] 13.5 Handle reconnection after connection loss
- [ ] 13.6 Debounce rapid updates (batch within 1 second)

## 14. API Client Updates
- [ ] 14.1 Add bulk operations to web/src/api/client.ts
- [ ] 14.2 Add folder endpoints (list, stats)
- [ ] 14.3 Add folder parameter to messages.list()
- [ ] 14.4 Add deleteAll() method with filter params
- [ ] 14.5 Add TypeScript types for bulk operation requests/responses

## 15. Nix Configuration
- [ ] 15.1 Add `folders` option to account submodule (default: ["INBOX", "Sent"])
- [ ] 15.2 Add `idleEnabled` option (default: true)
- [ ] 15.3 Update systemd service for long-running IDLE process
- [ ] 15.4 Add service restart on failure
- [ ] 15.5 Generate config.yaml with folder settings

## 16. Testing & Validation
- [ ] 16.1 Unit tests for IMAPIdleManager
- [ ] 16.2 Unit tests for bulk operation endpoints
- [ ] 16.3 Unit tests for folder mapping
- [ ] 16.4 Integration test: Select 10 messages, bulk delete
- [ ] 16.5 Integration test: Delete all in current filter
- [ ] 16.6 Integration test: Multi-folder sync
- [ ] 16.7 E2E test: IDLE detects new mail, UI updates
- [ ] 16.8 Manual test: Verify bulk ops sync to IMAP/Gmail
- [ ] 16.9 Manual test: Folder navigation and message counts

## 17. Documentation
- [ ] 17.1 Update QUICKSTART_WEB.md with bulk operations
- [ ] 17.2 Document folder configuration in README
- [ ] 17.3 Add troubleshooting section for IDLE issues
- [ ] 17.4 Update API documentation (OpenAPI/Swagger)
