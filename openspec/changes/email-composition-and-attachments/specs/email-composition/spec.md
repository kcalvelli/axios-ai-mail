# Capability: Email Composition

## ADDED Requirements

### Requirement: Compose New Message

The system SHALL provide a rich text editor for composing new email messages with HTML formatting support.

#### Scenario: User composes basic message

- **GIVEN** the user is on the compose page
- **WHEN** the user enters "john@example.com" in To field
- **AND** enters "Meeting Tomorrow" as subject
- **AND** types "Let's meet at 2pm" in the editor
- **THEN** the draft is auto-saved to the database
- **AND** the draft contains HTML formatted body
- **AND** a plain text alternative is generated

#### Scenario: User sends composed message

- **GIVEN** a draft exists with all required fields filled
- **WHEN** the user clicks Send button
- **THEN** the message is sent via the account's provider
- **AND** the draft is deleted from drafts folder
- **AND** a copy is saved to the Sent folder
- **AND** a success notification is displayed

#### Scenario: User discards draft

- **GIVEN** a draft exists with unsaved changes
- **WHEN** the user clicks Discard button
- **THEN** a confirmation dialog is displayed
- **AND** when confirmed, the draft is deleted
- **AND** the user is redirected to the inbox

### Requirement: Reply to Message

The system SHALL enable users to reply to existing messages while preserving email thread continuity.

#### Scenario: User replies to message

- **GIVEN** a received message with id "msg123"
- **WHEN** the user clicks Reply button
- **THEN** a new draft is created
- **AND** the To field is populated with original sender
- **AND** the subject is "Re: [original subject]"
- **AND** the original message is quoted with > prefix
- **AND** the In-Reply-To header is set to msg123
- **AND** the thread_id is preserved from the original message

#### Scenario: User replies to all recipients

- **GIVEN** a message sent to multiple recipients
- **WHEN** the user clicks Reply All button
- **THEN** the To field includes the original sender
- **AND** the Cc field includes all original recipients except the user
- **AND** all recipients receive the reply

#### Scenario: Reply preserves thread structure

- **GIVEN** a message that is part of a thread
- **WHEN** the user sends a reply
- **THEN** the References header includes all previous message IDs
- **AND** the reply appears in the same thread in Gmail/webmail
- **AND** the thread_id in the database matches the original

### Requirement: Forward Message

The system SHALL allow users to forward messages to other recipients, including original attachments.

#### Scenario: User forwards message

- **GIVEN** a message with subject "Report" and 2 attachments
- **WHEN** the user clicks Forward button
- **THEN** a new draft is created
- **AND** the subject is "Fwd: Report"
- **AND** the original message is quoted
- **AND** both attachments are copied to the new draft
- **AND** the To field is empty

#### Scenario: Forward preserves formatting

- **GIVEN** an HTML message with inline images
- **WHEN** the user forwards the message
- **THEN** the HTML formatting is preserved in the quote
- **AND** inline images are included as attachments
- **AND** the forwarded message renders correctly

### Requirement: Draft Management

The system SHALL automatically save message drafts and allow users to resume editing them.

#### Scenario: Draft auto-saves during composition

- **GIVEN** the user is composing a message
- **WHEN** the user types content and pauses for 30 seconds
- **THEN** the draft is automatically saved to the database
- **AND** a "Saved" indicator is displayed
- **AND** the updated_at timestamp is refreshed

#### Scenario: User resumes editing draft

- **GIVEN** a saved draft exists with id "draft456"
- **WHEN** the user clicks "Continue editing" from the drafts list
- **THEN** the compose page opens
- **AND** all draft content is loaded (To, Subject, Body, Attachments)
- **AND** the editor cursor is positioned at the end
- **AND** the user can continue editing

#### Scenario: Draft list shows preview

- **GIVEN** multiple drafts exist
- **WHEN** the user opens the Drafts folder
- **THEN** each draft shows subject, recipients, and timestamp
- **AND** drafts are sorted by updated_at DESC
- **AND** unfinished drafts (missing To or Subject) are indicated
- **AND** the user can delete drafts from the list

### Requirement: Rich Text Editing

The system SHALL provide a WYSIWYG editor with HTML formatting capabilities.

#### Scenario: User formats text

- **GIVEN** the user is composing a message
- **WHEN** the user selects text and clicks Bold button
- **THEN** the text is wrapped in <strong> tags
- **AND** the editor displays the text as bold
- **AND** the HTML body includes the formatting

#### Scenario: User inserts link

- **GIVEN** the user has typed "Click here"
- **WHEN** the user selects the text and clicks Link button
- **THEN** a dialog prompts for the URL
- **AND** when submitted, an <a> tag is inserted
- **AND** the link is clickable in the preview

#### Scenario: User toggles plain text mode

- **GIVEN** the user has HTML formatted content
- **WHEN** the user toggles to plain text mode
- **THEN** the editor strips all HTML tags
- **AND** only plain text is displayed
- **AND** formatting is lost when switching back

### Requirement: Recipient Validation

The system SHALL validate email addresses before allowing message send.

#### Scenario: Valid email address accepted

- **GIVEN** the user enters "user@example.com" in To field
- **WHEN** the user blurs the input or presses Enter
- **THEN** the address is accepted and displayed as a chip
- **AND** no validation error is shown

#### Scenario: Invalid email address rejected

- **GIVEN** the user enters "invalid-email" in To field
- **WHEN** the user attempts to send
- **THEN** an error message "Invalid email address" is displayed
- **AND** the send operation is blocked
- **AND** the invalid field is highlighted

#### Scenario: Missing recipients blocked

- **GIVEN** a draft has no recipients in To, Cc, or Bcc
- **WHEN** the user clicks Send
- **THEN** an error "At least one recipient required" is shown
- **AND** the send operation is blocked

### Requirement: Cc and Bcc Support

The system SHALL support carbon copy (Cc) and blind carbon copy (Bcc) recipient fields.

#### Scenario: User adds Cc recipients

- **GIVEN** the user is composing a message
- **WHEN** the user clicks "Cc" toggle
- **THEN** a Cc input field appears
- **AND** recipients added to Cc receive the message
- **AND** all recipients can see Cc addresses

#### Scenario: User adds Bcc recipients

- **GIVEN** the user is composing a message
- **WHEN** the user clicks "Bcc" toggle
- **THEN** a Bcc input field appears
- **AND** recipients added to Bcc receive the message
- **AND** Bcc addresses are hidden from other recipients

#### Scenario: Bcc privacy is enforced

- **GIVEN** a message sent with Bcc recipients
- **WHEN** a To or Cc recipient views the message
- **THEN** Bcc addresses are not visible in headers
- **AND** Bcc recipients are not visible in the UI
