## 1. Backend: Add Permanent Delete Operation Type

- [x] 1.1 Add `permanent_delete` to accepted `operation` values in `PendingOperation` model docstring
- [x] 1.2 Extend sync engine's `_process_pending_operation` to handle `permanent_delete` operation type
- [x] 1.3 Implement provider `delete_message(permanent=True)` call within pending operation processing

## 2. Backend: Refactor Clear Trash Endpoint

- [x] 2.1 Modify `/messages/clear-trash` to mark messages as `folder="deleting"` instead of immediate deletion
- [x] 2.2 Queue `delete` pending operations for each message (one per message)
- [x] 2.3 Return immediately with `{ deleted: N, queued: N }` response
- [x] 2.4 Remove synchronous provider deletion loop

## 3. Frontend: Improve User Feedback

- [x] 3.1 Update `handleClearTrashConfirm` to show success toast with count (e.g., "20 messages deleted")
- [x] 3.2 Close dialog immediately upon API success (existing behavior verified)
- [x] 3.3 Update API client type to include `queued` field

## 4. Testing

- [ ] 4.1 Test clear trash with multiple messages - verify UI is responsive
- [ ] 4.2 Verify pending operations appear in database after clear trash
- [ ] 4.3 Run sync and verify pending operations are processed successfully
- [ ] 4.4 Test error handling when provider is unreachable
