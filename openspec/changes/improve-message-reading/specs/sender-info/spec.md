# Spec: Sender Info & Avatars

## ADDED Requirements

### Requirement: Sender Avatars
The application SHALL display avatars for email senders.

#### Scenario: Sender with Gravatar
- **Given** a sender email has a registered Gravatar
- **When** the message is displayed (list or detail)
- **Then** their Gravatar image is shown as the avatar
- **And** the avatar is circular, 40px on desktop, 32px on mobile

#### Scenario: Sender without Gravatar
- **Given** a sender email has no Gravatar
- **When** the message is displayed
- **Then** a fallback avatar with initials is shown
- **And** the initials are extracted from the sender name (or first letter of email)
- **And** the background color is deterministic based on email hash

### Requirement: Sender Name Extraction
The application SHALL extract and display sender names prominently.

#### Scenario: Email with display name
- **Given** a sender is "John Smith <john@example.com>"
- **When** the message is displayed
- **Then** "John Smith" is shown as the primary sender identifier
- **And** "john@example.com" is available on hover/click or as secondary text

#### Scenario: Email without display name
- **Given** a sender is just "john@example.com"
- **When** the message is displayed
- **Then** "john@example.com" is shown as the sender
- **And** initials are derived from "john" -> "J"

### Requirement: Avatar in Message List
The application SHALL show sender avatars in the message list.

#### Scenario: Message card with avatar
- **Given** messages are displayed in the list
- **When** the user views the list
- **Then** each message card shows the sender's avatar on the left
- **And** the avatar is sized appropriately (32px on mobile, 40px on desktop)
- **And** for threads, the avatars of participants are stacked/overlapped

### Requirement: Avatar in Message Detail
The application SHALL show sender avatar in the message detail header.

#### Scenario: Message detail header
- **Given** the user is viewing a message detail
- **When** the header is displayed
- **Then** the sender's avatar appears next to their name
- **And** clicking the avatar/name could show a contact card (future enhancement)

### Requirement: Contact Card (Optional Enhancement)
The application SHALL provide a contact card popover for senders.

#### Scenario: View sender contact card
- **Given** the user is viewing a message
- **When** the user clicks on the sender's name or avatar
- **Then** a popover appears with:
  - Larger avatar
  - Full name and email
  - "View all messages from this sender" link
  - "Copy email" button
