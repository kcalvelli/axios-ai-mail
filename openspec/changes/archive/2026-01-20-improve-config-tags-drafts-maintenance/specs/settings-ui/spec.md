# Settings UI Specification

## ADDED Requirements

### Requirement: Maintenance Tools Panel

The system SHALL provide a maintenance tools panel in the Settings page for administrative operations.

#### Scenario: Maintenance tab visible in settings
- **WHEN** user navigates to Settings page
- **THEN** a "Maintenance" tab is available alongside existing tabs
- **AND** the tab shows a wrench/tools icon

#### Scenario: Maintenance panel shows available operations
- **WHEN** user selects the Maintenance tab
- **THEN** available maintenance operations are listed
- **AND** each operation has a description explaining its purpose
- **AND** operations are grouped by category (Classification, Statistics)

### Requirement: Reclassify All Messages Operation

The system SHALL provide an operation to reclassify all messages using the current AI model and tag taxonomy.

#### Scenario: User initiates reclassify all
- **WHEN** user clicks "Reclassify All Messages"
- **THEN** a confirmation dialog is shown
- **AND** the dialog explains the operation will update all message tags
- **AND** the dialog shows estimated time based on message count

#### Scenario: Reclassification shows progress
- **WHEN** reclassification is in progress
- **THEN** a progress indicator shows messages processed / total
- **AND** the operation can be cancelled
- **AND** UI remains responsive

#### Scenario: Reclassification completes
- **WHEN** reclassification finishes
- **THEN** a summary is shown (X messages reclassified, Y errors)
- **AND** tag statistics are automatically refreshed

#### Scenario: Reclassification is non-destructive
- **WHEN** reclassification runs
- **THEN** original messages are not deleted
- **AND** classification history is preserved (feedback records)
- **AND** user-edited tags are noted as overridden

### Requirement: Reclassify Unclassified Messages Operation

The system SHALL provide an operation to classify only messages that have no classification.

#### Scenario: User initiates reclassify unclassified
- **WHEN** user clicks "Reclassify Unclassified Only"
- **THEN** only messages without existing classification are processed
- **AND** messages with user-edited tags are skipped
- **AND** progress shows unclassified count

#### Scenario: No unclassified messages
- **WHEN** all messages have classifications
- **THEN** the operation completes immediately
- **AND** message shows "All messages already classified"

### Requirement: Refresh Statistics Operation

The system SHALL provide an operation to recalculate tag statistics.

#### Scenario: User refreshes statistics
- **WHEN** user clicks "Refresh Statistics"
- **THEN** tag counts are recalculated from current classifications
- **AND** the dashboard statistics are updated
- **AND** operation completes quickly (database query only)

### Requirement: Operation History Display

The system SHALL display the history of maintenance operations.

#### Scenario: Last operation shown
- **WHEN** user views the Maintenance panel
- **THEN** the last maintenance operation is shown
- **AND** timestamp and result are displayed
- **AND** if no operations have run, "No recent operations" is shown

#### Scenario: Operation in progress indicator
- **WHEN** a maintenance operation is running
- **THEN** the panel shows "Operation in progress"
- **AND** other operations are disabled until completion

### Requirement: Safe Operations Only

The system SHALL only expose non-destructive maintenance operations in the UI.

#### Scenario: No delete operations available
- **WHEN** user views the Maintenance panel
- **THEN** no operations that permanently delete data are shown
- **AND** operations only update metadata (tags, statistics)

#### Scenario: Operations preserve user edits
- **WHEN** reclassification runs on a message with user-edited tags
- **THEN** the user's tag edits are preserved
- **OR** the system prompts whether to override user edits

## MODIFIED Requirements

### Requirement: Tag Taxonomy Display

The tag taxonomy panel SHALL display the active tag taxonomy from configuration.

#### Scenario: Shows combined default and custom tags
- **WHEN** user views Tag Taxonomy panel
- **AND** `useDefaultTags = true`
- **THEN** default tags are shown with a "Default" badge
- **AND** custom user tags are shown with a "Custom" badge
- **AND** excluded tags are not shown

#### Scenario: Shows only custom tags when defaults disabled
- **WHEN** user views Tag Taxonomy panel
- **AND** `useDefaultTags = false`
- **THEN** only user-defined tags from `ai.tags` are shown
- **AND** a note explains defaults are disabled
