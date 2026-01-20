# Implementation Tasks

## 1. EmailContent Compact Mode Support

### 1.1 Add Compact Prop
- [x] 1.1.1 Add `compact?: boolean` prop to EmailContentProps interface
- [x] 1.1.2 Apply compact-specific font size (14px vs 15px)
- [x] 1.1.3 Apply compact-specific padding/margins

### 1.2 Table Linearization
- [x] 1.2.1 Add CSS to convert tables to block display in compact mode
- [x] 1.2.2 Force table cells to full width in compact mode
- [ ] 1.2.3 Test with common marketing email templates

### 1.3 Container Width Constraint
- [x] 1.3.1 Add maxWidth constraint when compact=true
- [x] 1.3.2 Add overflow: hidden for compact mode
- [ ] 1.3.3 Test that responsive emails trigger mobile media queries

## 2. Overflow Detection and Scaling

### 2.1 Content Measurement
- [x] 2.1.1 Add ref to content container
- [x] 2.1.2 Measure scrollWidth vs clientWidth after render
- [x] 2.1.3 Detect when content overflows by >10%

### 2.2 CSS Transform Scaling
- [x] 2.2.1 Calculate scale factor for overflowing content
- [x] 2.2.2 Apply transform with top-left origin
- [x] 2.2.3 Adjust container width to match scaled content
- [ ] 2.2.4 Add smooth transition for scale changes

### 2.3 Scale Indicator
- [x] 2.3.1 Show small indicator when content is scaled
- [ ] 2.3.2 Add "View full size" button to expand

## 3. Plain Text Preference

### 3.1 User Setting
- [x] 3.1.1 Add `preferPlainTextInCompact` to app store
- [x] 3.1.2 Persist preference to localStorage
- [x] 3.1.3 Add toggle in Settings page (Display tab)

### 3.2 Render Logic
- [x] 3.2.1 Check preference in MessageDetail compact mode
- [x] 3.2.2 Show QuotedText (plain text) when preference enabled
- [x] 3.2.3 Add per-email toggle to switch between HTML/text

## 4. MessageDetail Integration

### 4.1 Pass Compact Context
- [x] 4.1.1 Pass `compact` prop to EmailContent in MessageDetail
- [x] 4.1.2 Pass `compact` prop to EmailContent in MessageDetailPage (kept as false/default)
- [x] 4.1.3 Ensure compact mode activates in ReadingPane split view

### 4.2 Layout Adjustments
- [ ] 4.2.1 Reduce header spacing in compact mode
- [ ] 4.2.2 Inline action buttons in compact mode
- [ ] 4.2.3 Collapse metadata sections in compact mode

## 5. Testing

### 5.1 Visual Testing
- [ ] 5.1.1 Test with wide marketing emails (600px+ tables)
- [ ] 5.1.2 Test with responsive emails (media queries)
- [ ] 5.1.3 Test with plain text emails
- [ ] 5.1.4 Test with image-heavy emails

### 5.2 Cross-Browser
- [ ] 5.2.1 Test container queries in Chrome/Firefox/Safari
- [ ] 5.2.2 Test CSS transform scaling in all browsers
- [ ] 5.2.3 Fallback for older browsers without container query support

## Summary

**Completed:**
- EmailContent compact prop with font size, padding, and margin adjustments
- Table linearization (display: block, width: 100%)
- Overflow detection and CSS transform scaling
- Scale indicator showing percentage
- Plain text preference in app store with localStorage persistence
- Settings page Display tab with preference toggle
- MessageDetail integration passing compact prop
- Per-email HTML/text toggle

**Remaining (optional polish):**
- Testing with various email types
- Cross-browser testing
- Additional layout adjustments (header spacing, collapsed metadata)
- "View full size" button for scaled content
- Smooth transition animations

**Estimated remaining effort:** 2-3 hours for polish and testing
