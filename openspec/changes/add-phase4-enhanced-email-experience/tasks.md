# Tasks: Phase 4 - Enhanced Email Experience

## 1. Database Schema Updates
- [ ] 1.1 Add `folder` column to messages table (VARCHAR, default 'inbox')
- [ ] 1.2 Add `body_text` column to messages table (TEXT, nullable)
- [ ] 1.3 Add `body_html` column to messages table (TEXT, nullable)
- [ ] 1.4 Create FTS5 virtual table for full-text search
- [ ] 1.5 Create Alembic migration for schema changes
- [ ] 1.6 Add `folders` field to Account settings JSON

## 2. IMAP Provider - Multi-folder Support
- [ ] 2.1 Add folder parameter to `fetch_messages()` method
- [ ] 2.2 Implement folder listing via `LIST` command
- [ ] 2.3 Map logical folder names to server folder names
- [ ] 2.4 Fetch messages from configurable folders during sync
- [ ] 2.5 Store folder name with each message

## 3. IMAP Provider - Body Fetching
- [ ] 3.1 Implement `fetch_body(message_id)` method
- [ ] 3.2 Parse MIME multipart messages for text/plain and text/html
- [ ] 3.3 Handle character encoding (UTF-8, ISO-8859-1, etc.)
- [ ] 3.4 Fetch bodies during initial sync (configurable)
- [ ] 3.5 Lazy-fetch bodies on demand for existing messages

## 4. IMAP Provider - Read Status Sync
- [ ] 4.1 Implement `mark_as_read(message_id)` method
- [ ] 4.2 Implement `mark_as_unread(message_id)` method
- [ ] 4.3 Use IMAP STORE command with \Seen flag
- [ ] 4.4 Update local database on successful server sync

## 5. IMAP Provider - Email Deletion
- [ ] 5.1 Implement `delete_message(message_id)` method
- [ ] 5.2 Support move-to-trash vs permanent delete
- [ ] 5.3 Use IMAP STORE +FLAGS (\Deleted) and EXPUNGE
- [ ] 5.4 Remove from local database on successful delete

## 6. IMAP IDLE Support
- [ ] 6.1 Create IMAPIdleManager class with background thread
- [ ] 6.2 Implement IDLE connection with auto-reconnect
- [ ] 6.3 Detect new mail and trigger incremental sync
- [ ] 6.4 Check IDLE capability, fall back to polling if unsupported
- [ ] 6.5 Integrate with systemd service (keep-alive)
- [ ] 6.6 Add WebSocket notification on new mail

## 7. Gmail Provider Updates
- [ ] 7.1 Add folder (label) support to Gmail provider
- [ ] 7.2 Map Gmail labels to logical folder names
- [ ] 7.3 Fetch email body via Gmail API
- [ ] 7.4 Implement mark_as_read/unread via label modification
- [ ] 7.5 Implement delete (move to TRASH label)
- [ ] 7.6 Add Gmail push notifications (Pub/Sub) - optional

## 8. API Endpoints
- [ ] 8.1 GET /api/messages/{id}/body - Fetch full message body
- [ ] 8.2 POST /api/messages/{id}/read - Mark message as read
- [ ] 8.3 POST /api/messages/{id}/unread - Mark message as unread
- [ ] 8.4 DELETE /api/messages/{id} - Delete message
- [ ] 8.5 POST /api/messages/bulk/read - Bulk mark as read
- [ ] 8.6 POST /api/messages/bulk/delete - Bulk delete
- [ ] 8.7 GET /api/messages/search?q=... - Full-text search
- [ ] 8.8 GET /api/folders - List folders per account

## 9. Web UI - Search & Filtering
- [ ] 9.1 Add search bar to InboxPage header
- [ ] 9.2 Implement search API hook (useSearch)
- [ ] 9.3 Add filter chips: account, tags, date range, read/unread
- [ ] 9.4 Combine search and filters in query
- [ ] 9.5 Highlight search matches in results
- [ ] 9.6 Add "clear filters" button

## 10. Web UI - Folder Navigation
- [ ] 10.1 Add folder list to sidebar
- [ ] 10.2 Show message counts per folder
- [ ] 10.3 Navigate between folders
- [ ] 10.4 Persist selected folder in URL/state

## 11. Web UI - Message Detail View
- [ ] 11.1 Create MessageDetail component/page
- [ ] 11.2 Fetch and display full body on message click
- [ ] 11.3 Render HTML email safely (DOMPurify)
- [ ] 11.4 Fall back to plain text if no HTML
- [ ] 11.5 Show loading state while fetching body
- [ ] 11.6 Display attachment list (metadata only)

## 12. Web UI - Read Status
- [ ] 12.1 Mark message as read when opened (auto)
- [ ] 12.2 Add "mark as read/unread" action button
- [ ] 12.3 Visual indicator for unread messages (bold, dot)
- [ ] 12.4 Optimistic UI update with error rollback

## 13. Web UI - Deletion
- [ ] 13.1 Add delete button to message actions
- [ ] 13.2 Add bulk selection checkboxes
- [ ] 13.3 Confirmation dialog for delete
- [ ] 13.4 Optimistic removal from list
- [ ] 13.5 Toast notification on success/failure

## 14. Nix Configuration
- [ ] 14.1 Add `folders` option to account submodule
- [ ] 14.2 Add `idleEnabled` option (default: true)
- [ ] 14.3 Add `fetchBodies` option (default: true)
- [ ] 14.4 Update systemd service for IDLE (long-running)

## 15. Testing
- [ ] 15.1 Unit tests for IMAP IDLE manager
- [ ] 15.2 Unit tests for folder mapping
- [ ] 15.3 Unit tests for body parsing
- [ ] 15.4 Integration tests for search
- [ ] 15.5 E2E tests for read/delete flow
