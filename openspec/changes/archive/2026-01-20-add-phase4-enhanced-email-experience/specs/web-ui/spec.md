# Web UI - Phase 4 Enhancements

## ADDED Requirements

### Requirement: Full-text Search
The web UI SHALL provide full-text search across all synced messages.

#### Scenario: Search by keyword
- **WHEN** user enters "invoice" in search bar
- **THEN** UI displays messages matching "invoice" in subject, from, or body
- **AND** search results are sorted by relevance/date
- **AND** matching terms are highlighted in results

#### Scenario: Search with filters
- **WHEN** user searches "meeting" with filter "account:work"
- **THEN** results include only messages from work account containing "meeting"

#### Scenario: Empty search results
- **WHEN** search returns no matches
- **THEN** UI displays "No messages found" message
- **AND** suggests broadening search criteria

### Requirement: Message Filtering
The web UI SHALL support filtering messages by multiple criteria.

#### Scenario: Filter by account
- **WHEN** user selects account filter "personal"
- **THEN** message list shows only messages from personal account

#### Scenario: Filter by tag
- **WHEN** user clicks tag filter chip "work"
- **THEN** message list shows only messages tagged "work"

#### Scenario: Filter by date range
- **WHEN** user selects "Last 7 days" date filter
- **THEN** message list shows only messages from the past week

#### Scenario: Filter by read status
- **WHEN** user toggles "Unread only" filter
- **THEN** message list shows only unread messages

#### Scenario: Combined filters
- **WHEN** multiple filters are active
- **THEN** filters are combined with AND logic
- **AND** active filters are displayed as removable chips

### Requirement: Folder Navigation
The web UI SHALL display and navigate between email folders.

#### Scenario: Folder sidebar
- **WHEN** viewing inbox page
- **THEN** sidebar displays available folders (Inbox, Sent, Archive, Trash)
- **AND** shows unread count badge on each folder

#### Scenario: Folder selection
- **WHEN** user clicks "Sent" folder in sidebar
- **THEN** message list updates to show sent messages
- **AND** folder is visually highlighted as selected

### Requirement: Message Detail View
The web UI SHALL display full email content when a message is selected.

#### Scenario: View message body
- **WHEN** user clicks on a message in the list
- **THEN** detail view displays full email body
- **AND** shows sender, recipients, date, subject
- **AND** displays tags and classification

#### Scenario: HTML email rendering
- **WHEN** message contains HTML body
- **THEN** HTML is rendered safely (sanitized)
- **AND** user can toggle between HTML and plain text view

#### Scenario: Plain text fallback
- **WHEN** message has no HTML body
- **THEN** plain text body is displayed with preserved formatting

#### Scenario: Loading state
- **WHEN** body is being fetched from server
- **THEN** detail view shows loading indicator
- **AND** previous message content is cleared

### Requirement: Mark as Read on View
The web UI SHALL automatically mark messages as read when viewed.

#### Scenario: Auto-mark as read
- **WHEN** user opens a message in detail view
- **THEN** message is marked as read after 2-second delay
- **AND** server is notified of read status change
- **AND** unread indicator is removed from message list

#### Scenario: Manual mark as read/unread
- **WHEN** user clicks "Mark as unread" action
- **THEN** message is marked as unread
- **AND** unread indicator is restored in message list

### Requirement: Message Deletion
The web UI SHALL support deleting messages individually and in bulk.

#### Scenario: Delete single message
- **WHEN** user clicks delete button on message
- **THEN** confirmation dialog is shown
- **AND** on confirm, message is removed from list
- **AND** server deletion is triggered

#### Scenario: Bulk delete
- **WHEN** user selects multiple messages and clicks "Delete selected"
- **THEN** confirmation shows count of messages to delete
- **AND** on confirm, all selected messages are removed

#### Scenario: Delete with undo
- **WHEN** message is deleted
- **THEN** toast notification shows "Message deleted" with Undo option
- **AND** undo restores message within 5-second window

#### Scenario: Deletion error
- **WHEN** server deletion fails
- **THEN** message is restored to list
- **AND** error notification is displayed
