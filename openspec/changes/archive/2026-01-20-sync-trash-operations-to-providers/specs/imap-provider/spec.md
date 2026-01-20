# Capability: IMAP Provider

## ADDED Requirements

### Requirement: IMAP Restore from Trash

The IMAP provider SHALL restore messages from the Trash folder to their original folder using IMAP COPY and DELETE commands.

#### Scenario: Restore message to inbox folder

- **GIVEN** an IMAP message in Trash with id "account:Trash:123"
- **AND** the database original_folder is "inbox"
- **AND** the IMAP folder mapping has "inbox" -> "INBOX"
- **WHEN** restore_from_trash("account:Trash:123") is called
- **THEN** the Trash folder is selected with IMAP SELECT
- **AND** the message is copied to INBOX with IMAP COPY command
- **AND** the message in Trash is marked as \Deleted
- **AND** EXPUNGE is called to remove from Trash
- **AND** the operation completes successfully

#### Scenario: Restore to sent folder using folder mapping

- **GIVEN** an IMAP message in Trash with id "account:Trash:456"
- **AND** the database original_folder is "sent"
- **AND** the IMAP folder mapping has "sent" -> "INBOX.Sent"
- **WHEN** restore_from_trash("account:Trash:456") is called
- **THEN** the message is copied to "INBOX.Sent"
- **AND** the message is removed from Trash
- **AND** the restored message appears in the Sent folder

#### Scenario: Restore defaults to INBOX when original_folder is NULL

- **GIVEN** an IMAP message in Trash with id "account:Trash:789"
- **AND** the database original_folder is NULL
- **WHEN** restore_from_trash("account:Trash:789") is called
- **THEN** the message is restored to "INBOX" by default
- **AND** the message is removed from Trash

#### Scenario: Trash folder not found falls back gracefully

- **GIVEN** an IMAP server without a Trash folder
- **AND** a message id "account:Trash:999"
- **WHEN** restore_from_trash("account:Trash:999") is called
- **THEN** a RuntimeError is raised with "Trash folder not found"
- **AND** the error is logged
- **AND** the database operation is not affected

#### Scenario: Original folder not found creates folder

- **GIVEN** an IMAP message in Trash with id "account:Trash:111"
- **AND** the database original_folder is "archive"
- **AND** the "archive" folder does not exist on the IMAP server
- **WHEN** restore_from_trash("account:Trash:111") is called
- **THEN** the Archive folder is created with IMAP CREATE command
- **AND** the message is copied to the new Archive folder
- **AND** the message is removed from Trash

### Requirement: IMAP Move to Trash Wrapper

The IMAP provider SHALL provide a move_to_trash() method that delegates to the existing delete_message() implementation.

#### Scenario: Move to trash calls delete with permanent=False

- **GIVEN** an IMAP message with id "account:INBOX:222"
- **WHEN** move_to_trash("account:INBOX:222") is called
- **THEN** delete_message("account:INBOX:222", permanent=False) is called internally
- **AND** the message is moved to Trash folder using COPY and DELETE

#### Scenario: Trash folder is discovered dynamically

- **GIVEN** an IMAP server with trash folder "INBOX.Trash"
- **AND** folder discovery has run
- **WHEN** move_to_trash() is called
- **THEN** the folder mapping is used to find "INBOX.Trash"
- **AND** the message is copied to the correct trash folder

### Requirement: IMAP Permanent Delete

The IMAP provider SHALL support permanent deletion by marking messages as \Deleted and expunging them.

#### Scenario: Permanent delete removes message from server

- **GIVEN** an IMAP message with id "account:INBOX:333"
- **WHEN** delete_message("account:INBOX:333", permanent=True) is called
- **THEN** the INBOX folder is selected
- **AND** the message UID 333 is marked with \Deleted flag using STORE command
- **AND** EXPUNGE is called to permanently remove the message
- **AND** the message no longer exists on the IMAP server

#### Scenario: Permanent delete from trash folder

- **GIVEN** an IMAP message in Trash with id "account:Trash:444"
- **WHEN** delete_message("account:Trash:444", permanent=True) is called
- **THEN** the Trash folder is selected
- **AND** the message is marked \Deleted and expunged
- **AND** the message is permanently removed from the server

#### Scenario: EXPUNGE command failure is logged

- **GIVEN** an IMAP server that doesn't support EXPUNGE
- **AND** a message id "account:INBOX:555"
- **WHEN** delete_message permanent is attempted
- **THEN** the STORE \Deleted succeeds
- **AND** the EXPUNGE fails with IMAP error
- **AND** a RuntimeError is raised with error details
- **AND** the error is logged for troubleshooting

### Requirement: IMAP Message ID Parsing for Trash Operations

The IMAP provider SHALL correctly parse message IDs to extract folder and UID for trash operations.

#### Scenario: Parse message ID with folder context

- **GIVEN** a message id "account123:Trash:456"
- **WHEN** _parse_message_id() is called
- **THEN** the folder is extracted as "Trash"
- **AND** the UID is extracted as "456"
- **AND** these are used in IMAP SELECT and COPY commands

#### Scenario: Handle legacy message ID format

- **GIVEN** a legacy message id "account123:789" (no folder)
- **WHEN** _parse_message_id() is called
- **THEN** the folder defaults to "INBOX"
- **AND** the UID is extracted as "789"
- **AND** backwards compatibility is maintained

### Requirement: IMAP Folder Selection for Trash Operations

The IMAP provider SHALL select the correct folder before performing trash operations.

#### Scenario: Select Trash folder before restore

- **GIVEN** a message in Trash
- **WHEN** restore_from_trash() is called
- **THEN** the IMAP SELECT command is issued for the Trash folder
- **AND** the folder is verified to be selected successfully
- **AND** subsequent COPY and DELETE commands operate on the correct folder

#### Scenario: Folder selection failure raises error

- **GIVEN** a non-existent folder name
- **WHEN** restore_from_trash() attempts to select it
- **THEN** the IMAP SELECT command fails
- **AND** a RuntimeError is raised with "Failed to select folder"
- **AND** the operation is aborted

#### Scenario: Concurrent folder selection is serialized

- **GIVEN** multiple trash operations happening in sequence
- **WHEN** each operation selects a different folder
- **THEN** folders are selected in order without conflicts
- **AND** each operation acts on the correct folder
- **AND** no race conditions occur
