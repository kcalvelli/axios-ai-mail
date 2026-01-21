# Spec: Reading Pane

## ADDED Requirements

### Requirement: Split View Layout
The application SHALL provide a split view layout on desktop that displays the message list and message detail side-by-side.

#### Scenario: User views inbox in split mode
- **Given** the user is on a desktop device (viewport > 900px)
- **When** split view is enabled (default on desktop)
- **Then** the message list appears on the left (40% width by default)
- **And** the reading pane appears on the right (60% width by default)
- **And** a resizable divider separates the two panes

#### Scenario: User resizes the pane divider
- **Given** the user is viewing the split layout
- **When** the user drags the divider
- **Then** the pane widths adjust accordingly
- **And** the new width is persisted to localStorage

### Requirement: Layout Mode Toggle
The application SHALL allow users to toggle between layout modes.

#### Scenario: User switches from split to list-only
- **Given** the user is in split view mode
- **When** the user clicks the layout toggle button
- **Then** the reading pane is hidden
- **And** the message list takes full width
- **And** clicking a message navigates to a full-page detail view

#### Scenario: User switches from list-only to split
- **Given** the user is in list-only mode
- **When** the user clicks the layout toggle button
- **Then** the split view is restored
- **And** the previously selected message (if any) is shown in the reading pane

### Requirement: Message Selection State
The application SHALL track the selected message in the URL for deep linking.

#### Scenario: User selects a message
- **Given** the user is viewing the message list
- **When** the user clicks on a message
- **Then** the URL updates to include the message ID (e.g., `/inbox?selected=abc123`)
- **And** the message detail loads in the reading pane (split mode) or navigates to detail page (list-only mode)

#### Scenario: User shares a message link
- **Given** a URL with a selected message ID
- **When** another user opens that URL
- **Then** the application opens in split view with that message selected

### Requirement: Empty State
The application SHALL display a helpful empty state when no message is selected.

#### Scenario: No message selected in split view
- **Given** the user is in split view mode
- **And** no message is selected
- **When** the reading pane is displayed
- **Then** it shows a placeholder message (e.g., "Select a message to read")
- **And** optionally shows keyboard shortcut hints
