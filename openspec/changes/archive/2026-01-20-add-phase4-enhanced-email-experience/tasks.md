# Tasks: Phase 4 - Enhanced Email Experience

> **STATUS: COMPLETE (IMAP IDLE deferred)**
>
> All core features implemented: multi-folder sync, full message body display,
> read/unread sync, delete operations. IMAP IDLE deferred in favor of polling.

## 1. Database Schema Updates
- [x] 1.1 Add `folder` column to messages table
- [x] 1.2 Add `body_text` and `body_html` columns
- [x] 1.3 Add FTS5 virtual table for search
- [x] 1.4 Migrations applied

## 2. IMAP Provider - Multi-folder Support
- [x] 2.1 Folder parameter support in fetch_messages()
- [x] 2.2 Folder listing implemented
- [x] 2.3 Logical folder name mapping
- [x] 2.4 Sync across INBOX, SENT, TRASH, DRAFTS
- [x] 2.5 Folder stored with each message

## 3. IMAP Provider - Body Fetching
- [x] 3.1 fetch_body(message_id) implemented
- [x] 3.2 MIME multipart parsing
- [x] 3.3 Character encoding handling
- [x] 3.4 Bodies fetched during sync
- [x] 3.5 Lazy fetch on demand

## 4. IMAP Provider - Read Status Sync
- [x] 4.1 mark_read() via STORE +FLAGS (\Seen)
- [x] 4.2 mark_unread() via STORE -FLAGS (\Seen)
- [x] 4.3 Async queue integration (via pending operations)

## 5. IMAP Provider - Email Deletion
- [x] 5.1 delete_message() implemented
- [x] 5.2 Move-to-trash support
- [x] 5.3 IMAP STORE +FLAGS + EXPUNGE
- [x] 5.4 Local database sync

## 6. IMAP IDLE Support
- [ ] 6.1 IMAPIdleManager (DEFERRED - polling works)
- [ ] 6.2 IDLE connection with auto-reconnect
- [ ] 6.3 New mail detection
> **Note**: Using systemd timer polling (5min intervals) instead. IDLE is nice-to-have.

## 7. Gmail Provider Updates
- [x] 7.1 Label/folder support
- [x] 7.2 Gmail label to folder mapping
- [x] 7.3 Full message body via Gmail API
- [x] 7.4 mark_read/unread via label modification
- [x] 7.5 Delete via trash() API
- [ ] 7.6 Gmail push notifications (DEFERRED)

## 8. API Endpoints
- [x] 8.1 GET /api/messages/{id}/body
- [x] 8.2 POST /api/messages/{id}/read
- [x] 8.3 POST /api/messages/{id}/unread (same endpoint)
- [x] 8.4 DELETE /api/messages/{id}
- [x] 8.5 POST /api/messages/bulk/read
- [x] 8.6 POST /api/messages/bulk/delete
- [x] 8.7 GET /api/messages with search query param

## 9. Web UI - Message Detail
- [x] 9.1 Full-page message detail view
- [x] 9.2 HTML email rendering with sanitization
- [x] 9.3 Plain text fallback
- [x] 9.4 Inline image support (cid: URLs)
- [x] 9.5 Dark mode for HTML emails
- [x] 9.6 Mobile-responsive scaling

## 10. Web UI - Search & Filter
- [x] 10.1 Search bar in toolbar
- [x] 10.2 Filter by tag in sidebar
- [x] 10.3 Filter by folder
- [x] 10.4 Filter by account
- [x] 10.5 Unread filter toggle
