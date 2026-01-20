# Capability: Email Trash Management

## ADDED Requirements

### Requirement: Move Message to Trash

The system SHALL move messages to the trash folder in both the local database and on the email provider when a delete operation is requested.

#### Scenario: Single message delete succeeds on both database and provider

- **GIVEN** a message exists in the inbox with id "msg123"
- **AND** the message's account provider is authenticated
- **WHEN** DELETE /api/messages/msg123 is called
- **THEN** the message folder is set to "trash" in the database
- **AND** the message original_folder is set to "inbox" in the database
- **AND** the provider move_to_trash() method is called with message_id "msg123"
- **AND** the response status is "moved_to_trash"
- **AND** the response indicates provider sync succeeded

#### Scenario: Provider sync fails but database operation succeeds

- **GIVEN** a message exists with id "msg456"
- **AND** the provider is unreachable (network error)
- **WHEN** DELETE /api/messages/msg456 is called
- **THEN** the message is moved to trash in the database
- **AND** the provider sync is attempted
- **AND** the provider sync failure is logged
- **AND** the response status is "moved_to_trash"
- **AND** the response indicates provider sync failed
- **AND** the HTTP status code is 200 (partial success)

#### Scenario: Bulk delete syncs to provider for each message

- **GIVEN** 5 messages exist with ids ["msg1", "msg2", "msg3", "msg4", "msg5"]
- **AND** all messages belong to authenticated provider accounts
- **WHEN** POST /api/messages/bulk/delete is called with all 5 message IDs
- **THEN** all 5 messages are moved to trash in the database
- **AND** provider.move_to_trash() is called for each message ID
- **AND** the response contains moved_to_trash count of 5
- **AND** the response contains provider_synced count of 5

### Requirement: Restore Message from Trash

The system SHALL restore messages from trash to their original folder in both the database and on the provider when a restore operation is requested.

#### Scenario: Restore message to original folder on provider

- **GIVEN** a message exists in trash with id "msg789"
- **AND** the message original_folder is "inbox"
- **AND** the provider is authenticated
- **WHEN** POST /api/messages/msg789/restore is called
- **THEN** the message folder is set to "inbox" in the database
- **AND** the message original_folder is cleared in the database
- **AND** the provider restore_from_trash() method is called
- **AND** the response status is "restored"

#### Scenario: Restore defaults to inbox when original_folder is NULL

- **GIVEN** a message exists in trash with id "msg999"
- **AND** the message original_folder is NULL
- **AND** the provider is authenticated
- **WHEN** POST /api/messages/msg999/restore is called
- **THEN** the message folder is set to "inbox" in the database
- **AND** the provider restore_from_trash() restores to inbox

#### Scenario: Bulk restore syncs all messages to provider

- **GIVEN** 3 messages exist in trash with ids ["t1", "t2", "t3"]
- **AND** all have original_folder values set
- **WHEN** POST /api/messages/bulk/restore is called
- **THEN** all 3 messages are restored to their original folders in the database
- **AND** provider.restore_from_trash() is called for each message
- **AND** the response contains restored count of 3
- **AND** the response contains provider_synced count of 3

### Requirement: Permanent Message Deletion

The system SHALL permanently delete messages from both the database and provider when permanent delete is requested.

#### Scenario: Permanent delete removes message from provider

- **GIVEN** a message exists in trash with id "msg111"
- **AND** the provider is authenticated
- **WHEN** POST /api/messages/bulk/permanent-delete is called with ["msg111"]
- **THEN** the message is deleted from the database
- **AND** provider.delete_message(msg111, permanent=True) is called
- **AND** the response indicates 1 message permanently deleted
- **AND** the provider confirms message is removed from server

#### Scenario: Clear trash deletes all trash messages on provider

- **GIVEN** 10 messages exist in the trash folder
- **AND** all belong to authenticated provider accounts
- **WHEN** POST /api/messages/clear-trash is called
- **THEN** all 10 messages are deleted from the database
- **AND** provider.delete_message(permanent=True) is called for each message
- **AND** the response indicates 10 messages deleted
- **AND** all messages are removed from provider trash folders

#### Scenario: Mixed provider sync results in bulk permanent delete

- **GIVEN** 5 messages in trash
- **AND** 3 belong to reachable providers
- **AND** 2 belong to unreachable providers (offline)
- **WHEN** POST /api/messages/bulk/permanent-delete is called
- **THEN** all 5 are deleted from the database
- **AND** provider sync succeeds for 3 messages
- **AND** provider sync fails for 2 messages
- **AND** the response shows deleted=5, provider_synced=3, provider_failed=2
- **AND** the operation completes with partial success status

### Requirement: Provider Sync Error Handling

The system SHALL handle provider synchronization errors gracefully, ensuring database operations succeed even when provider operations fail.

#### Scenario: Database operation succeeds despite provider failure

- **GIVEN** a message with id "msg222"
- **AND** the provider is offline
- **WHEN** any trash operation is performed
- **THEN** the database operation completes successfully
- **AND** the provider sync is attempted
- **AND** the provider error is logged with message ID and operation type
- **AND** the response indicates partial success
- **AND** the error details are included in the response

#### Scenario: Authentication failure is logged and reported

- **GIVEN** a message with id "msg333"
- **AND** the provider credentials are expired
- **WHEN** a delete operation is performed
- **THEN** the database operation succeeds
- **AND** provider authentication is attempted
- **AND** authentication failure is logged
- **AND** the response indicates provider sync failed due to authentication
- **AND** the user can still see the message moved to trash locally

#### Scenario: Provider API rate limit is handled

- **GIVEN** 100 messages to be deleted
- **AND** the provider has a rate limit of 10 requests per second
- **WHEN** POST /api/messages/bulk/delete is called
- **THEN** the database operations complete immediately for all 100
- **AND** provider sync operations are attempted for each message
- **AND** rate limit errors are caught and logged
- **AND** the response indicates how many provider syncs succeeded vs failed
- **AND** the overall operation is considered successful

### Requirement: Original Folder Preservation

The system SHALL preserve the original folder location of messages when moving them to trash, enabling accurate restoration.

#### Scenario: Original folder is stored when moving to trash

- **GIVEN** a message in folder "sent" with id "msg444"
- **WHEN** the message is deleted
- **THEN** the database original_folder is set to "sent"
- **AND** the database folder is set to "trash"
- **AND** when restored, the message returns to "sent" folder

#### Scenario: Original folder defaults to inbox when NULL

- **GIVEN** a message in trash with id "msg555"
- **AND** the message original_folder is NULL (legacy data)
- **WHEN** POST /api/messages/msg555/restore is called
- **THEN** the message is restored to "inbox" by default
- **AND** the provider moves the message to the inbox folder

#### Scenario: Multiple trash/restore cycles preserve initial folder

- **GIVEN** a message originally in "sent" folder
- **WHEN** the message is deleted (sent -> trash, original_folder="sent")
- **AND** the message is restored (trash -> sent, original_folder=NULL)
- **AND** the message is deleted again (sent -> trash, original_folder="sent")
- **THEN** the message can still be restored to "sent" folder
- **AND** the original_folder is consistently tracked
