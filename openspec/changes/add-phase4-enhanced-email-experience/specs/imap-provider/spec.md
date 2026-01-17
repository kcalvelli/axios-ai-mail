# IMAP Provider - Phase 4 Enhancements

## ADDED Requirements

### Requirement: IMAP IDLE Support
The IMAP provider SHALL support real-time notifications via IMAP IDLE command for instant new mail detection.

#### Scenario: IDLE connection established
- **WHEN** IMAP account is configured and server supports IDLE
- **THEN** provider maintains persistent IDLE connection
- **AND** triggers sync callback when new mail arrives
- **AND** automatically reconnects on connection drop

#### Scenario: IDLE not supported fallback
- **WHEN** IMAP server does not advertise IDLE capability
- **THEN** provider falls back to polling-based sync
- **AND** logs warning about IDLE not being available

#### Scenario: IDLE timeout handling
- **WHEN** IDLE connection has been active for 29 minutes
- **THEN** provider refreshes IDLE connection per RFC 2177
- **AND** does not miss messages during refresh

### Requirement: Multi-folder Sync
The IMAP provider SHALL support syncing messages from multiple folders beyond INBOX.

#### Scenario: Configurable folder list
- **WHEN** account specifies folders: ["inbox", "sent", "archive"]
- **THEN** provider syncs messages from all specified folders
- **AND** stores folder name with each message

#### Scenario: Folder name mapping
- **WHEN** syncing "sent" folder
- **THEN** provider maps to server-specific name (Sent, "Sent Mail", "Sent Items")
- **AND** handles case-insensitive matching

#### Scenario: Folder listing
- **WHEN** listing available folders
- **THEN** provider returns all IMAP folders via LIST command
- **AND** indicates which folders are subscribed

### Requirement: Email Body Fetching
The IMAP provider SHALL fetch complete email body content including text and HTML parts.

#### Scenario: Fetch body on demand
- **WHEN** fetch_body(message_id) is called
- **THEN** provider retrieves BODY[] from IMAP server
- **AND** parses MIME multipart structure
- **AND** returns both text/plain and text/html parts

#### Scenario: Character encoding handling
- **WHEN** email body uses non-UTF8 encoding
- **THEN** provider correctly decodes to UTF-8
- **AND** handles common encodings (ISO-8859-1, Windows-1252)

### Requirement: Mark Read/Unread
The IMAP provider SHALL support marking messages as read or unread with bidirectional sync.

#### Scenario: Mark as read
- **WHEN** mark_as_read(message_id) is called
- **THEN** provider sends STORE +FLAGS (\Seen) to server
- **AND** updates local database is_unread to False

#### Scenario: Mark as unread
- **WHEN** mark_as_unread(message_id) is called
- **THEN** provider sends STORE -FLAGS (\Seen) to server
- **AND** updates local database is_unread to True

### Requirement: Email Deletion
The IMAP provider SHALL support deleting emails with configurable behavior.

#### Scenario: Delete to trash
- **WHEN** delete_message(message_id, permanent=False) is called
- **THEN** provider moves message to Trash folder via COPY + STORE \Deleted
- **AND** removes from local database

#### Scenario: Permanent delete
- **WHEN** delete_message(message_id, permanent=True) is called
- **THEN** provider marks message as \Deleted and EXPUNGEs
- **AND** removes from local database

#### Scenario: Delete non-existent message
- **WHEN** attempting to delete message not on server
- **THEN** provider removes from local database only
- **AND** does not raise error
