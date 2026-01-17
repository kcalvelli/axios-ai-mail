# Implementation Tasks

## 1. Database Schema & Models

- [ ] 1.1 Create Alembic migration 005_add_drafts_and_attachments.py
  - Add `drafts` table with all fields
  - Add `attachments` table with BLOB storage
  - Add foreign key constraints
  - Add indexes on account_id, created_at
- [ ] 1.2 Create Draft model in `db/models.py`
  - Add Draft SQLAlchemy model
  - JSON serialization for email arrays
  - Relationship to Account
  - Timestamps with auto-update
- [ ] 1.3 Create Attachment model in `db/models.py`
  - Add Attachment SQLAlchemy model
  - BLOB field for binary data
  - Relationships to Draft and Message
  - Content type validation
- [ ] 1.4 Add draft management methods to Database class
  - create_draft()
  - get_draft()
  - list_drafts()
  - update_draft()
  - delete_draft()
- [ ] 1.5 Add attachment methods to Database class
  - store_attachment()
  - get_attachment()
  - list_message_attachments()
  - delete_attachment()

## 2. Email Composition Backend

- [ ] 2.1 Create MIME message builder in `email/composer.py`
  - Build multipart/alternative (text + HTML)
  - Add attachments with base64 encoding
  - Set proper headers (From, To, Subject, Date, Message-ID)
  - Thread headers for replies (In-Reply-To, References)
  - Handle character encoding (UTF-8)
- [ ] 2.2 Implement draft creation from message (reply/forward)
  - Extract quoted text from original message
  - Format quoted text with > prefix or HTML blockquote
  - Copy attachments for forward
  - Set In-Reply-To and References headers
  - Generate appropriate subject (Re:, Fwd:)
- [ ] 2.3 Add email address validation
  - Regex for basic email format
  - Check for valid domain
  - Validate To/Cc/Bcc fields
  - Warn on missing recipients
- [ ] 2.4 Implement auto-save logic
  - Debounce save calls (30 second delay)
  - Update existing draft or create new
  - Track last save timestamp
  - Handle concurrent edit conflicts

## 3. SMTP Sending Implementation

- [ ] 3.1 Create SMTP client wrapper in `email/smtp.py`
  - Connect with TLS/SSL support
  - Authenticate with username/password
  - Send MIME message
  - Handle SMTP errors gracefully
  - Connection pooling/reuse
- [ ] 3.2 Add SMTP configuration to Nix module
  - smtp_host option
  - smtp_port option (default 587)
  - smtp_tls option (default true)
  - smtp_username option
  - smtp_password_file option
  - Validation and examples
- [ ] 3.3 Implement send error handling
  - Catch SMTPAuthenticationError
  - Catch SMTPServerDisconnected
  - Catch connection timeout
  - Retry logic (3 attempts with backoff)
  - Log all send attempts

## 4. Gmail Provider Updates

- [ ] 4.1 Implement send_message() using Gmail API
  - Build MIME message
  - Base64 URL-safe encode
  - Call users.messages.send()
  - Set threadId for replies
  - Handle quota errors
- [ ] 4.2 Implement get_attachment() method
  - Fetch attachment by attachment_id
  - Base64 decode attachment data
  - Return filename, content_type, data
  - Cache attachment metadata
- [ ] 4.3 Implement list_attachments() method
  - Parse message payload for attachments
  - Extract filename, size, content_type
  - Return attachment metadata list
- [ ] 4.4 Add attachment size validation
  - Check total message size <25MB (Gmail limit)
  - Reject individual files >25MB
  - Return helpful error messages
- [ ] 4.5 Update Gmail authentication scopes
  - Add gmail.send scope
  - Add gmail.readonly for attachments
  - Update OAuth flow documentation

## 5. IMAP Provider Updates

- [ ] 5.1 Implement send_message() using SMTP
  - Get SMTP config from account settings
  - Connect to SMTP server
  - Send MIME message
  - Handle authentication
  - Log send success/failure
- [ ] 5.2 Store sent message in IMAP Sent folder
  - Build MIME message
  - APPEND to Sent folder
  - Set \Seen flag
  - Preserve Message-ID
  - Handle folder not found error
- [ ] 5.3 Add SMTP credentials to IMAPConfig
  - smtp_host field
  - smtp_port field
  - smtp_username field (default to email)
  - smtp_password field (load from file)
  - smtp_tls field
- [ ] 5.4 Implement get_attachment() method
  - Parse MIME message parts
  - Find attachment by Content-ID or filename
  - Extract and decode attachment data
  - Return metadata and binary data
- [ ] 5.5 Implement list_attachments() method
  - Parse all MIME parts
  - Filter for attachment content dispositions
  - Extract metadata (filename, size, type)
  - Return attachment list

## 6. Provider Interface Extensions

- [ ] 6.1 Add send_message() to EmailProvider protocol
  - Takes Draft object
  - Returns sent message ID
  - Raises RuntimeError on failure
  - Docstring with parameters
- [ ] 6.2 Add get_attachment() to EmailProvider protocol
  - Takes message_id and attachment_id
  - Returns (filename, content_type, data)
  - Raises RuntimeError if not found
- [ ] 6.3 Add list_attachments() to EmailProvider protocol
  - Takes message_id
  - Returns list of attachment metadata
  - Empty list if no attachments
- [ ] 6.4 Add abstract methods to BaseEmailProvider
  - send_message()
  - get_attachment()
  - list_attachments()

## 7. Draft API Endpoints

- [ ] 7.1 Create POST /api/drafts endpoint
  - Accept draft data (to, subject, body, etc.)
  - Validate email addresses
  - Create draft in database
  - Return draft ID
- [ ] 7.2 Create GET /api/drafts endpoint
  - List all drafts for authenticated user
  - Filter by account_id
  - Sort by updated_at DESC
  - Include recipient preview
- [ ] 7.3 Create GET /api/drafts/{id} endpoint
  - Get single draft by ID
  - Include full content and attachments
  - Return 404 if not found
- [ ] 7.4 Create PUT /api/drafts/{id} endpoint
  - Update draft content
  - Validate fields
  - Update updated_at timestamp
  - Return updated draft
- [ ] 7.5 Create DELETE /api/drafts/{id} endpoint
  - Delete draft and associated attachments
  - CASCADE delete attachments
  - Return 204 No Content
- [ ] 7.6 Create POST /api/messages/{id}/reply endpoint
  - Get original message
  - Create draft with quoted text
  - Set In-Reply-To and thread_id
  - Generate Re: subject
  - Return draft ID
- [ ] 7.7 Create POST /api/messages/{id}/forward endpoint
  - Get original message
  - Create draft with quoted text
  - Copy attachments
  - Generate Fwd: subject
  - Return draft ID

## 8. Sending API Endpoint

- [ ] 8.1 Create POST /api/messages/send endpoint
  - Accept draft_id or inline message data
  - Validate recipients
  - Get account and create provider
  - Build MIME message
  - Call provider.send_message()
  - Move draft to sent (if from draft)
  - Delete draft after send
  - Return sent message ID
- [ ] 8.2 Add send error handling
  - Catch authentication errors
  - Catch network errors
  - Catch size limit errors
  - Return appropriate HTTP status codes
  - Keep draft on send failure
- [ ] 8.3 Add send response model
  - success boolean
  - message_id (if successful)
  - error message (if failed)
  - provider_synced boolean
- [ ] 8.4 Implement retry logic for failed sends
  - Retry up to 3 times
  - Exponential backoff (1s, 2s, 4s)
  - Log each attempt
  - Give up after 3 failures

## 9. Attachment API Endpoints

- [ ] 9.1 Create POST /api/attachments/upload endpoint
  - Accept multipart file upload
  - Validate file size (<25MB default)
  - Validate content type (block executables)
  - Store in attachments table
  - Return attachment ID and metadata
- [ ] 9.2 Create GET /api/attachments/{id} endpoint
  - Get attachment by ID
  - Return binary data with Content-Type header
  - Set Content-Disposition: attachment
  - Handle not found
- [ ] 9.3 Create DELETE /api/attachments/{id} endpoint
  - Delete attachment from database
  - Only allow if attached to user's draft
  - Return 204 No Content
- [ ] 9.4 Create GET /api/messages/{id}/attachments endpoint
  - List all attachments for message
  - Return metadata (id, filename, size, content_type)
  - Use provider.list_attachments()
  - Cache results
- [ ] 9.5 Create GET /api/attachments/{id}/preview endpoint (optional)
  - Generate thumbnail for images
  - Return preview for PDFs (first page)
  - Return icon for other file types
  - 404 if preview not available

## 10. Web UI - Compose Page

- [ ] 10.1 Create ComposePage component
  - Route: /compose
  - Query params: reply, forward, draft
  - Layout: header, editor, footer
  - State management for draft data
- [ ] 10.2 Integrate Tiptap rich text editor
  - Install @tiptap/react @tiptap/starter-kit
  - Configure toolbar (bold, italic, link, lists)
  - HTML output mode
  - Plain text toggle
  - Character counter
- [ ] 10.3 Create recipient input with autocomplete
  - Chip-based multi-select
  - Autocomplete from message history
  - Validate email format on blur
  - To/Cc/Bcc toggle
  - Keyboard navigation
- [ ] 10.4 Implement auto-save functionality
  - Save draft every 30 seconds
  - Debounce user input
  - Show "Saving..." / "Saved" indicator
  - Handle save errors gracefully
- [ ] 10.5 Add Send/Discard/Save Draft buttons
  - Send button validates and submits
  - Discard shows confirmation dialog
  - Save Draft saves immediately
  - Disable during send operation
  - Show loading spinner

## 11. Web UI - Attachment Upload

- [ ] 11.1 Create AttachmentUpload component
  - Drag-and-drop zone
  - File picker button
  - Multiple file selection
  - Upload progress indicator
  - File size validation
- [ ] 11.2 Display uploaded attachments
  - List with filename, size, icon
  - Remove button for each
  - Preview thumbnail for images
  - Total size indicator
  - Reorder attachments (optional)
- [ ] 11.3 Implement attachment upload API calls
  - POST /api/attachments/upload
  - Handle upload progress
  - Update draft with attachment IDs
  - Error handling for size/type limits
- [ ] 11.4 Add inline image insertion
  - Upload image
  - Insert <img> tag in editor
  - Use attachment ID as src
  - Resize large images (optional)

## 12. Web UI - Message View Updates

- [ ] 12.1 Add Reply/Forward buttons to MessageDetailPage
  - Reply button
  - Reply All button
  - Forward button
  - Navigate to /compose with query params
- [ ] 12.2 Display attachment list in message view
  - Show filename, size, icon
  - Download button for each
  - Download All button (optional)
  - Preview for images/PDFs
- [ ] 12.3 Implement attachment download
  - GET /api/attachments/{id}
  - Save file with original filename
  - Show download progress
  - Handle download errors
- [ ] 12.4 Render inline images in HTML messages
  - Replace cid: URLs with attachment data
  - Lazy load images
  - Fallback for missing images
  - Security: sanitize HTML

## 13. Web UI - Drafts Folder

- [ ] 13.1 Add Drafts folder to Sidebar
  - New navigation item
  - Draft count badge
  - Icon (draft icon)
  - Navigate to /drafts
- [ ] 13.2 Create DraftsPage component
  - List all drafts
  - Show subject, recipients, timestamp
  - "Continue editing" button
  - Delete draft button
  - Empty state
- [ ] 13.3 Implement draft list API call
  - GET /api/drafts
  - Display in list
  - Sort by updated_at DESC
  - Refresh on draft save/delete

## 14. Testing

- [ ] 14.1 Write unit tests for Draft model
  - CRUD operations
  - JSON serialization
  - Validation
- [ ] 14.2 Write unit tests for Attachment model
  - Store and retrieve binary data
  - Content type validation
  - Foreign key cascades
- [ ] 14.3 Write unit tests for MIME composer
  - Build text message
  - Build HTML message
  - Add attachments
  - Set thread headers
- [ ] 14.4 Write unit tests for SMTP client
  - Mock SMTP server
  - Test authentication
  - Test send success/failure
  - Test error handling
- [ ] 14.5 Write integration tests for send flow
  - Compose → Save Draft → Send → Verify in Sent folder
  - Reply preserves thread
  - Forward includes attachments
  - Attachment size limits enforced
- [ ] 14.6 Manual testing checklist
  - Compose and send via Gmail
  - Compose and send via IMAP/SMTP
  - Reply to message
  - Reply All to message
  - Forward message with attachments
  - Upload various file types
  - Download attachments
  - Save and resume draft
  - Auto-save during composition
  - Discard draft
  - Send with inline images
  - Test with Fastmail, Gmail, self-hosted IMAP

## 15. Documentation & Cleanup

- [ ] 15.1 Update README with composition features
  - Mention compose/reply/forward
  - Document attachment support
  - SMTP configuration examples
- [ ] 15.2 Update Nix module documentation
  - SMTP configuration options
  - Example configs for popular providers
  - Security considerations
- [ ] 15.3 Add user guide for composition
  - How to compose new message
  - How to reply/forward
  - How to attach files
  - How to save drafts
- [ ] 15.4 Clean up draft attachments periodically
  - Background job to delete orphaned attachments
  - Delete auto-saved drafts >7 days old
  - Log cleanup operations
- [ ] 15.5 Run openspec validate --strict
  - Verify all spec deltas complete
  - Ensure scenarios cover requirements
  - Fix validation errors
