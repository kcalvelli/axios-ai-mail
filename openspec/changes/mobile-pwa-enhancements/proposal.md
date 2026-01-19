# Change: Mobile & PWA Enhancements

## Why

The current mobile experience has room for improvement in touch interactions and PWA capabilities:

1. **No multi-select on mobile** - Users cannot select multiple messages for bulk operations (archive, delete, mark read). Previous attempt at long-press interfered with swipe gestures.

2. **Local notifications only** - Current implementation uses browser Notification API which only works when the app is open. True PWA push notifications via service workers would allow notifications even when the app is closed.

3. **Missing PWA features** - Several Android/Chrome PWA capabilities are not utilized:
   - App shortcuts for quick navigation
   - Share target for receiving shared content
   - Background sync for offline operations

## What Changes

### 1. Long-Press Multi-Select (Touch-Friendly)

Implement Gmail-style long-press to enter selection mode without conflicting with swipe:

**Best Practice Implementation:**
- Use 500ms touch duration threshold (standard long-press timing)
- Cancel long-press if touch moves >10px (user is swiping)
- Provide immediate haptic feedback on selection mode entry
- Visual ripple effect during press to indicate pending long-press
- Once in selection mode, taps toggle selection (no more swipe until exit)

**Selection Mode Behavior:**
- Floating action bar appears with bulk actions (Delete, Archive, Mark Read/Unread)
- Tap any message to toggle selection
- Exit via X button or back gesture
- Badge shows selection count

### 2. PWA Push Notifications (Service Worker)

Upgrade from local Notification API to true push notifications:

**Implementation:**
- Register for push subscription via Push API
- Store subscription endpoint on backend
- Backend sends push via web-push protocol when new emails arrive during sync
- Service worker handles push event even when app is closed

**Note:** This requires backend changes to store subscriptions and send pushes.

### 3. App Shortcuts (Manifest)

Quick actions from home screen long-press:

```json
"shortcuts": [
  {
    "name": "Compose",
    "short_name": "Compose",
    "url": "/compose",
    "icons": [{ "src": "/icon-compose.png", "sizes": "96x96" }]
  },
  {
    "name": "Inbox",
    "short_name": "Inbox",
    "url": "/?folder=inbox",
    "icons": [{ "src": "/icon-inbox.png", "sizes": "96x96" }]
  }
]
```

### 4. Share Target (Receive Shared Content)

Allow users to share text/links to axiOS Mail for composing:

```json
"share_target": {
  "action": "/compose",
  "method": "GET",
  "params": {
    "title": "subject",
    "text": "body",
    "url": "body"
  }
}
```

### 5. Background Sync (Offline Queue)

Queue operations when offline, sync when connection restored:

- Already have offline detection (`useOnlineStatus`)
- Add Background Sync registration for pending operations
- Service worker processes queue on `sync` event

## Impact

- **Affected code:**
  - `web/src/components/SwipeableMessageCard.tsx` - Add long-press handler
  - `web/src/components/MessageList.tsx` - Selection mode state
  - `web/src/hooks/useNotifications.ts` - Push subscription
  - `web/vite.config.ts` - Manifest shortcuts/share_target
  - `web/src/service-worker.ts` - Push/sync handlers (new)
  - `src/axios_ai_mail/api/` - Push subscription endpoints (backend)

- **New dependencies:** None (web-push is backend only)

## Research Notes

### PWA Features by Platform

| Feature | Android/Chrome | Desktop Chrome | iOS Safari |
|---------|---------------|----------------|------------|
| Push Notifications | ✅ Full | ✅ Full | ⚠️ Limited (installed only) |
| Background Sync | ✅ Full | ✅ Full | ❌ Not supported |
| App Shortcuts | ✅ Chrome 84+ | ✅ Chrome 85+ | ❌ Not supported |
| Share Target | ✅ Chrome 86+ | ✅ Supported | ❌ Not supported |
| Badging API | ⚠️ Auto with notifications | ✅ Full | ❌ Not supported |

*iOS compatibility not a priority per requirements.*

### Long-Press vs Swipe Conflict Resolution

Key insight from research: The conflict is resolved by **detecting movement during the touch**:
- If finger moves >10px during first 500ms → It's a swipe, cancel long-press
- If finger stays still for 500ms → It's a long-press, enter selection mode
- Once in selection mode, disable swipe gestures entirely

Sources:
- [Gesture Navigation Best Practices](https://www.sidekickinteractive.com/designing-your-app/gesture-navigation-in-mobile-apps-best-practices/)
- [Long Press Gestures in UX](https://www.numberanalytics.com/blog/ultimate-guide-long-press-gestures-interaction-design)
- [PWA Push Notifications Guide](https://www.magicbell.com/blog/using-push-notifications-in-pwas)
- [PWA Features 2025](https://www.nucamp.co/blog/coding-bootcamp-full-stack-web-and-mobile-development-2025-progressive-web-apps-pwas-in-2025-the-future-of-web-and-mobile-integration)
