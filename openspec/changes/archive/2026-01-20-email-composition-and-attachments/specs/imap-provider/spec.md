# Capability: IMAP Provider

## ADDED Requirements

### Requirement: Send Message via SMTP

The IMAP provider SHALL send messages using SMTP with credentials from the account configuration.

#### Scenario: Send message via configured SMTP server

- **GIVEN** IMAP account with SMTP config (host, port, credentials)
- **WHEN** send_message() is called
- **THEN** an SMTP connection is established to the configured server
- **AND** TLS is negotiated if enabled
- **AND** authentication succeeds with username/password
- **AND** the MIME message is sent
- **AND** the message ID is returned

#### Scenario: Store sent message in IMAP Sent folder

- **GIVEN** a message sent successfully via SMTP
- **WHEN** send_message() completes
- **THEN** the MIME message is uploaded to the IMAP Sent folder via APPEND
- **AND** the \Seen flag is set
- **AND** the Message-ID header matches the sent message

#### Scenario: SMTP authentication fails

- **GIVEN** invalid SMTP credentials
- **WHEN** send_message() is called
- **THEN** authentication fails
- **AND** a RuntimeError is raised with "SMTP authentication failed"
- **AND** the error is logged

### Requirement: SMTP Configuration

The IMAP provider SHALL use SMTP settings from the account configuration.

#### Scenario: Load SMTP settings from config

- **GIVEN** an IMAP account with settings:
  - smtp_host: "smtp.fastmail.com"
  - smtp_port: 587
  - smtp_tls: true
  - smtp_username: "user@fastmail.com"
  - smtp_password_file: "/path/to/password"
- **WHEN** the provider is initialized
- **THEN** all SMTP settings are loaded
- **AND** the password is read from the file

#### Scenario: SMTP username defaults to email

- **GIVEN** an IMAP account without explicit smtp_username
- **WHEN** SMTP authentication is performed
- **THEN** the account email is used as the username

#### Scenario: SMTP port defaults to 587

- **GIVEN** an IMAP account without explicit smtp_port
- **WHEN** SMTP connection is established
- **THEN** port 587 is used
- **AND** STARTTLS is attempted

### Requirement: Get Attachment from IMAP

The IMAP provider SHALL extract attachment data from MIME message parts.

#### Scenario: Download attachment from message

- **GIVEN** a message with an attachment in the body
- **WHEN** get_attachment(message_id, attachment_id) is called
- **THEN** the message is fetched via IMAP FETCH
- **AND** the MIME parts are parsed
- **AND** the attachment matching the ID is found
- **AND** the data is decoded (base64 or other)
- **AND** filename, content_type, and binary data are returned

#### Scenario: Attachment identified by Content-ID

- **GIVEN** an inline image with Content-ID "abc123"
- **WHEN** get_attachment(msg, "cid:abc123") is called
- **THEN** the MIME part with matching Content-ID is found
- **AND** the image data is returned

#### Scenario: Attachment identified by filename

- **GIVEN** an attachment with filename "report.pdf"
- **WHEN** get_attachment(msg, "report.pdf") is called
- **THEN** the MIME part with matching filename is found
- **AND** the PDF data is returned

### Requirement: List Message Attachments

The IMAP provider SHALL parse MIME structures to identify all attachments.

#### Scenario: List attachments from multipart message

- **GIVEN** a multipart/mixed message with 3 attachments
- **WHEN** list_attachments(message_id) is called
- **THEN** the message is fetched via IMAP
- **AND** all MIME parts are parsed
- **AND** parts with Content-Disposition: attachment are identified
- **AND** a list of 3 attachment metadata entries is returned

#### Scenario: Extract attachment metadata

- **GIVEN** an attachment MIME part
- **WHEN** metadata is extracted
- **THEN** the filename is parsed from Content-Disposition
- **AND** the content_type is extracted
- **AND** the size is calculated from the encoded data
- **AND** a unique attachment ID is generated

#### Scenario: Inline images included in list

- **GIVEN** a message with inline images (Content-Disposition: inline)
- **WHEN** list_attachments() is called
- **THEN** inline images are included in the list
- **AND** each is marked with is_inline=true

### Requirement: IMAP Sent Folder Management

The IMAP provider SHALL create and manage the Sent folder for storing sent messages.

#### Scenario: Upload sent message to existing Sent folder

- **GIVEN** the IMAP server has a "Sent" folder
- **WHEN** a message is sent successfully
- **THEN** the MIME message is uploaded via APPEND to "Sent"
- **AND** the \Seen flag is set
- **AND** the operation succeeds

#### Scenario: Create Sent folder if missing

- **GIVEN** the IMAP server has no Sent folder
- **WHEN** attempting to store a sent message
- **THEN** the folder "Sent" is created via CREATE command
- **AND** the message is then uploaded
- **AND** the operation succeeds

#### Scenario: Use discovered Sent folder name

- **GIVEN** the IMAP server uses "INBOX.Sent" instead of "Sent"
- **AND** folder discovery has mapped "sent" -> "INBOX.Sent"
- **WHEN** a message is sent
- **THEN** the message is uploaded to "INBOX.Sent"
- **AND** the correct folder is used

### Requirement: MIME Message Parsing

The IMAP provider SHALL parse RFC822 MIME messages to extract parts and attachments.

#### Scenario: Parse simple text message

- **GIVEN** a text/plain message
- **WHEN** the message is parsed
- **THEN** the text body is extracted
- **AND** no attachments are found

#### Scenario: Parse multipart/alternative message

- **GIVEN** a message with text and HTML parts
- **WHEN** the message is parsed
- **THEN** both text and HTML bodies are extracted
- **AND** the HTML is preferred for display

#### Scenario: Parse nested multipart structure

- **GIVEN** a multipart/mixed containing multipart/alternative and attachments
- **WHEN** the message is parsed
- **THEN** the body parts are correctly identified
- **AND** attachments are separated from body
- **AND** the structure is fully decoded

### Requirement: SMTP TLS Support

The IMAP provider SHALL support both STARTTLS and direct TLS connections for SMTP.

#### Scenario: Connect with STARTTLS on port 587

- **GIVEN** SMTP config with port 587 and tls=true
- **WHEN** SMTP connection is established
- **THEN** a plain connection is made to port 587
- **AND** STARTTLS command is issued
- **AND** the connection is upgraded to TLS

#### Scenario: Connect with direct TLS on port 465

- **GIVEN** SMTP config with port 465 and tls=true
- **WHEN** SMTP connection is established
- **THEN** a direct TLS connection is made to port 465
- **AND** no STARTTLS is needed

#### Scenario: Plain connection when TLS disabled

- **GIVEN** SMTP config with tls=false
- **WHEN** SMTP connection is established
- **THEN** a plain unencrypted connection is made
- **AND** a warning is logged about insecure connection
