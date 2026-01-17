# Capability: Email Attachments

## ADDED Requirements

### Requirement: Upload Attachments

The system SHALL allow users to upload files as email attachments during message composition.

#### Scenario: User uploads file via file picker

- **GIVEN** the user is composing a message
- **WHEN** the user clicks "Attach File" button
- **THEN** a file picker dialog opens
- **AND** when a file is selected, it uploads to the server
- **AND** an attachment entry is created in the database
- **AND** the attachment appears in the attachment list

#### Scenario: User uploads file via drag-and-drop

- **GIVEN** the user is composing a message
- **WHEN** the user drags a file onto the attachment drop zone
- **AND** releases the mouse button
- **THEN** the file uploads automatically
- **AND** a progress indicator is displayed
- **AND** the attachment is added to the draft

#### Scenario: Multiple files uploaded simultaneously

- **GIVEN** the user selects 3 files in the file picker
- **WHEN** the user confirms the selection
- **THEN** all 3 files upload concurrently
- **AND** each shows individual progress
- **AND** all 3 appear in the attachment list when complete

#### Scenario: Upload fails due to size limit

- **GIVEN** the user selects a 30MB file
- **AND** the provider limit is 25MB
- **WHEN** the upload is attempted
- **THEN** an error "File exceeds 25MB limit" is displayed
- **AND** the upload is rejected
- **AND** no attachment is created

### Requirement: Remove Attachments

The system SHALL allow users to remove uploaded attachments before sending.

#### Scenario: User removes attachment

- **GIVEN** a draft has 2 attachments
- **WHEN** the user clicks Remove button on the first attachment
- **THEN** the attachment is deleted from the database
- **AND** the attachment disappears from the list
- **AND** only 1 attachment remains

#### Scenario: Remove attachment updates total size

- **GIVEN** a draft has attachments totaling 10MB
- **WHEN** the user removes a 4MB attachment
- **THEN** the total size indicator shows 6MB
- **AND** the size limit validation updates

### Requirement: Download Attachments

The system SHALL enable users to download attachments from received messages.

#### Scenario: User downloads single attachment

- **GIVEN** a message has an attachment "report.pdf"
- **WHEN** the user clicks the Download button
- **THEN** the file downloads to the user's Downloads folder
- **AND** the filename is preserved as "report.pdf"
- **AND** the content type is set correctly for PDF

#### Scenario: User downloads all attachments

- **GIVEN** a message has 3 attachments
- **WHEN** the user clicks "Download All" button
- **THEN** all 3 files download individually
- **OR** a ZIP archive containing all 3 files downloads
- **AND** original filenames are preserved

#### Scenario: Attachment not found on provider

- **GIVEN** an attachment ID that doesn't exist on the provider
- **WHEN** the user clicks Download
- **THEN** an error "Attachment not found" is displayed
- **AND** no download occurs

### Requirement: Inline Image Display

The system SHALL render inline images embedded in HTML message bodies.

#### Scenario: Inline image displayed in message

- **GIVEN** an HTML message with <img src="cid:abc123">
- **AND** the message has an attachment with Content-ID "abc123"
- **WHEN** the message body is rendered
- **THEN** the image is fetched from the attachment
- **AND** the <img> tag displays the image inline
- **AND** the image is not listed in the attachment list

#### Scenario: Inline image fails to load

- **GIVEN** an HTML message references a missing inline image
- **WHEN** the message body is rendered
- **THEN** a placeholder icon is shown
- **AND** the rest of the message renders normally

### Requirement: Attachment Metadata Display

The system SHALL display attachment information including filename, size, and type.

#### Scenario: Attachment list shows metadata

- **GIVEN** a message has an attachment "document.pdf" (1.2 MB)
- **WHEN** the user views the message
- **THEN** the attachment list shows "document.pdf"
- **AND** the size is displayed as "1.2 MB"
- **AND** a PDF icon is shown
- **AND** a download button is available

#### Scenario: File type icon displayed

- **GIVEN** attachments of various types (PDF, DOCX, JPG, ZIP)
- **WHEN** the user views the attachment list
- **THEN** each attachment has an appropriate icon
- **AND** images show thumbnail previews
- **AND** other files show generic type icons

### Requirement: Attachment Size Validation

The system SHALL enforce attachment size limits based on the email provider's restrictions.

#### Scenario: Gmail 25MB limit enforced

- **GIVEN** a Gmail account with 25MB send limit
- **AND** a draft has 20MB of attachments
- **WHEN** the user attempts to add a 10MB file
- **THEN** an error "Total size exceeds 25MB limit" is shown
- **AND** the upload is rejected
- **AND** the existing 20MB of attachments remain

#### Scenario: IMAP provider custom limit

- **GIVEN** an IMAP account configured with 10MB limit
- **AND** the user uploads an 8MB file successfully
- **WHEN** the user attempts to add a 5MB file
- **THEN** an error "Total size exceeds 10MB limit" is shown
- **AND** the upload is rejected

### Requirement: Attachment Content Type Validation

The system SHALL validate attachment content types to prevent security risks.

#### Scenario: Safe file type accepted

- **GIVEN** the user uploads "report.pdf" (application/pdf)
- **WHEN** the upload is processed
- **THEN** the file is accepted
- **AND** stored with content type "application/pdf"

#### Scenario: Executable file rejected

- **GIVEN** the user uploads "virus.exe" (application/x-msdownload)
- **WHEN** the upload is processed
- **THEN** an error "Executable files not allowed" is shown
- **AND** the upload is rejected
- **AND** no attachment is created

#### Scenario: Script file rejected

- **GIVEN** the user uploads "script.js" (application/javascript)
- **WHEN** the upload is processed
- **THEN** an error "Script files not allowed" is shown
- **AND** the upload is rejected

### Requirement: Attachment Persistence

The system SHALL store uploaded attachments in the database until sent or discarded.

#### Scenario: Attachment persists across sessions

- **GIVEN** the user uploads an attachment to a draft
- **AND** closes the browser
- **WHEN** the user reopens the draft later
- **THEN** the attachment is still present
- **AND** can be downloaded or removed

#### Scenario: Attachment deleted when draft discarded

- **GIVEN** a draft has 2 attachments
- **WHEN** the user discards the draft
- **THEN** the draft is deleted from the database
- **AND** both attachments are deleted via CASCADE
- **AND** no orphaned attachment data remains

#### Scenario: Attachment removed after send

- **GIVEN** a draft with attachments is sent successfully
- **WHEN** the draft is converted to a sent message
- **THEN** the draft attachments are deleted
- **AND** the sent message references provider attachment IDs
- **AND** local attachment storage is cleaned up

### Requirement: Attachment Preview

The system SHALL provide preview capabilities for common attachment types.

#### Scenario: Image preview displayed

- **GIVEN** an attachment "photo.jpg" (image/jpeg)
- **WHEN** the user views the attachment list
- **THEN** a thumbnail preview is displayed
- **AND** clicking the thumbnail opens full-size view

#### Scenario: PDF preview (optional)

- **GIVEN** an attachment "document.pdf"
- **WHEN** the user clicks Preview button
- **THEN** the first page of the PDF renders
- **AND** navigation controls allow viewing other pages
- **AND** a Download button is available

#### Scenario: Non-previewable file shows icon

- **GIVEN** an attachment "data.xlsx"
- **WHEN** the user views the attachment list
- **THEN** a generic Excel icon is displayed
- **AND** no preview is available
- **AND** the Download button is prominent
