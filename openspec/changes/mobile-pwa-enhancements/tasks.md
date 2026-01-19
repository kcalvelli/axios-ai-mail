# Implementation Tasks

## 1. Long-Press Multi-Select

### 1.1 Touch Gesture Handler
- [x] 1.1.1 Create `useLongPress` hook with 500ms threshold
- [x] 1.1.2 Detect touch movement to distinguish from swipe (>10px cancels)
- [x] 1.1.3 Add haptic feedback on long-press activation
- [x] 1.1.4 Visual press indicator (scale effect during hold)

### 1.2 Selection Mode State
- [x] 1.2.1 Add selection mode state to appStore
- [x] 1.2.2 Track selected message IDs (already exists: `selectedMessages`)
- [x] 1.2.3 Add `enterSelectionMode` / `exitSelectionMode` actions

### 1.3 Selection Mode UI
- [x] 1.3.1 BulkActionBar already exists (floating action bar)
- [x] 1.3.2 Show selection count badge (already exists)
- [x] 1.3.3 Bulk action buttons: Delete, Archive, Mark Read/Unread (already exists)
- [x] 1.3.4 Exit button (X) updated to exit selection mode

### 1.4 Integrate with MessageList
- [x] 1.4.1 Wrap SwipeableMessageCard with long-press handler
- [x] 1.4.2 Disable swipe when in selection mode
- [x] 1.4.3 Tap toggles selection in selection mode
- [x] 1.4.4 Visual selection indicator (checkbox/highlight)

## 2. PWA Push Notifications

### 2.1 Frontend Push Subscription
- [ ] 2.1.1 Generate VAPID keys for push service
- [ ] 2.1.2 Add push subscription logic to service worker
- [ ] 2.1.3 Update `useNotifications` to request push permission
- [ ] 2.1.4 Send subscription to backend on registration

### 2.2 Backend Push Service
- [ ] 2.2.1 Add push subscription storage (database model)
- [ ] 2.2.2 Create API endpoint: POST /api/push/subscribe
- [ ] 2.2.3 Create API endpoint: DELETE /api/push/unsubscribe
- [ ] 2.2.4 Install `web-push` library (Python: `pywebpush`)

### 2.3 Push on New Email
- [ ] 2.3.1 Trigger push notification during email sync
- [ ] 2.3.2 Send push payload with message summary
- [ ] 2.3.3 Handle push event in service worker
- [ ] 2.3.4 Show notification with click-to-open action

## 3. App Shortcuts

### 3.1 Manifest Configuration
- [x] 3.1.1 Add shortcuts array to manifest in vite.config.ts
- [ ] 3.1.2 Create shortcut icons (Compose, Inbox, Drafts) - using main icon for now
- [ ] 3.1.3 Test on Android Chrome

## 4. Share Target

### 4.1 Manifest Configuration
- [x] 4.1.1 Add share_target to manifest
- [x] 4.1.2 Configure params mapping (title→subject, text→body, url→url)

### 4.2 Compose Page Handler
- [x] 4.2.1 Read URL params on /compose load (already existed)
- [x] 4.2.2 Pre-fill subject/body from shared content
- [x] 4.2.3 Handle shared URLs (append to body)

## 5. Background Sync

### 5.1 Offline Queue
- [ ] 5.1.1 Create IndexedDB store for pending operations
- [ ] 5.1.2 Queue failed mutations when offline
- [ ] 5.1.3 Register for background sync on queue

### 5.2 Service Worker Sync Handler
- [ ] 5.2.1 Handle `sync` event in service worker
- [ ] 5.2.2 Process queued operations
- [ ] 5.2.3 Clear queue on success
- [ ] 5.2.4 Notify user of synced changes

## 6. DEFECT FIX: Read/Unread State Sync

### 6.1 Provider Interface
- [x] 6.1.1 Add `mark_read(message_id)` method to BaseEmailProvider
- [x] 6.1.2 Add `mark_unread(message_id)` method to BaseEmailProvider

### 6.2 Gmail Implementation
- [x] 6.2.1 Implement mark_read using `users.messages.modify` (remove UNREAD label)
- [x] 6.2.2 Implement mark_unread using `users.messages.modify` (add UNREAD label)

### 6.3 IMAP Implementation
- [x] 6.3.1 Implement mark_read using `STORE +FLAGS (\Seen)` (already existed)
- [x] 6.3.2 Implement mark_unread using `STORE -FLAGS (\Seen)` (already existed)

### 6.4 API Integration
- [x] 6.4.1 Update POST `/api/messages/{id}/read` to call provider on is_unread change
- [x] 6.4.2 Handle provider sync errors gracefully (don't fail local update)
- [ ] 6.4.3 Add rate limiting for rapid read/unread toggles

### 6.5 Sync Behavior
- [x] 6.5.1 During sync, respect provider's read state as source of truth
- [ ] 6.5.2 OR: Track "locally modified" flag to preserve local changes
- [ ] 6.5.3 Decide on conflict resolution strategy (provider wins vs local wins)

## 7. Testing

- [ ] 7.1 Test long-press vs swipe gesture separation
- [ ] 7.2 Test selection mode bulk operations
- [ ] 7.3 Test push notifications (app closed)
- [ ] 7.4 Test app shortcuts on Android
- [ ] 7.5 Test share target from other apps
- [ ] 7.6 Test background sync after offline operations
- [ ] 7.7 Test read/unread sync to Gmail
- [ ] 7.8 Test read/unread sync to IMAP
- [ ] 7.9 Verify read state persists across app restarts and syncs

## Priority Order

1. **DEFECT: Read/Unread State Sync** (Critical - broken functionality)
2. **Long-Press Multi-Select** (High - core UX improvement)
3. **App Shortcuts** (Medium - easy win, manifest only)
4. **Share Target** (Medium - easy win, manifest + compose handler)
5. **PWA Push Notifications** (Medium - requires backend work)
6. **Background Sync** (Low - nice-to-have, complex)
