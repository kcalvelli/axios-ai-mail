# Implementation Tasks

## 0. Critical Defects

### 0.1 Clear Trash Button Not Visible on Mobile
- [x] 0.1.1 Remove `!isMobile` condition from Clear Trash button
- [x] 0.1.2 Move Clear Trash to left side (after Select All area)
- [x] 0.1.3 Add `flexWrap="wrap"` to handle narrow screens

## 1. Reading Pane (Desktop Split View)

### 1.1 Layout Infrastructure
- [x] 1.1.1 Create `ReadingPane` component with resizable split layout
- [x] 1.1.2 Add `layoutMode` state to appStore (`list-only`, `split`, `detail-only`)
- [x] 1.1.3 Add `selectedMessageId` tracking in appStore
- [x] 1.1.4 Persist pane width preference in localStorage (via zustand persist)
- [x] 1.1.5 Add layout toggle button in toolbar

### 1.2 Integration
- [x] 1.2.1 Refactor `InboxPage` to use `ReadingPane` on desktop
- [x] 1.2.2 Extract message detail into reusable `MessageDetail` component
- [x] 1.2.3 Handle empty state (no message selected)
- [x] 1.2.4 Sync selection between list and detail pane

## 2. Keyboard Navigation

### 2.1 Navigation Hook
- [x] 2.1.1 Create `useKeyboardNavigation` hook
- [x] 2.1.2 Implement `j`/`k` for next/previous message
- [x] 2.1.3 Implement arrow key alternatives
- [x] 2.1.4 Implement `Enter` to open, `Escape` to close/go back

### 2.2 Actions
- [x] 2.2.1 Implement `r` for reply
- [x] 2.2.2 Implement `f` for forward
- [x] 2.2.3 Implement `#`/`d` to delete
- [x] 2.2.4 Implement `u` to toggle read/unread

### 2.3 Thread Navigation
- [x] 2.3.1 Implement `o` to expand/collapse thread

### 2.4 Help & Discovery
- [x] 2.4.1 Create keyboard shortcut help modal (`?` to open)
- [x] 2.4.2 Add visual hints for shortcuts in tooltips

## 3. Thread/Conversation View

> **Design Decision**: Threads show contextually in detail view only.
> Thread grouping in message list was removed - it conflicts with tag-centric workflow
> where different messages in a thread may have different tags.

### 3.1 Backend
- [x] 3.1.1 Add thread message fetching via `GET /api/messages?thread_id=...`
- [x] 3.1.2 Return messages sorted by date ascending
- [x] 3.1.3 Include full message body available via body endpoint

### 3.2 Frontend
- [x] 3.2.1 Create `useThreadMessages` hook to fetch thread messages
- [x] 3.2.2 Create `ThreadView` component for detail view
- [x] 3.2.3 Show messages as expandable cards in thread
- [x] 3.2.4 Expand/collapse individual messages in thread
- [x] 3.2.5 Highlight current message, expand latest by default

## 4. Quote Collapsing

### 4.1 Detection
- [x] 4.1.1 Create `detectQuotedText` utility function (in QuotedText.tsx)
- [x] 4.1.2 Implement regex patterns for common quote styles
- [x] 4.1.3 Handle nested quote levels

### 4.2 UI Component
- [x] 4.2.1 Create `QuotedText` component
- [x] 4.2.2 Collapse quoted text by default
- [x] 4.2.3 Add "Show quoted text" toggle (with line count)
- [x] 4.2.4 Style collapsed indicator

### 4.3 Integration
- [x] 4.3.1 Process message body through quote detector
- [x] 4.3.2 HTML quote processing via `processHtmlQuotes`

## 5. Enhanced HTML Rendering

### 5.1 Inline Images (CID)
- [x] 5.1.1 Parse CID references in HTML (`src="cid:..."`)
- [x] 5.1.2 Create endpoint to serve inline attachments (`/api/messages/{id}/body` includes inline_attachments)
- [x] 5.1.3 Replace CID URLs with data URLs in rendered HTML

### 5.2 Remote Image Blocking
- [x] 5.2.1 Detect remote images in sanitized HTML
- [x] 5.2.2 Replace with placeholder by default
- [x] 5.2.3 Add "Load remote images" button
- [x] 5.2.4 Store trusted senders who can always load images
- [x] 5.2.5 "Always trust this sender" option

### 5.3 Dark Mode Adaptation
- [x] 5.3.1 Detect emails with light backgrounds
- [x] 5.3.2 Apply dark mode CSS wrapper
- [x] 5.3.3 Preserve image colors (no inversion)
- [x] 5.3.4 Handle inline styles gracefully

### 5.4 Better Sanitization
- [x] 5.4.1 Review DOMPurify config for allowed tags
- [x] 5.4.2 Allow tables for better email layout
- [x] 5.4.3 Safe sanitization with "Static Jail" pattern

## 6. Sender Info & Avatars

### 6.1 Avatar Component
- [x] 6.1.1 Create `SenderAvatar` component
- [x] 6.1.2 Implement Gravatar URL generation (MD5 hash)
- [x] 6.1.3 Fallback to initials on Gravatar 404
- [x] 6.1.4 Color-coded initials based on email hash

### 6.2 Sender Display
- [x] 6.2.1 Extract sender name from "Name <email>" format
- [x] 6.2.2 Show name prominently, email as secondary
- [x] 6.2.3 Add avatar to message cards
- [x] 6.2.4 Add avatar to message detail header

## 7. Mobile Reading Improvements

### 7.1 Layout
- [x] 7.1.1 Full-width message body on mobile (reduce padding)
- [x] 7.1.2 Sticky header with actions while scrolling

### 7.2 Gestures
- [x] 7.2.1 Swipe left/right on message cards for quick actions

## 8. Print & Export

### 8.1 Print Support
- [x] 8.1.1 Create print-specific CSS stylesheet
- [x] 8.1.2 Add "Print" button to message detail
- [x] 8.1.3 Hide UI chrome in print view
- [x] 8.1.4 Include message headers in print

### 8.2 Export
- [x] 8.2.1 "Save as PDF" via browser print dialog

---

## Summary

**Completed:** 56/56 tasks (100%) ✅

All tasks in this proposal have been completed.

### Removed from Scope:
- **Archive functionality** - doesn't exist in tag-centric workflow
- **Thread grouping in list** - conflicts with tag-based organization
- **Contact card popover** - polish feature, not essential
- **Advanced mobile gestures** - swipe next/prev in detail, pull-to-close
- **Export as plain text** - print/PDF covers the use case
