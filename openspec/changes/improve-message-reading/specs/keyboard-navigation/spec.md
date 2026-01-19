# Spec: Keyboard Navigation

## ADDED Requirements

### Requirement: Message Navigation
The application SHALL support keyboard navigation between messages.

#### Scenario: Navigate to next message with 'j'
- **Given** the user is viewing the message list or a message detail
- **And** the focus is not in a text input
- **When** the user presses `j` or `ArrowDown`
- **Then** the next message in the list is selected
- **And** if in split view, the reading pane updates to show the new message

#### Scenario: Navigate to previous message with 'k'
- **Given** the user is viewing the message list or a message detail
- **And** the focus is not in a text input
- **When** the user presses `k` or `ArrowUp`
- **Then** the previous message in the list is selected

#### Scenario: Open selected message with Enter
- **Given** a message is selected in the list
- **When** the user presses `Enter`
- **Then** the message detail is opened (or focused in split view)

#### Scenario: Go back with Escape
- **Given** the user is viewing a message detail
- **When** the user presses `Escape`
- **Then** the detail is closed and focus returns to the message list

### Requirement: Message Actions
The application SHALL support keyboard shortcuts for common actions.

#### Scenario: Reply with 'r'
- **Given** a message is selected or open
- **When** the user presses `r`
- **Then** the compose page opens with reply pre-filled

#### Scenario: Forward with 'f'
- **Given** a message is selected or open
- **When** the user presses `f`
- **Then** the compose page opens with forward pre-filled

#### Scenario: Delete with '#' or 'd'
- **Given** a message is selected or open
- **When** the user presses `#` or `d`
- **Then** the message is moved to trash
- **And** the next message is automatically selected

#### Scenario: Toggle read/unread with 'u'
- **Given** a message is selected or open
- **When** the user presses `u`
- **Then** the message's read status is toggled

### Requirement: Thread Navigation
The application SHALL support keyboard navigation within threads.

#### Scenario: Expand/collapse thread with 'o'
- **Given** a thread is selected in the list
- **When** the user presses `o`
- **Then** the thread expands in the reading pane
- **And** pressing `o` again collapses it

#### Scenario: Navigate within thread with 'n'/'p'
- **Given** a thread is expanded with multiple messages
- **When** the user presses `n`
- **Then** focus moves to the next message in the thread
- **When** the user presses `p`
- **Then** focus moves to the previous message in the thread

### Requirement: Help Discovery
The application SHALL provide a keyboard shortcut help modal.

#### Scenario: Open help with '?'
- **Given** the user is anywhere in the application
- **When** the user presses `?`
- **Then** a modal opens showing all available keyboard shortcuts
- **And** shortcuts are grouped by category (Navigation, Actions, Thread)

#### Scenario: Close help modal
- **Given** the keyboard help modal is open
- **When** the user presses `Escape` or clicks outside
- **Then** the modal closes

### Requirement: Input Context Awareness
The application SHALL NOT trigger shortcuts when user is typing.

#### Scenario: Typing in text field
- **Given** the user is focused on a text input or textarea
- **When** the user presses `j`, `k`, `r`, etc.
- **Then** the character is typed into the field
- **And** no navigation or action shortcut is triggered
