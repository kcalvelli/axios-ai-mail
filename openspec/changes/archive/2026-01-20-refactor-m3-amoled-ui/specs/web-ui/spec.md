# Web UI Specification

## ADDED Requirements

### Requirement: M3 AMOLED Color System
The web UI SHALL implement Material Design 3 color specifications optimized for AMOLED displays.

#### Scenario: True black backgrounds for power efficiency
- **WHEN** rendering the main content area
- **THEN** the background color SHALL be absolute black (`#000000`)

#### Scenario: Navigation drawer surface distinction
- **WHEN** rendering the navigation drawer
- **THEN** the background color SHALL be Surface Container Low (`#121212`)
- **AND** this SHALL create visual hierarchy between navigation and content

#### Scenario: Card surface containment
- **WHEN** rendering email list cards
- **THEN** the background color SHALL be Surface Container (`#1E1E1E`)
- **AND** borders SHALL NOT be used for containment
- **AND** 12px border-radius SHALL be applied
- **AND** 16px internal padding SHALL be applied

---

### Requirement: Navigation Drawer Active Indicator
The navigation drawer SHALL display an M3 Active Indicator Pill for the selected item.

#### Scenario: Selected navigation item styling
- **WHEN** a navigation item is selected (e.g., "Inbox")
- **THEN** a rounded-rectangle pill background SHALL appear behind the icon and text
- **AND** the pill color SHALL use Secondary Container from the tonal palette

#### Scenario: Unselected navigation items
- **WHEN** a navigation item is not selected
- **THEN** no pill background SHALL be visible
- **AND** the item SHALL display with default On-Surface color

---

### Requirement: Stable Content Layout
The content area SHALL maintain consistent left margin regardless of navigation drawer state.

#### Scenario: Drawer open to closed transition
- **WHEN** the navigation drawer transitions from open to closed
- **THEN** the content area left margin SHALL remain at 24dp
- **AND** the "Inbox" header and list items SHALL NOT shift horizontally

#### Scenario: Drawer closed to open transition
- **WHEN** the navigation drawer transitions from closed to open
- **THEN** content alignment SHALL remain stable

---

### Requirement: Email Snippet Sanitization
Email preview snippets SHALL be sanitized to display only plain text.

#### Scenario: HTML email with CSS styles
- **WHEN** an email contains inline CSS (e.g., `.customLink{font-size: 20px...}`)
- **THEN** all HTML tags and CSS SHALL be stripped from the snippet preview
- **AND** only readable plain text content SHALL be displayed

#### Scenario: HTML email with formatting tags
- **WHEN** an email contains HTML tags (`<p>`, `<div>`, `<span>`, etc.)
- **THEN** all tags SHALL be removed
- **AND** text content SHALL be preserved

---

### Requirement: Typography Hierarchy
Email list items SHALL use M3 typography roles to establish visual hierarchy.

#### Scenario: Sender name styling
- **WHEN** rendering the sender name in an email list item
- **THEN** Title Medium typography SHALL be applied (fontWeight: 500)

#### Scenario: Snippet styling
- **WHEN** rendering the email snippet preview
- **THEN** Body Small typography SHALL be applied (fontWeight: 400)
- **AND** color SHALL be On-Surface Variant (`#CAC4D0`)

---

### Requirement: Extended FAB for Compose
The compose action SHALL be presented as an M3 Extended Floating Action Button.

#### Scenario: FAB appearance
- **WHEN** the compose FAB is rendered
- **THEN** it SHALL use Primary Container color
- **AND** it SHALL include an icon and "Compose" label
- **AND** it SHALL have rounded corners per M3 FAB specification

#### Scenario: FAB positioning
- **WHEN** the navigation drawer is visible
- **THEN** the FAB MAY be positioned at the top of the sidebar (above nav items)
- **OR** the FAB MAY float in the bottom-right corner of the viewport

---

### Requirement: App Bar Styling
The top app bar SHALL conform to M3 AMOLED specifications.

#### Scenario: App bar background
- **WHEN** rendering the top app bar
- **THEN** the background color SHALL be absolute black (`#000000`)

#### Scenario: App bar icons
- **WHEN** rendering icons in the app bar
- **THEN** Material Symbols SHALL be used with consistent weight
