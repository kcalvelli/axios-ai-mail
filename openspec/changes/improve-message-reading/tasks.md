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
- [ ] 2.2.3 Implement `e` to archive (mark read + move)
- [x] 2.2.4 Implement `#`/`d` to delete
- [x] 2.2.5 Implement `u` to toggle read/unread
- [ ] 2.2.6 Implement `s` to star/unstar (future)

### 2.3 Thread Navigation
- [x] 2.3.1 Implement `o` to expand/collapse thread
- [ ] 2.3.2 Implement `n`/`p` to move within thread messages

### 2.4 Help & Discovery
- [x] 2.4.1 Create keyboard shortcut help modal (`?` to open)
- [x] 2.4.2 Add visual hints for shortcuts in tooltips

## 3. Thread/Conversation View

### 3.1 Backend
- [x] 3.1.1 Add thread message fetching via `GET /api/messages?thread_id=...`
- [x] 3.1.2 Return messages sorted by date ascending
- [x] 3.1.3 Include full message body available via body endpoint

### 3.2 Frontend Data
- [x] 3.2.1 Create `useThreadMessages` hook to fetch thread messages
- [ ] 3.2.2 Group messages by thread_id in message list (show as single row)
- [ ] 3.2.3 Calculate thread metadata (participant count, message count, has unread)

### 3.3 Thread UI
- [ ] 3.3.1 Create `ThreadCard` component for list view (grouped view)
- [ ] 3.3.2 Show thread summary (participants, count, latest snippet)
- [x] 3.3.3 Create `ThreadView` component for detail view
- [x] 3.3.4 Show messages as expandable cards in thread
- [ ] 3.3.5 Visual timeline/connector between messages
- [x] 3.3.6 Expand/collapse individual messages in thread

### 3.4 Thread Interactions
- [ ] 3.4.1 "Reply all" option for threads
- [ ] 3.4.2 Mark entire thread as read
- [ ] 3.4.3 Delete/archive entire thread

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
- [ ] 4.3.3 Remember expand state per-message during session

## 5. Enhanced HTML Rendering

### 5.1 Inline Images (CID)
- [x] 5.1.1 Parse CID references in HTML (`src="cid:..."`)
- [x] 5.1.2 Create endpoint to serve inline attachments (`/api/messages/{id}/body` includes inline_attachments)
- [x] 5.1.3 Replace CID URLs with data URLs in rendered HTML

### 5.2 Remote Image Blocking
- [x] 5.2.1 Detect remote images in sanitized HTML
- [x] 5.2.2 Replace with placeholder by default
- [x] 5.2.3 Add "Load remote images" button
- [ ] 5.2.4 Store trusted senders who can always load images
- [ ] 5.2.5 "Always trust this sender" option

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

### 6.3 Contact Card (Optional)
- [ ] 6.3.1 Create `ContactCard` popover component
- [ ] 6.3.2 Show on avatar/name click
- [ ] 6.3.3 Display all messages from this sender link

## 7. Mobile Reading Improvements

### 7.1 Layout
- [x] 7.1.1 Full-width message body on mobile (reduce padding)
- [x] 7.1.2 Sticky header with actions while scrolling
- [ ] 7.1.3 Collapsible header on scroll down, show on scroll up

### 7.2 Gestures
- [x] 7.2.1 Swipe left/right on message cards for actions
- [ ] 7.2.2 Swipe on detail view for next/prev message
- [ ] 7.2.3 Pull down to close detail view (return to list)

### 7.3 Actions
- [ ] 7.3.1 Bottom sheet for message actions
- [x] 7.3.2 Quick actions in swipe areas (reply, delete)
- [ ] 7.3.3 Floating reply button

## 8. Print & Export

### 8.1 Print Support
- [x] 8.1.1 Create print-specific CSS stylesheet
- [x] 8.1.2 Add "Print" button to message detail
- [x] 8.1.3 Hide UI chrome in print view
- [x] 8.1.4 Include message headers in print

### 8.2 Export
- [ ] 8.2.1 Export as plain text option
- [ ] 8.2.2 Copy message text to clipboard
- [x] 8.2.3 "Save as PDF" hint (via browser print)

## Summary

**Completed:** 63/93 tasks (68%)

### Fully Complete Sections:
- Section 0: Critical Defects (3/3)
- Section 1: Reading Pane (9/9)
- Section 4: Quote Collapsing (8/9)
- Section 6: Sender Info (8/8 core, 0/3 optional contact card)
- Section 8.1: Print Support (4/4)

### Mostly Complete Sections:
- Section 2: Keyboard Navigation (11/14)
- Section 5: Enhanced HTML Rendering (11/13)

### Partially Complete Sections:
- Section 3: Thread View (7/15) - basic thread display works, grouping in list view not done
- Section 7: Mobile Reading (4/9)
- Section 8.2: Export (1/3)

## Priority for Remaining Work

1. Thread grouping in message list (3.2.2, 3.2.3, 3.3.1, 3.3.2)
2. Archive keyboard shortcut (2.2.3)
3. Trusted senders for images (5.2.4, 5.2.5)
4. Mobile gestures on detail view (7.2.2, 7.2.3)
5. Contact card (6.3.x) - optional polish
