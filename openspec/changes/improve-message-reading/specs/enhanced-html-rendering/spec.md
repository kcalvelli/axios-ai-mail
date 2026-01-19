# Spec: Enhanced HTML Rendering

## ADDED Requirements

### Requirement: Inline Image Support (CID)
The application SHALL display inline/embedded images in HTML emails.

#### Scenario: Email with CID-referenced image
- **Given** an email contains HTML with `<img src="cid:image001">`
- **And** the email has an attachment with Content-ID `image001`
- **When** the message body is rendered
- **Then** the image is displayed inline at the correct position
- **And** the image loads from an API endpoint

### Requirement: Remote Image Blocking
The application SHALL block remote images by default for privacy/security.

#### Scenario: Email with remote images (blocked)
- **Given** an email contains `<img src="https://tracker.example.com/pixel.gif">`
- **And** remote images are blocked (default)
- **When** the message body is rendered
- **Then** a placeholder is shown instead of the image
- **And** a banner appears: "Remote images blocked. [Load images]"

#### Scenario: User loads remote images
- **Given** remote images are blocked in the current email
- **When** the user clicks "Load images"
- **Then** all remote images in that email are loaded and displayed
- **And** the banner is dismissed

#### Scenario: Trust sender for images
- **Given** remote images are blocked
- **When** the user clicks "Always load images from this sender"
- **Then** images are loaded for this email
- **And** the sender is added to the trusted list
- **And** future emails from this sender load images automatically

### Requirement: Dark Mode Adaptation
The application SHALL adapt email content for dark mode readability.

#### Scenario: Light-background email in dark mode
- **Given** the application is in dark mode (AMOLED theme)
- **And** an email has white/light background with dark text
- **When** the message body is rendered
- **Then** the email background is adapted to dark (e.g., #1a1a1a)
- **And** text colors are adjusted for readability
- **And** images are NOT color-inverted

#### Scenario: Already dark email in dark mode
- **Given** the application is in dark mode
- **And** an email already has dark styling
- **When** the message body is rendered
- **Then** no additional color transformation is applied

### Requirement: Quote Collapsing
The application SHALL collapse quoted text in email replies.

#### Scenario: Email with quoted reply
- **Given** an email contains quoted text (lines starting with `>` or "On ... wrote:")
- **When** the message body is rendered
- **Then** the quoted portion is collapsed by default
- **And** a toggle shows "[Show quoted text (5 lines)]"

#### Scenario: User expands quoted text
- **Given** quoted text is collapsed
- **When** the user clicks the expand toggle
- **Then** the quoted text is revealed inline
- **And** the toggle changes to "[Hide quoted text]"

### Requirement: Table Support
The application SHALL render HTML tables in emails.

#### Scenario: Email with data table
- **Given** an email contains an HTML `<table>` element
- **When** the message body is rendered
- **Then** the table is displayed with proper formatting
- **And** the table is responsive (horizontal scroll on mobile if needed)

## MODIFIED Requirements

### Requirement: Sanitization Updates
The HTML sanitizer SHALL allow additional safe elements for better rendering.

#### Scenario: Allowed HTML elements
- **Given** an email with various HTML elements
- **When** sanitized for display
- **Then** the following elements are preserved:
  - Text: `p`, `br`, `span`, `div`, `h1-h6`
  - Formatting: `strong`, `em`, `u`, `s`, `b`, `i`
  - Lists: `ul`, `ol`, `li`
  - Links: `a` (with `href`, `target`)
  - Tables: `table`, `tr`, `td`, `th`, `thead`, `tbody`
  - Quotes: `blockquote`
  - Code: `pre`, `code`
  - Images: `img` (processed for CID/remote blocking)
