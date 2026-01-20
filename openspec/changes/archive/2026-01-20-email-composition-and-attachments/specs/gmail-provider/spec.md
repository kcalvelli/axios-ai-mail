# Capability: Gmail Provider

## ADDED Requirements

### Requirement: Send Message via Gmail API

The Gmail provider SHALL send messages using the Gmail API's messages.send method.

#### Scenario: Send simple message

- **GIVEN** a draft with To, Subject, and body
- **WHEN** send_message() is called
- **THEN** a MIME message is built
- **AND** base64 URL-safe encoded
- **AND** sent via users.messages.send()
- **AND** the sent message ID is returned

#### Scenario: Send reply with thread preservation

- **GIVEN** a draft that is a reply with thread_id "abc123"
- **WHEN** send_message() is called
- **THEN** the threadId parameter is set to "abc123"
- **AND** In-Reply-To and References headers are set
- **AND** the reply appears in the same thread in Gmail

#### Scenario: Send with attachments

- **GIVEN** a draft with 3 attachments
- **WHEN** send_message() is called
- **THEN** a multipart/mixed MIME message is built
- **AND** each attachment is base64 encoded
- **AND** the total message size is under 25MB
- **AND** the message sends successfully

#### Scenario: Send fails due to quota exceeded

- **GIVEN** the user has exceeded Gmail's send quota
- **WHEN** send_message() is called
- **THEN** the Gmail API returns 429 Too Many Requests
- **AND** a RuntimeError is raised with "Send quota exceeded"
- **AND** the error is logged

### Requirement: Get Attachment from Gmail

The Gmail provider SHALL retrieve attachment data using the Gmail API.

#### Scenario: Download attachment by ID

- **GIVEN** a message with attachment ID "att123"
- **WHEN** get_attachment("msg456", "att123") is called
- **THEN** users.messages.attachments.get() is called
- **AND** the attachment data is base64 decoded
- **AND** the filename, content_type, and binary data are returned

#### Scenario: Attachment not found

- **GIVEN** an invalid attachment ID
- **WHEN** get_attachment() is called
- **THEN** the Gmail API returns 404 Not Found
- **AND** a RuntimeError is raised with "Attachment not found"

### Requirement: List Message Attachments

The Gmail provider SHALL extract attachment metadata from message payloads.

#### Scenario: List attachments from message

- **GIVEN** a message with 2 attachments
- **WHEN** list_attachments("msg789") is called
- **THEN** the message payload is fetched
- **AND** MIME parts with filename are identified
- **AND** a list of attachment metadata is returned
- **AND** each entry has id, filename, size, content_type

#### Scenario: Message with no attachments

- **GIVEN** a text-only message
- **WHEN** list_attachments() is called
- **THEN** an empty list is returned

#### Scenario: Inline image identified

- **GIVEN** a message with inline image (Content-Disposition: inline)
- **WHEN** list_attachments() is called
- **THEN** the inline image is included in the list
- **AND** marked with is_inline=true

### Requirement: Gmail Send Size Validation

The Gmail provider SHALL enforce Gmail's 25MB message size limit.

#### Scenario: Message under 25MB accepted

- **GIVEN** a draft with 20MB of attachments
- **WHEN** send_message() is called
- **THEN** the size is validated as acceptable
- **AND** the message sends successfully

#### Scenario: Message over 25MB rejected

- **GIVEN** a draft with 30MB of attachments
- **WHEN** send_message() is called
- **THEN** a RuntimeError is raised with "Message exceeds 25MB limit"
- **AND** the send operation is aborted
- **AND** no API call is made

## MODIFIED Requirements

### Requirement: Gmail Authentication Scopes

The Gmail provider SHALL request additional OAuth scopes for sending and attachment access.

**Changes:**
- ADD scope: `https://www.googleapis.com/auth/gmail.send`
- ADD scope: `https://www.googleapis.com/auth/gmail.readonly` (for attachments)
- KEEP existing scope: `https://www.googleapis.com/auth/gmail.modify`

#### Scenario: OAuth flow requests send scope

- **GIVEN** the user is setting up a new Gmail account
- **WHEN** the OAuth authorization flow starts
- **THEN** the consent screen requests gmail.send permission
- **AND** the consent screen requests gmail.readonly permission
- **AND** the user must approve both to proceed
