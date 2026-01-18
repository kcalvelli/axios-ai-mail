# Web UI Capability Delta

## ADDED Requirements

### Requirement: Layout is responsive and mobile-friendly

The application MUST adapt its layout based on screen size to provide an optimal experience on all devices.

#### Scenario: Mobile sidebar is temporary overlay
Given: The user is viewing the application on a screen less than 900px wide
When: The sidebar is opened
Then: The sidebar appears as a temporary overlay with a scrim backdrop
And: The content area remains at full width behind the sidebar

#### Scenario: Mobile sidebar closes on navigation
Given: The user has the sidebar open on a mobile device
When: They tap on a navigation item (Inbox, Drafts, Settings, etc.)
Then: The sidebar automatically closes
And: The user is navigated to the selected destination

#### Scenario: Mobile sidebar closes on scrim tap
Given: The user has the sidebar open on a mobile device
When: They tap on the scrim (darkened area beside sidebar)
Then: The sidebar closes

#### Scenario: Desktop sidebar is persistent
Given: The user is viewing the application on a screen 900px or wider
When: The sidebar is open
Then: The sidebar pushes the content area (not overlays)
And: Clicking navigation items does not close the sidebar

#### Scenario: Content uses full width on mobile
Given: The user is viewing the application on a mobile device
When: The sidebar is closed
Then: The content area uses 100% of the screen width

#### Scenario: Layout transitions smoothly on resize
Given: The user resizes their browser window
When: The width crosses the 900px breakpoint
Then: The layout transitions smoothly between mobile and desktop modes

### Requirement: Message cards adapt to mobile screens

Message cards MUST display in a compact format on mobile devices.

#### Scenario: Mobile message cards hide checkbox
Given: The user is viewing the message list on a mobile device
When: Message cards are displayed
Then: The checkbox is hidden (swipe gestures provide actions instead)

#### Scenario: Mobile message cards have reduced padding
Given: The user is viewing the message list on a mobile device
When: Message cards are displayed
Then: Padding is reduced to show more content per screen

#### Scenario: Mobile message cards truncate content
Given: The user is viewing the message list on a mobile device
When: Message cards are displayed
Then: The snippet is truncated to 1 line (instead of 2)

### Requirement: Message cards support swipe gestures on touch devices

On touch-capable devices, message cards MUST support swipe gestures for quick actions.

#### Scenario: Swipe left to delete
Given: The user is viewing the message list on a touch device
When: They swipe left on a message card past the 40% threshold
Then: The message is moved to trash
And: A toast is shown with an Undo action

#### Scenario: Swipe right to reply
Given: The user is viewing the message list on a touch device
When: They swipe right on a message card past the 40% threshold
Then: They are navigated to the compose page with reply context pre-filled

#### Scenario: Partial swipe cancels
Given: The user begins swiping a message card
When: They release before reaching the 40% threshold
Then: The card snaps back to its original position
And: No action is taken

#### Scenario: Swipe reveals action background
Given: The user is swiping a message card
When: The swipe is in progress
Then: A colored background is revealed behind the card
And: The background shows the action icon (trash for left, reply for right)

#### Scenario: Haptic feedback on swipe completion
Given: The user is swiping a message card on a device that supports haptic feedback
When: The swipe passes the action threshold
Then: A brief haptic vibration is triggered

#### Scenario: Swipe disabled on desktop
Given: The user is viewing the message list on a desktop (non-touch) device
When: They attempt to interact with message cards
Then: No swipe gestures are available
And: Normal click behavior is preserved

#### Scenario: Swipe disabled during selection mode
Given: The user has one or more messages selected via checkbox
When: They attempt to swipe a message
Then: Swipe is disabled to prevent conflicts with bulk operations

### Requirement: Swipe delete is undoable

When a message is deleted via swipe, the action MUST be undoable via toast.

#### Scenario: Undo appears after swipe delete
Given: A message was deleted via swipe left
When: The deletion completes
Then: A toast appears with message "Moved to trash" and an Undo button

#### Scenario: Undo restores message
Given: The undo toast is displayed after swipe delete
When: The user clicks Undo
Then: The message is restored to inbox
And: The toast is dismissed

#### Scenario: Toast auto-dismisses
Given: The undo toast is displayed
When: 5 seconds pass without user interaction
Then: The toast is automatically dismissed

### Requirement: Swipe actions respect offline state

Swipe actions MUST handle offline state gracefully.

#### Scenario: Swipe delete while offline
Given: The user is offline
When: They swipe left to delete a message
Then: A warning toast is shown about offline status
And: The action is prevented or queued

### Requirement: Inbox displays unread count badge

The Inbox folder item in the sidebar MUST display a badge showing the count of unread messages.

#### Scenario: Unread count badge displayed
Given: There are 5 unread messages in the inbox
When: The user views the sidebar
Then: The Inbox item shows a badge with "5"

#### Scenario: Large unread count display
Given: There are more than 99 unread messages
When: The user views the sidebar
Then: The badge shows "99+" to prevent overflow

#### Scenario: Zero unread count hides badge
Given: All messages in the inbox are read
When: The user views the sidebar
Then: No badge is displayed on the Inbox item

#### Scenario: Badge updates when marking read
Given: The unread count badge shows "5"
When: The user marks a message as read
Then: The badge updates to show "4"

#### Scenario: Badge updates when marking unread
Given: The unread count badge shows "4"
When: The user marks a message as unread
Then: The badge updates to show "5"

#### Scenario: Badge updates after sync
Given: New messages arrive via sync
When: The sync completes
Then: The unread count badge reflects the new total

### Requirement: Touch targets meet accessibility standards

All interactive elements MUST have touch targets of at least 44x44 pixels on touch devices.

#### Scenario: Buttons have adequate touch targets
Given: The user is on a touch device
When: They interact with buttons in the interface
Then: All buttons have at least 44x44 pixel touch targets

#### Scenario: Menu items have adequate touch targets
Given: The user is on a touch device
When: They interact with menu items in the sidebar
Then: All menu items have at least 44x44 pixel touch targets

## MODIFIED Requirements

### Requirement: Drafts badge consistency

The Drafts folder item displays a count badge. The Inbox unread badge MUST use the same styling.

#### Scenario: Badge styling is consistent
Given: Both Drafts and Inbox have counts to display
When: The user views the sidebar
Then: Both badges use the same size, color, and position
