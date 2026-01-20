# Capability: Gmail Provider

## ADDED Requirements

### Requirement: Gmail Move to Trash

The Gmail provider SHALL move messages to the Gmail Trash folder by modifying labels.

#### Scenario: Move message to trash using Gmail API

- **GIVEN** a Gmail message with id "17abc123"
- **AND** the provider is authenticated
- **WHEN** move_to_trash("17abc123") is called
- **THEN** the Gmail API modify request is sent
- **AND** the TRASH label is added to the message
- **AND** the INBOX label is removed from the message
- **AND** the operation completes without error

#### Scenario: Message already in trash is no-op

- **GIVEN** a Gmail message with id "17def456"
- **AND** the message already has the TRASH label
- **WHEN** move_to_trash("17def456") is called
- **THEN** the operation completes successfully
- **AND** no API call is made (idempotent)

#### Scenario: Gmail API error is raised

- **GIVEN** a Gmail message with id "17ghi789"
- **AND** the Gmail API is unreachable
- **WHEN** move_to_trash("17ghi789") is called
- **THEN** a RuntimeError is raised with the Gmail API error details
- **AND** the error is logged with message ID

### Requirement: Gmail Restore from Trash

The Gmail provider SHALL restore messages from trash by removing the TRASH label and adding the original folder label.

#### Scenario: Restore message to inbox

- **GIVEN** a Gmail message in trash with id "17jkl012"
- **AND** the database original_folder is "inbox"
- **WHEN** restore_from_trash("17jkl012") is called
- **THEN** the Gmail API modify request is sent
- **AND** the TRASH label is removed
- **AND** the INBOX label is added
- **AND** the operation completes successfully

#### Scenario: Restore message to sent folder

- **GIVEN** a Gmail message in trash with id "17mno345"
- **AND** the database original_folder is "sent"
- **WHEN** restore_from_trash("17mno345") is called
- **THEN** the TRASH label is removed
- **AND** the SENT label is added
- **AND** the message appears in the Sent folder

#### Scenario: Restore defaults to inbox when original_folder is NULL

- **GIVEN** a Gmail message in trash with id "17pqr678"
- **AND** the database original_folder is NULL
- **WHEN** restore_from_trash("17pqr678") is called
- **THEN** the TRASH label is removed
- **AND** the INBOX label is added
- **AND** the message is restored to inbox by default

### Requirement: Gmail Permanent Delete

The Gmail provider SHALL permanently delete messages using the Gmail API delete method.

#### Scenario: Permanently delete message

- **GIVEN** a Gmail message with id "17stu901"
- **WHEN** delete_message("17stu901", permanent=True) is called
- **THEN** the Gmail API messages.delete() method is called
- **AND** the message is permanently removed from Gmail
- **AND** the operation completes successfully

#### Scenario: Soft delete delegates to move_to_trash

- **GIVEN** a Gmail message with id "17vwx234"
- **WHEN** delete_message("17vwx234", permanent=False) is called
- **THEN** the move_to_trash() method is called internally
- **AND** the message is moved to trash (not permanently deleted)

#### Scenario: Message not found returns error

- **GIVEN** a non-existent Gmail message id "17zzz999"
- **WHEN** delete_message("17zzz999", permanent=True) is called
- **THEN** a 404 error from Gmail API is caught
- **AND** a RuntimeError is raised with "Message not found" details

### Requirement: Gmail Label Management for Trash Operations

The Gmail provider SHALL manage label IDs for trash operations, using cached system labels.

#### Scenario: System labels are cached on first use

- **GIVEN** the Gmail provider is authenticated
- **AND** no label cache exists
- **WHEN** move_to_trash() is called for the first time
- **THEN** the Gmail API labels.list() is called once
- **AND** INBOX, SENT, and TRASH label IDs are cached
- **AND** subsequent operations use cached IDs without additional API calls

#### Scenario: TRASH label ID is retrieved correctly

- **GIVEN** the Gmail API returns label list
- **AND** the TRASH system label has id "TRASH"
- **WHEN** move_to_trash() retrieves the TRASH label
- **THEN** the correct label ID "TRASH" is used in modify requests

#### Scenario: Label cache is refreshed on error

- **GIVEN** a cached label ID that is stale
- **AND** a Gmail API error indicates invalid label
- **WHEN** the operation is retried
- **THEN** the label cache is invalidated
- **AND** labels are re-fetched from the API
- **AND** the operation is attempted again with fresh label IDs
