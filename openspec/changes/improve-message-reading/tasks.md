# Implementation Tasks

## 1. Reading Pane (Desktop Split View)

### 1.1 Layout Infrastructure
- [ ] 1.1.1 Create `ReadingPane` component with resizable split layout
- [ ] 1.1.2 Add `layoutMode` state to appStore (`list-only`, `split`, `detail-only`)
- [ ] 1.1.3 Add `selectedMessageId` tracking in URL query param
- [ ] 1.1.4 Persist pane width preference in localStorage
- [ ] 1.1.5 Add layout toggle button in toolbar

### 1.2 Integration
- [ ] 1.2.1 Refactor `InboxPage` to use `ReadingPane` on desktop
- [ ] 1.2.2 Extract message detail into reusable `MessageDetail` component
- [ ] 1.2.3 Handle empty state (no message selected)
- [ ] 1.2.4 Sync selection between list and detail pane

## 2. Keyboard Navigation

### 2.1 Navigation Hook
- [ ] 2.1.1 Create `useKeyboardNavigation` hook
- [ ] 2.1.2 Implement `j`/`k` for next/previous message
- [ ] 2.1.3 Implement arrow key alternatives
- [ ] 2.1.4 Implement `Enter` to open, `Escape` to close/go back

### 2.2 Actions
- [ ] 2.2.1 Implement `r` for reply
- [ ] 2.2.2 Implement `f` for forward
- [ ] 2.2.3 Implement `e` to archive (mark read + move)
- [ ] 2.2.4 Implement `#` to delete
- [ ] 2.2.5 Implement `u` to toggle read/unread
- [ ] 2.2.6 Implement `s` to star/unstar (future)

### 2.3 Thread Navigation
- [ ] 2.3.1 Implement `o` to expand/collapse thread
- [ ] 2.3.2 Implement `n`/`p` to move within thread messages

### 2.4 Help & Discovery
- [ ] 2.4.1 Create keyboard shortcut help modal (`?` to open)
- [ ] 2.4.2 Add visual hints for shortcuts in tooltips

## 3. Thread/Conversation View

### 3.1 Backend
- [ ] 3.1.1 Add `GET /api/threads/{thread_id}/messages` endpoint
- [ ] 3.1.2 Return messages sorted by date ascending
- [ ] 3.1.3 Include full message body in thread response

### 3.2 Frontend Data
- [ ] 3.2.1 Create `useThread` hook to fetch thread messages
- [ ] 3.2.2 Group messages by thread_id in message list
- [ ] 3.2.3 Calculate thread metadata (participant count, message count, has unread)

### 3.3 Thread UI
- [ ] 3.3.1 Create `ThreadCard` component for list view
- [ ] 3.3.2 Show thread summary (participants, count, latest snippet)
- [ ] 3.3.3 Create `ThreadView` component for detail view
- [ ] 3.3.4 Show messages as expandable bubbles
- [ ] 3.3.5 Visual timeline/connector between messages
- [ ] 3.3.6 Expand/collapse individual messages in thread

### 3.4 Thread Interactions
- [ ] 3.4.1 "Reply all" option for threads
- [ ] 3.4.2 Mark entire thread as read
- [ ] 3.4.3 Delete/archive entire thread

## 4. Quote Collapsing

### 4.1 Detection
- [ ] 4.1.1 Create `detectQuotedText` utility function
- [ ] 4.1.2 Implement regex patterns for common quote styles
- [ ] 4.1.3 Handle nested quote levels

### 4.2 UI Component
- [ ] 4.2.1 Create `QuotedText` component
- [ ] 4.2.2 Collapse quoted text by default
- [ ] 4.2.3 Add "Show quoted text" toggle (with line count)
- [ ] 4.2.4 Style collapsed indicator (e.g., `[...3 lines hidden]`)

### 4.3 Integration
- [ ] 4.3.1 Process message body through quote detector
- [ ] 4.3.2 Add global preference for quote collapse behavior
- [ ] 4.3.3 Remember expand state per-message during session

## 5. Enhanced HTML Rendering

### 5.1 Inline Images (CID)
- [ ] 5.1.1 Parse CID references in HTML (`src="cid:..."`)
- [ ] 5.1.2 Create endpoint to serve inline attachments by CID
- [ ] 5.1.3 Replace CID URLs with API URLs in rendered HTML

### 5.2 Remote Image Blocking
- [ ] 5.2.1 Detect remote images in sanitized HTML
- [ ] 5.2.2 Replace with placeholder by default
- [ ] 5.2.3 Add "Load remote images" button
- [ ] 5.2.4 Store trusted senders who can always load images
- [ ] 5.2.5 "Always trust this sender" option

### 5.3 Dark Mode Adaptation
- [ ] 5.3.1 Detect emails with light backgrounds
- [ ] 5.3.2 Apply dark mode CSS wrapper
- [ ] 5.3.3 Preserve image colors (no inversion)
- [ ] 5.3.4 Handle inline styles gracefully

### 5.4 Better Sanitization
- [ ] 5.4.1 Review DOMPurify config for allowed tags
- [ ] 5.4.2 Allow tables for better email layout
- [ ] 5.4.3 Allow CSS classes (but sanitize style content)

## 6. Sender Info & Avatars

### 6.1 Avatar Component
- [ ] 6.1.1 Create `SenderAvatar` component
- [ ] 6.1.2 Implement Gravatar URL generation (MD5 hash)
- [ ] 6.1.3 Fallback to initials on Gravatar 404
- [ ] 6.1.4 Color-coded initials based on email hash

### 6.2 Sender Display
- [ ] 6.2.1 Extract sender name from "Name <email>" format
- [ ] 6.2.2 Show name prominently, email as secondary
- [ ] 6.2.3 Add avatar to message cards
- [ ] 6.2.4 Add avatar to message detail header

### 6.3 Contact Card (Optional)
- [ ] 6.3.1 Create `ContactCard` popover component
- [ ] 6.3.2 Show on avatar/name click
- [ ] 6.3.3 Display all messages from this sender link

## 7. Mobile Reading Improvements

### 7.1 Layout
- [ ] 7.1.1 Full-width message body on mobile (reduce padding)
- [ ] 7.1.2 Sticky header with actions while scrolling
- [ ] 7.1.3 Collapsible header on scroll down, show on scroll up

### 7.2 Gestures
- [ ] 7.2.1 Swipe left/right on detail view for next/prev message
- [ ] 7.2.2 Visual indicator showing swipe direction
- [ ] 7.2.3 Pull down to close detail view (return to list)

### 7.3 Actions
- [ ] 7.3.1 Bottom sheet for message actions
- [ ] 7.3.2 Quick actions in swipe areas (reply, delete)
- [ ] 7.3.3 Floating reply button

## 8. Print & Export

### 8.1 Print Support
- [ ] 8.1.1 Create print-specific CSS stylesheet
- [ ] 8.1.2 Add "Print" button to message detail
- [ ] 8.1.3 Hide UI chrome in print view
- [ ] 8.1.4 Include message headers in print

### 8.2 Export
- [ ] 8.2.1 Export as plain text option
- [ ] 8.2.2 Copy message text to clipboard
- [ ] 8.2.3 "Save as PDF" hint (via browser print)

## Priority Order

1. **Reading Pane** - Foundation for desktop productivity
2. **Keyboard Navigation** - Quick win, power user feature
3. **Thread View** - High-value feature for conversation context
4. **Quote Collapsing** - Improves thread readability significantly
5. **Enhanced HTML Rendering** - Better email display
6. **Sender Info** - Visual polish
7. **Mobile Reading** - Mobile-specific improvements
8. **Print/Export** - Nice to have

## Dependencies

- Thread View depends on Reading Pane (detail component extraction)
- Quote Collapsing enhances Thread View
- Mobile Reading can be done in parallel with desktop features
- Keyboard Navigation can be added incrementally
