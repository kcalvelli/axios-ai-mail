# Email Management API - Phase 4

## ADDED Requirements

### Requirement: Message Body Endpoint
The API SHALL provide an endpoint to fetch full message body content.

#### Scenario: Fetch body success
- **WHEN** GET /api/messages/{id}/body is called
- **THEN** response includes body_text and body_html fields
- **AND** body is fetched from server if not cached locally
- **AND** body is stored in database for future requests

#### Scenario: Fetch body not found
- **WHEN** GET /api/messages/{id}/body for non-existent message
- **THEN** response is 404 Not Found

### Requirement: Mark Read Endpoint
The API SHALL provide endpoints to mark messages as read or unread.

#### Scenario: Mark as read
- **WHEN** POST /api/messages/{id}/read is called
- **THEN** message is marked as read in database
- **AND** server is notified via provider
- **AND** response confirms success

#### Scenario: Mark as unread
- **WHEN** POST /api/messages/{id}/unread is called
- **THEN** message is marked as unread in database
- **AND** server is notified via provider
- **AND** response confirms success

#### Scenario: Bulk mark as read
- **WHEN** POST /api/messages/bulk/read with list of IDs
- **THEN** all specified messages are marked as read
- **AND** response includes count of updated messages

### Requirement: Delete Endpoint
The API SHALL provide endpoints to delete messages.

#### Scenario: Delete single message
- **WHEN** DELETE /api/messages/{id} is called
- **THEN** message is removed from database
- **AND** server deletion is triggered via provider
- **AND** response confirms deletion

#### Scenario: Bulk delete
- **WHEN** POST /api/messages/bulk/delete with list of IDs
- **THEN** all specified messages are deleted
- **AND** response includes count of deleted messages

#### Scenario: Delete with permanent flag
- **WHEN** DELETE /api/messages/{id}?permanent=true
- **THEN** message is permanently deleted (not moved to trash)

### Requirement: Search Endpoint
The API SHALL provide full-text search across messages.

#### Scenario: Search by query
- **WHEN** GET /api/messages/search?q=invoice
- **THEN** response includes messages matching "invoice"
- **AND** results are paginated
- **AND** results include relevance score

#### Scenario: Search with filters
- **WHEN** GET /api/messages/search?q=meeting&account=work&unread=true
- **THEN** results are filtered by account and read status
- **AND** only matching messages are returned

#### Scenario: Search empty query
- **WHEN** GET /api/messages/search without q parameter
- **THEN** response is 400 Bad Request

### Requirement: Folders Endpoint
The API SHALL provide endpoint to list available folders.

#### Scenario: List folders
- **WHEN** GET /api/folders is called
- **THEN** response includes folder list per account
- **AND** each folder includes name and unread count

#### Scenario: Folder messages
- **WHEN** GET /api/messages?folder=sent
- **THEN** response includes only messages from sent folder
