# Implementation Tasks

## 1. Long-Press Multi-Select

### 1.1 Touch Gesture Handler
- [ ] 1.1.1 Create `useLongPress` hook with 500ms threshold
- [ ] 1.1.2 Detect touch movement to distinguish from swipe (>10px cancels)
- [ ] 1.1.3 Add haptic feedback on long-press activation
- [ ] 1.1.4 Visual press indicator (ripple/scale effect during hold)

### 1.2 Selection Mode State
- [ ] 1.2.1 Add selection mode state to appStore
- [ ] 1.2.2 Track selected message IDs (already exists: `selectedMessages`)
- [ ] 1.2.3 Add `enterSelectionMode` / `exitSelectionMode` actions

### 1.3 Selection Mode UI
- [ ] 1.3.1 Create `SelectionToolbar` component (floating action bar)
- [ ] 1.3.2 Show selection count badge
- [ ] 1.3.3 Bulk action buttons: Delete, Archive, Mark Read/Unread
- [ ] 1.3.4 Exit button (X) to clear selection and exit mode

### 1.4 Integrate with MessageList
- [ ] 1.4.1 Wrap message cards with long-press handler
- [ ] 1.4.2 Disable swipe when in selection mode
- [ ] 1.4.3 Tap toggles selection in selection mode
- [ ] 1.4.4 Visual selection indicator (checkbox/highlight)

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
- [ ] 3.1.1 Add shortcuts array to manifest in vite.config.ts
- [ ] 3.1.2 Create shortcut icons (Compose, Inbox, Drafts)
- [ ] 3.1.3 Test on Android Chrome

## 4. Share Target

### 4.1 Manifest Configuration
- [ ] 4.1.1 Add share_target to manifest
- [ ] 4.1.2 Configure params mapping (title→subject, text→body)

### 4.2 Compose Page Handler
- [ ] 4.2.1 Read URL params on /compose load
- [ ] 4.2.2 Pre-fill subject/body from shared content
- [ ] 4.2.3 Handle shared URLs (append to body)

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

## 6. Testing

- [ ] 6.1 Test long-press vs swipe gesture separation
- [ ] 6.2 Test selection mode bulk operations
- [ ] 6.3 Test push notifications (app closed)
- [ ] 6.4 Test app shortcuts on Android
- [ ] 6.5 Test share target from other apps
- [ ] 6.6 Test background sync after offline operations

## Priority Order

1. **Long-Press Multi-Select** (High - core UX improvement)
2. **App Shortcuts** (Medium - easy win, manifest only)
3. **Share Target** (Medium - easy win, manifest + compose handler)
4. **PWA Push Notifications** (Medium - requires backend work)
5. **Background Sync** (Low - nice-to-have, complex)
