# Email Rendering Capability

## ADDED Requirements

### Requirement: Compact Mode HTML Rendering

The EmailContent component MUST support a compact mode that optimizes HTML email rendering for narrow viewports like the reading pane.

#### Scenario: Wide marketing email in compact mode
- **Given** an HTML email with fixed-width tables (600px)
- **When** rendered in compact mode (reading pane)
- **Then** the content fits within the pane without horizontal scrolling
- **And** the content remains readable

#### Scenario: Responsive email triggers mobile styles
- **Given** an HTML email with CSS media queries for mobile
- **When** rendered in compact mode with constrained width
- **Then** the mobile/responsive styles are applied
- **And** the layout adapts to the narrow viewport

#### Scenario: Non-responsive email scaling
- **Given** an HTML email with fixed layout that overflows
- **When** rendered in compact mode
- **Then** the content is scaled down to fit
- **And** a visual indicator shows the content is scaled

### Requirement: Plain Text Preference

Users MUST be able to prefer plain text rendering in compact mode for faster reading.

#### Scenario: User enables plain text preference
- **Given** a user has enabled "Prefer plain text in compact mode"
- **When** viewing an email with both HTML and plain text in the reading pane
- **Then** the plain text version is displayed
- **And** a toggle is available to switch to HTML view

#### Scenario: Email without plain text
- **Given** an email with only HTML content (no plain text)
- **When** viewed in compact mode with plain text preference enabled
- **Then** the HTML content is displayed (graceful fallback)

## MODIFIED Requirements

### Requirement: EmailContent Props Interface

The EmailContent component MUST accept a `compact` prop to enable compact mode rendering.

#### Scenario: Compact prop passed to EmailContent
- **Given** the MessageDetail component in reading pane mode
- **When** rendering EmailContent
- **Then** the compact prop is set to true
- **And** compact-specific styles are applied

#### Scenario: Full-page view remains unchanged
- **Given** the MessageDetailPage (full-page view)
- **When** rendering EmailContent
- **Then** the compact prop is false or undefined
- **And** the existing full-width rendering is preserved
