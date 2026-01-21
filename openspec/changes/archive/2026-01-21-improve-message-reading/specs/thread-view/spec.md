# Spec: Thread/Conversation View

## ADDED Requirements

### Requirement: Thread Grouping
The application SHALL group messages by thread_id in the message list.

#### Scenario: Messages with same thread_id
- **Given** multiple messages exist with the same thread_id
- **When** the user views the message list
- **Then** those messages are grouped as a single thread entry
- **And** the thread entry shows: latest subject, participant count, message count, most recent date
- **And** an unread indicator if any message in thread is unread

#### Scenario: Single message without thread
- **Given** a message has no thread_id or is the only message in its thread
- **When** the user views the message list
- **Then** it displays as a regular message card (not a thread)

### Requirement: Thread Expansion
The application SHALL allow users to expand a thread to see all messages.

#### Scenario: User expands a thread
- **Given** a thread with 5 messages is displayed in the list
- **When** the user clicks on the thread
- **Then** the thread view opens in the reading pane (or detail page)
- **And** all 5 messages are displayed in chronological order
- **And** each message can be individually expanded/collapsed

#### Scenario: User collapses a message in thread
- **Given** the user is viewing an expanded thread
- **When** the user clicks the collapse button on a message
- **Then** only the message header (sender, date) is shown
- **And** the body is hidden
- **And** clicking again expands the message

### Requirement: Thread API
The API SHALL provide an endpoint to fetch all messages in a thread.

#### Scenario: Fetch thread messages
- **Given** a thread_id exists with multiple messages
- **When** `GET /api/threads/{thread_id}/messages` is called
- **Then** all messages with that thread_id are returned
- **And** messages are sorted by date ascending (oldest first)
- **And** full message body is included

### Requirement: Thread Actions
The application SHALL provide bulk actions for entire threads.

#### Scenario: Mark thread as read
- **Given** a thread with 3 unread messages
- **When** the user clicks "Mark thread as read"
- **Then** all 3 messages are marked as read
- **And** the thread unread indicator is removed

#### Scenario: Delete thread
- **Given** a thread with 5 messages
- **When** the user clicks "Delete thread"
- **Then** all 5 messages are moved to trash
- **And** the thread is removed from the list

### Requirement: Thread Visual Design
The application SHALL display threads with clear visual hierarchy.

#### Scenario: Thread message bubbles
- **Given** the user is viewing a thread
- **Then** each message appears as a distinct bubble/card
- **And** a visual connector (line/timeline) links messages
- **And** the user's own messages are visually distinguished (e.g., aligned right or different color)
- **And** sender avatars appear next to each message
