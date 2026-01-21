# Spec: Mobile Reading Improvements

## ADDED Requirements

### Requirement: Full-Width Content
The application SHALL maximize content width on mobile devices.

#### Scenario: Reading email on mobile
- **Given** the user is on a mobile device (viewport < 600px)
- **When** viewing a message detail
- **Then** the message body uses full viewport width
- **And** horizontal padding is minimized (8-12px max)
- **And** the email content is readable without horizontal scrolling

### Requirement: Sticky Action Header
The application SHALL keep message actions accessible while scrolling.

#### Scenario: Scrolling through long email
- **Given** the user is reading a long email on mobile
- **When** the user scrolls down
- **Then** a compact header with key actions remains visible at top
- **And** the header shows: Back button, Reply, Delete
- **And** the header has a subtle background for readability

#### Scenario: Scroll direction header behavior
- **Given** the user is reading an email on mobile
- **When** the user scrolls down
- **Then** the header slides up (hides) to maximize reading space
- **When** the user scrolls up
- **Then** the header slides back into view

### Requirement: Swipe Navigation Between Messages
The application SHALL support swipe gestures to navigate between messages.

#### Scenario: Swipe to next message
- **Given** the user is viewing a message detail on mobile
- **When** the user swipes left
- **Then** the view animates to the next message in the list
- **And** a visual indicator shows the swipe direction during gesture

#### Scenario: Swipe to previous message
- **Given** the user is viewing a message detail on mobile
- **When** the user swipes right
- **Then** the view animates to the previous message in the list

#### Scenario: No next/previous message
- **Given** the user is at the first or last message
- **When** the user swipes in the unavailable direction
- **Then** a subtle bounce/resistance effect indicates the boundary
- **And** no navigation occurs

### Requirement: Bottom Action Sheet
The application SHALL provide a bottom sheet for secondary actions on mobile.

#### Scenario: Access more actions
- **Given** the user is viewing a message on mobile
- **When** the user taps the "More" button (or long-presses)
- **Then** a bottom sheet slides up with additional actions:
  - Mark as unread
  - Move to folder
  - Print
  - Copy message text
  - View headers

### Requirement: Pull to Close
The application SHALL support pull-down gesture to close message detail.

#### Scenario: Pull down to return to list
- **Given** the user is viewing a message detail on mobile
- **And** the scroll position is at the top
- **When** the user pulls down beyond the top
- **Then** the detail view dismisses with animation
- **And** the user returns to the message list
