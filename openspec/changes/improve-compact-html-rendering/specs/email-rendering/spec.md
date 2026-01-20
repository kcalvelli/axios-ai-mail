# Email Rendering Capability

## ADDED Requirements

### Requirement: Safe HTML Processing (All Views)

The EmailContent component MUST process HTML safely before rendering, handling edge cases that cause browser errors or privacy issues.

#### Scenario: Tracking pixel removal
- **Given** an HTML email with tracking pixels (1x1 images, known tracking domains)
- **When** rendered in EmailContent
- **Then** tracking pixels are stripped from the HTML
- **And** rendering performance is not impacted by hidden images

#### Scenario: Remote image blocking
- **Given** an HTML email with remote images (http/https URLs)
- **When** rendered in EmailContent with default settings
- **Then** remote images are replaced with placeholders
- **And** user can click "Load Images" to show them
- **And** no privacy-leaking requests are made without consent

### Requirement: Inline Image (cid:) Handling

The EmailContent component MUST handle `cid:` URLs gracefully. These URLs reference Content-ID headers in multipart MIME emails for inline/embedded images.

#### Scenario: cid: URL placeholder (current)
- **Given** an HTML email with inline images using cid: URLs
- **When** rendered in EmailContent
- **Then** cid: URLs are replaced with placeholder images
- **And** no browser console errors occur (ERR_UNKNOWN_URL_SCHEME)

#### Scenario: cid: URL resolution (future enhancement)
- **Given** an HTML email with inline images using cid: URLs
- **And** the message body API returns inline attachment data
- **When** rendered in EmailContent
- **Then** cid: URLs are resolved to actual image data URLs
- **And** inline images display correctly

**Implementation Notes:**
- Current: `replaceCidUrls()` replaces cid: with SVG placeholder
- Future: API returns `inline_attachments: [{cid: string, data_url: string}]`
- Future: `replaceCidUrls()` maps cid references to data URLs from API

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
