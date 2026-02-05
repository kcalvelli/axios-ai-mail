## ADDED Requirements

### Requirement: Permanent Delete Pending Operation

The sync engine SHALL support a `permanent_delete` operation type in the pending operations queue for asynchronous permanent deletion of messages from email providers.

#### Scenario: Clear trash queues permanent delete operations
- **Given** a user clicks "Clear Trash" with 15 messages in trash
- **When** the clear trash API is called
- **Then** all 15 messages are deleted from the local database immediately
- **And** 15 `permanent_delete` pending operations are queued (one per message)
- **And** the API returns within 500ms with `{ deleted: 15, queued: 15 }`
- **And** the user can continue using the application immediately

#### Scenario: Sync processes permanent delete operations
- **Given** there are `permanent_delete` operations in the pending queue
- **When** the sync service runs
- **Then** each operation calls `provider.delete_message(message_id, permanent=True)`
- **And** successful operations are marked as `completed`
- **And** failed operations are retried with exponential backoff up to 3 attempts

#### Scenario: Provider unreachable during permanent delete
- **Given** a `permanent_delete` operation is being processed
- **And** the email provider is unreachable
- **When** the delete fails
- **Then** the operation status is updated to reflect the failure
- **And** `last_error` is populated with the error message
- **And** the operation will be retried on the next sync cycle

#### Scenario: Message already deleted from provider
- **Given** a `permanent_delete` operation exists
- **And** the message no longer exists on the provider (already deleted or expired)
- **When** the sync engine processes the operation
- **Then** the operation is marked as `completed`
- **And** no error is logged (this is expected behavior)
