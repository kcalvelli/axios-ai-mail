# Implementation Tasks

## 1. Provider Interface Extensions

- [ ] 1.1 Add `move_to_trash()` method to EmailProvider protocol in `providers/base.py`
- [ ] 1.2 Add `restore_from_trash()` method to EmailProvider protocol
- [ ] 1.3 Add `delete_message()` method to EmailProvider protocol (if not already exists)
- [ ] 1.4 Add abstract method stubs to BaseEmailProvider class
- [ ] 1.5 Update docstrings with parameter descriptions and error conditions

## 2. Gmail Provider Implementation

- [ ] 2.1 Implement `move_to_trash(message_id)` using Gmail API's modify method
  - Remove INBOX label, add TRASH label
  - Handle label ID lookup and caching
  - Log operation success/failure
- [ ] 2.2 Implement `restore_from_trash(message_id)` using Gmail API's modify method
  - Remove TRASH label, add INBOX label (or original folder label)
  - Query database for original_folder to restore correctly
  - Handle case where original_folder is NULL (default to INBOX)
- [ ] 2.3 Implement `delete_message(message_id, permanent=False)`
  - If permanent=False: call move_to_trash()
  - If permanent=True: use Gmail API's messages.delete() method
  - Handle API rate limits gracefully
- [ ] 2.4 Add error handling for all methods (API errors, network failures, not found)
- [ ] 2.5 Add logging for all trash operations

## 3. IMAP Provider Implementation

- [ ] 3.1 Implement `restore_from_trash(message_id)` method
  - Parse message_id to extract folder and UID
  - Query database to get original_folder (default to INBOX)
  - COPY message from Trash to original folder
  - Mark message as \Deleted in Trash and EXPUNGE
  - Handle case where Trash folder or original folder don't exist
- [ ] 3.2 Add `move_to_trash(message_id)` wrapper method
  - Call existing `delete_message(message_id, permanent=False)`
  - Ensure consistent naming across providers
- [ ] 3.3 Verify existing `delete_message()` handles both soft and permanent deletes correctly
- [ ] 3.4 Add error handling for IMAP command failures
- [ ] 3.5 Add logging for all trash operations

## 4. API Route Integration

- [ ] 4.1 Update `DELETE /api/messages/{id}` endpoint
  - After `db.move_to_trash()`, call `provider.move_to_trash()`
  - Wrap provider call in try/except
  - Log provider errors but don't fail request
  - Return status indicating partial success if provider fails
- [ ] 4.2 Update `POST /api/messages/bulk/delete` endpoint
  - For each message after database update, call `provider.move_to_trash()`
  - Track provider successes and failures separately
  - Return counts: `moved_to_trash`, `provider_synced`, `provider_failed`
  - Continue processing even if individual provider calls fail
- [ ] 4.3 Update `POST /api/messages/{id}/restore` endpoint
  - After `db.restore_from_trash()`, call `provider.restore_from_trash()`
  - Handle provider errors gracefully
  - Return detailed status
- [ ] 4.4 Update `POST /api/messages/bulk/restore` endpoint
  - Call provider for each message after database restore
  - Track and return separate counts for database and provider operations
  - Continue on provider failures
- [ ] 4.5 Update `POST /api/messages/bulk/permanent-delete` endpoint
  - Call `provider.delete_message(permanent=True)` for each message
  - Handle provider failures gracefully
  - Return detailed status
- [ ] 4.6 Update `POST /api/messages/clear-trash` endpoint
  - Call `provider.delete_message(permanent=True)` for all trash messages
  - Track batch operation progress
  - Return counts of database vs provider deletes

## 5. Response Model Updates

- [ ] 5.1 Add `ProviderSyncStatus` model to `api/models.py`
  - Fields: `success: bool`, `provider_synced: int`, `provider_failed: int`, `errors: List[str]`
- [ ] 5.2 Update bulk operation response models to include provider sync status
  - `BulkDeleteResponse`
  - `BulkRestoreResponse`
  - `BulkPermanentDeleteResponse`
- [ ] 5.3 Update single message operation responses to include provider status

## 6. Provider Factory Integration

- [ ] 6.1 Update API route helpers to retrieve provider instance from account
  - Use `ProviderFactory.create_from_account(db_account)`
  - Authenticate provider before trash operations
  - Cache provider instance per request if multiple operations
- [ ] 6.2 Handle case where account not found (message orphaned)
  - Log warning and skip provider sync
  - Return appropriate error to user

## 7. Error Handling & Logging

- [ ] 7.1 Add structured logging for all provider sync operations
  - Log: operation type, message_id, account_id, success/failure, error details
- [ ] 7.2 Define error categories
  - Authentication failures
  - Network/timeout errors
  - Provider API errors (rate limit, not found, etc.)
  - Permission errors
- [ ] 7.3 Add metrics/counters for provider sync success/failure rates (optional)
- [ ] 7.4 Document expected errors and recovery procedures

## 8. Testing

- [ ] 8.1 Write unit tests for Gmail provider trash methods
  - Test move_to_trash with valid message
  - Test restore_from_trash with valid message
  - Test permanent delete
  - Test error handling (not found, API errors)
- [ ] 8.2 Write unit tests for IMAP provider trash methods
  - Test restore_from_trash with valid message
  - Test with different folder configurations
  - Test error handling (folder not found, connection errors)
- [ ] 8.3 Write integration tests for API routes
  - Test single delete -> provider sync
  - Test bulk delete -> provider sync
  - Test restore -> provider sync
  - Test clear trash -> provider sync
  - Test error scenarios (provider offline, authentication failure)
- [ ] 8.4 Manual testing checklist
  - Delete message in UI → verify appears in Gmail Trash
  - Restore message in UI → verify returns to Inbox in Gmail
  - Permanently delete → verify removed from Gmail
  - Clear trash → verify all messages removed from Gmail
  - Test with IMAP provider (Fastmail, etc.)
  - Test bulk operations with 10+ messages
  - Test error handling with network disconnected

## 9. Documentation

- [ ] 9.1 Update provider implementation docs with trash operation details
- [ ] 9.2 Document error handling strategy and failure modes
- [ ] 9.3 Add troubleshooting guide for common provider sync failures
- [ ] 9.4 Update API documentation with new response fields

## 10. Validation

- [ ] 10.1 Run `openspec validate sync-trash-operations-to-providers --strict`
- [ ] 10.2 Verify all spec deltas are complete with scenarios
- [ ] 10.3 Code review for error handling completeness
- [ ] 10.4 Verify no regression in existing functionality
