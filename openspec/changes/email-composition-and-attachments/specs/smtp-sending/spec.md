# Capability: SMTP Sending

## ADDED Requirements

### Requirement: SMTP Connection

The system SHALL connect to SMTP servers using secure TLS/SSL connections.

#### Scenario: Connect to SMTP server with TLS

- **GIVEN** an SMTP configuration with host "smtp.fastmail.com" port 587
- **AND** TLS is enabled
- **WHEN** the system attempts to send a message
- **THEN** a connection is established to port 587
- **AND** STARTTLS is negotiated
- **AND** the connection is encrypted

#### Scenario: SMTP authentication succeeds

- **GIVEN** valid SMTP credentials (username, password)
- **WHEN** the system authenticates with the SMTP server
- **THEN** the LOGIN or PLAIN auth method is used
- **AND** authentication succeeds
- **AND** the system is ready to send

#### Scenario: SMTP authentication fails

- **GIVEN** invalid SMTP credentials
- **WHEN** the system attempts to authenticate
- **THEN** an SMTPAuthenticationError is raised
- **AND** the error is logged with the account ID
- **AND** the send operation fails with clear error message

### Requirement: MIME Message Building

The system SHALL construct RFC-compliant MIME messages for sending.

#### Scenario: Build simple text message

- **GIVEN** a draft with plain text body
- **WHEN** the MIME message is built
- **THEN** a text/plain MIME part is created
- **AND** the Content-Type header is set to "text/plain; charset=utf-8"
- **AND** the body is encoded in UTF-8

#### Scenario: Build HTML message with text alternative

- **GIVEN** a draft with HTML body
- **WHEN** the MIME message is built
- **THEN** a multipart/alternative structure is created
- **AND** the first part is text/plain
- **AND** the second part is text/html
- **AND** both are UTF-8 encoded

#### Scenario: Build message with attachments

- **GIVEN** a draft with 2 attachments
- **WHEN** the MIME message is built
- **THEN** a multipart/mixed structure is created
- **AND** the body is in the first part (multipart/alternative)
- **AND** each attachment is a separate MIME part
- **AND** attachments are base64 encoded
- **AND** Content-Disposition is set to "attachment"

### Requirement: Message Headers

The system SHALL set appropriate email headers for proper routing and threading.

#### Scenario: Required headers set

- **GIVEN** a draft being sent
- **WHEN** the MIME message is built
- **THEN** the From header is set to the sender's email
- **AND** the To header contains all recipients
- **AND** the Subject header is set from the draft
- **AND** the Date header is set to current timestamp
- **AND** a unique Message-ID is generated

#### Scenario: Cc and Bcc headers set

- **GIVEN** a draft with Cc and Bcc recipients
- **WHEN** the MIME message is built
- **THEN** the Cc header includes Cc addresses
- **AND** the Bcc header is omitted from final message
- **AND** Bcc recipients are sent separately via RCPT TO

#### Scenario: Reply headers set

- **GIVEN** a draft that is a reply to message "msg123"
- **WHEN** the MIME message is built
- **THEN** the In-Reply-To header is set to "msg123"
- **AND** the References header includes "msg123" and previous IDs
- **AND** threading is preserved

### Requirement: Send Operation

The system SHALL send MIME messages via SMTP and handle the response.

#### Scenario: Send message successfully

- **GIVEN** a valid MIME message ready to send
- **WHEN** the send operation is executed
- **THEN** the message is transmitted via SMTP
- **AND** the SMTP server responds with 250 OK
- **AND** the message is marked as sent
- **AND** the draft is deleted

#### Scenario: Send fails due to network timeout

- **GIVEN** an SMTP connection that times out
- **WHEN** the send operation is executed
- **THEN** a timeout error is caught
- **AND** the operation retries up to 3 times
- **AND** if all retries fail, the error is logged
- **AND** the draft is preserved for retry

#### Scenario: Send fails due to recipient rejection

- **GIVEN** an invalid recipient address
- **WHEN** the SMTP server processes RCPT TO
- **THEN** the server responds with 550 User Unknown
- **AND** the error is logged with the recipient address
- **AND** the send fails with error "Recipient rejected"

### Requirement: Retry Logic

The system SHALL retry failed send operations with exponential backoff.

#### Scenario: First retry after transient error

- **GIVEN** the first send attempt fails with timeout
- **WHEN** the retry logic is triggered
- **THEN** the system waits 1 second
- **AND** retries the send operation
- **AND** logs "Send retry 1/3"

#### Scenario: Second retry with backoff

- **GIVEN** the second send attempt fails
- **WHEN** the retry logic continues
- **THEN** the system waits 2 seconds
- **AND** retries again
- **AND** logs "Send retry 2/3"

#### Scenario: Give up after 3 failures

- **GIVEN** all 3 send attempts have failed
- **WHEN** the retry limit is reached
- **THEN** the send operation fails permanently
- **AND** the error is logged with full details
- **AND** the user is notified of the failure
- **AND** the draft is preserved

### Requirement: Error Handling

The system SHALL handle SMTP errors gracefully and provide clear error messages.

#### Scenario: Server unavailable error

- **GIVEN** the SMTP server is unreachable
- **WHEN** the connection attempt fails
- **THEN** the error "SMTP server unavailable" is logged
- **AND** the user sees "Unable to connect to mail server"
- **AND** the draft is preserved

#### Scenario: Authentication error

- **GIVEN** SMTP credentials are incorrect
- **WHEN** authentication fails
- **THEN** the error "SMTP authentication failed" is logged
- **AND** the user sees "Invalid email server credentials"
- **AND** the draft is preserved

#### Scenario: Message too large error

- **GIVEN** a message exceeding the server's size limit
- **WHEN** the server rejects with 552 Message Size Exceeds Limit
- **THEN** the error is logged with message size
- **AND** the user sees "Message too large (limit: X MB)"
- **AND** the draft is preserved

### Requirement: Sent Folder Storage

The system SHALL store a copy of sent messages in the appropriate sent folder.

#### Scenario: Gmail sent via API stores automatically

- **GIVEN** a Gmail account sending via Gmail API
- **WHEN** the message is sent successfully
- **THEN** Gmail automatically stores a copy in Sent Mail
- **AND** no additional IMAP operation is needed

#### Scenario: IMAP sent message stored in Sent folder

- **GIVEN** an IMAP account sending via SMTP
- **WHEN** the message is sent successfully
- **THEN** the MIME message is uploaded to the IMAP Sent folder via APPEND
- **AND** the \Seen flag is set
- **AND** the Message-ID matches the sent message

#### Scenario: Sent folder does not exist

- **GIVEN** an IMAP account without a Sent folder
- **WHEN** attempting to store sent message
- **THEN** the system creates the Sent folder via CREATE
- **AND** then uploads the message
- **AND** logs "Created Sent folder"

### Requirement: Connection Pooling

The system SHALL reuse SMTP connections when sending multiple messages.

#### Scenario: Send multiple messages with single connection

- **GIVEN** 5 messages queued to send
- **WHEN** the send batch is processed
- **THEN** a single SMTP connection is established
- **AND** all 5 messages are sent over the same connection
- **AND** the connection is closed after the last message

#### Scenario: Connection reuse timeout

- **GIVEN** an idle SMTP connection open for 5 minutes
- **WHEN** a new send operation is requested
- **THEN** the connection is closed
- **AND** a new connection is established
- **AND** the message is sent successfully
