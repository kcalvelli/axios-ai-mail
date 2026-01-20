# Capability: Bulk Message Operations

## ADDED Requirements

### Requirement: Users SHALL be able to select multiple messages for bulk actions

Users MUST have the ability to select multiple messages from the message list to perform bulk operations (delete, mark read, tag management) efficiently.

#### Scenario: Select individual messages with checkboxes

**Given** the message list is displayed with multiple messages
**When** the user clicks the checkbox next to a message
**Then** the message is visually highlighted as selected
**And** a floating action bar appears at the bottom of the screen
**And** the action bar shows "1 message selected"
**When** the user clicks checkboxes for 3 more messages
**Then** all 4 messages are highlighted
**And** the action bar shows "4 messages selected"

#### Scenario: Select all visible messages

**Given** the message list displays 20 messages
**And** the user has filtered to show only unread messages
**When** the user clicks the "Select All" checkbox in the list header
**Then** all 20 visible messages are selected
**And** all checkboxes are checked
**And** the action bar shows "20 messages selected"
**When** the user clicks "Select All" again
**Then** all messages are deselected
**And** the action bar disappears

#### Scenario: Clear selection

**Given** the user has selected 5 messages
**When** the user clicks "Clear Selection" in the action bar
**Then** all messages are deselected
**And** the action bar disappears
**And** all checkboxes are unchecked

### Requirement: Users SHALL be able to bulk delete selected messages

Once messages are selected, users MUST be able to delete all selected messages with a single action.

#### Scenario: Bulk delete selected messages

**Given** the user has selected 3 messages
**When** the user clicks the "Delete" button (trash icon) in the action bar
**Then** a confirmation dialog appears
**And** the dialog shows "Delete 3 messages?"
**When** the user confirms the deletion
**Then** all 3 messages are immediately removed from the UI (optimistic)
**And** the action bar disappears
**And** a toast notification shows "3 messages deleted"
**And** a DELETE request is sent to the API for each message
**And** the messages are marked as \Deleted in IMAP and expunged

#### Scenario: Bulk delete with partial failure

**Given** the user has selected 5 messages
**And** 2 of those messages have already been deleted on the server
**When** the user bulk deletes the selection
**Then** the UI optimistically removes all 5 messages
**When** the API responds with 3 successful deletions and 2 errors
**Then** the 2 failed messages are re-added to the UI
**And** a toast notification shows "3 of 5 messages deleted. 2 failed."

#### Scenario: Cancel bulk delete

**Given** the user has selected 10 messages
**When** the user clicks the "Delete" button
**And** the confirmation dialog appears
**And** the user clicks "Cancel"
**Then** no messages are deleted
**And** the selection remains active

### Requirement: Users SHALL be able to delete all messages matching current filter

Users MUST have the ability to delete all messages in the current view/filter, not just selected ones.

#### Scenario: Delete all messages in current filter

**Given** the user has filtered messages by tag "newsletter"
**And** there are 47 messages matching this filter
**When** the user clicks the "Delete All" button in the toolbar
**Then** a confirmation dialog appears
**And** the dialog shows "Delete all 47 messages tagged 'newsletter'?"
**And** the dialog displays a checkbox "I understand this cannot be undone"
**When** the user checks the confirmation checkbox
**And** clicks "Delete All"
**Then** all 47 messages are removed from the UI
**And** a progress indicator shows during deletion
**And** a toast notification shows "47 messages deleted"
**And** a POST request is sent to /api/messages/delete-all with filter params

#### Scenario: Delete all with no filter active

**Given** the user is viewing all messages (no filter)
**And** there are 500+ messages in the mailbox
**Then** the "Delete All" button should be disabled or hidden
**Or** if enabled, require extra confirmation steps to prevent accidental deletion

### Requirement: Users SHALL be able to bulk mark messages as read or unread

Selected messages MUST support bulk read/unread status changes.

#### Scenario: Bulk mark as read

**Given** the user has selected 8 unread messages
**When** the user clicks "Mark as Read" in the action bar
**Then** all 8 messages are immediately displayed as read (not bold)
**And** a toast notification shows "8 messages marked as read"
**And** the unread count badge decreases by 8
**And** a POST request to /api/messages/bulk/read is sent
**And** the \Seen flag is set on all messages via IMAP

#### Scenario: Bulk mark as unread

**Given** the user has selected 5 read messages
**When** the user clicks "Mark as Unread" in the action bar
**Then** all 5 messages are immediately displayed as unread (bold)
**And** the unread count badge increases by 5
**And** the \Seen flag is removed via IMAP

### Requirement: Bulk operation APIs SHALL handle partial success gracefully

The backend MUST support bulk operations and return detailed success/failure information.

#### Scenario: Bulk delete API with partial success

**Given** a POST request to /api/messages/bulk/delete with 10 message IDs
**And** 8 messages exist and 2 have already been deleted
**When** the API processes the request
**Then** the response status is 200 OK
**And** the response body includes:
```json
{
  "deleted": 8,
  "total": 10,
  "errors": [
    {"message_id": "msg9", "error": "Not found"},
    {"message_id": "msg10", "error": "Not found"}
  ]
}
```
**And** the 8 existing messages are deleted from database
**And** IMAP STORE +FLAGS (\Deleted) is executed for those messages
**And** IMAP EXPUNGE removes them from server

#### Scenario: Bulk mark read API

**Given** a POST request to /api/messages/bulk/read with:
```json
{
  "message_ids": ["msg1", "msg2", "msg3"],
  "is_unread": false
}
```
**When** the API processes the request
**Then** all 3 messages have is_unread set to false in database
**And** IMAP STORE +FLAGS (\Seen) is executed for all 3
**And** the response includes updated count

### Requirement: Selection state SHALL persist across UI interactions

Users MUST not lose their selection when interacting with other UI elements.

#### Scenario: Selection persists when scrolling

**Given** the user has selected 5 messages
**When** the user scrolls down to view more messages
**Then** the 5 selected messages remain selected
**And** their checkboxes remain checked when scrolled back into view

#### Scenario: Selection cleared after successful bulk action

**Given** the user has selected 10 messages
**When** the user successfully bulk deletes them
**Then** the selection state is cleared
**And** the action bar disappears

## MODIFIED Requirements

None - this is new functionality.

## REMOVED Requirements

None - this is additive functionality.
