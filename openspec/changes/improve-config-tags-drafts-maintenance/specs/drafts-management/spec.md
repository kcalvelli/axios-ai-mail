# Drafts Management Specification

## ADDED Requirements

### Requirement: Explicit Draft Save Action

The system SHALL provide an explicit "Save Draft" action in the compose interface.

#### Scenario: User clicks Save Draft
- **WHEN** user clicks the "Save Draft" button
- **THEN** the current compose state is saved to the database
- **AND** a success confirmation is shown
- **AND** the draft ID is preserved for subsequent saves

#### Scenario: Save Draft with empty required fields
- **WHEN** user clicks "Save Draft" without a recipient or subject
- **THEN** the draft is saved anyway (partial drafts allowed)
- **AND** the user can resume and complete it later

#### Scenario: Save Draft updates existing draft
- **WHEN** user has an existing draft open (from drafts page or previous save)
- **AND** user clicks "Save Draft"
- **THEN** the existing draft is updated (not duplicated)
- **AND** the `updated_at` timestamp is refreshed

### Requirement: Draft Auto-Save

The system SHALL automatically save drafts to prevent data loss.

#### Scenario: Auto-save triggers on content change
- **WHEN** user has typed content in the compose editor
- **AND** 30 seconds have elapsed since the last change
- **THEN** the system automatically saves the draft
- **AND** a subtle "Saved" indicator is shown

#### Scenario: Auto-save requires minimum content
- **WHEN** user has not entered any content (blank compose)
- **THEN** auto-save does not create an empty draft
- **AND** no draft is saved until content is added

#### Scenario: Auto-save shows status
- **WHEN** auto-save is in progress
- **THEN** a "Saving..." indicator is shown
- **WHEN** auto-save completes
- **THEN** indicator changes to "Saved" with timestamp

### Requirement: Unsaved Changes Protection

The system SHALL warn users before losing unsaved changes.

#### Scenario: Close compose with unsaved changes
- **WHEN** user attempts to close or navigate away from compose
- **AND** there are unsaved changes since last save
- **THEN** a confirmation dialog is shown
- **AND** options include "Save Draft", "Discard", and "Cancel"

#### Scenario: No warning when no changes
- **WHEN** user attempts to close compose
- **AND** content matches the last saved state
- **THEN** no confirmation dialog is shown
- **AND** compose closes immediately

#### Scenario: Discard changes option
- **WHEN** user selects "Discard" in the confirmation dialog
- **THEN** unsaved changes are lost
- **AND** compose closes without saving
- **AND** existing draft (if any) remains unchanged

### Requirement: Draft Count in Sidebar

The system SHALL display the number of drafts in the navigation sidebar.

#### Scenario: Drafts folder shows count badge
- **WHEN** user has saved drafts
- **THEN** the Drafts navigation item shows a count badge
- **AND** the count updates when drafts are created or deleted

#### Scenario: No badge when no drafts
- **WHEN** user has zero drafts
- **THEN** no count badge is shown on Drafts item

### Requirement: Resume Draft Composition

The system SHALL allow users to resume editing saved drafts.

#### Scenario: Open draft from drafts page
- **WHEN** user clicks on a draft in the drafts list
- **THEN** the compose page opens with draft content loaded
- **AND** all fields are populated (to, cc, bcc, subject, body)
- **AND** attachments are preserved and shown

#### Scenario: Draft marks as being edited
- **WHEN** user opens a draft for editing
- **THEN** subsequent auto-saves update the same draft
- **AND** no duplicate drafts are created

#### Scenario: Send removes draft
- **WHEN** user sends a message that was loaded from a draft
- **THEN** the draft is deleted from the database
- **AND** the sent message appears in the Sent folder
