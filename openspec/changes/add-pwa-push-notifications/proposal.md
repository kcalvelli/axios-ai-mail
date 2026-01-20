# Proposal: PWA Push Notifications

## What
Add Web Push notifications so users receive real-time email alerts even when the app is closed or in the background.

## Why
Currently users must have the app open to see new emails. Push notifications enable:
- Immediate awareness of important emails
- Better mobile experience matching native email apps
- Increased engagement without constant app checking

## How

### Frontend
1. Generate VAPID keys for push service
2. Add push subscription logic to service worker
3. Request push permission in notification settings
4. Send subscription endpoint to backend

### Backend
1. Store push subscriptions in database (user_id, endpoint, keys)
2. API endpoints: POST /api/push/subscribe, DELETE /api/push/unsubscribe
3. Use `pywebpush` library to send notifications
4. Trigger push during email sync for new high-priority messages

### Service Worker
1. Handle `push` event to display notification
2. Handle `notificationclick` to open relevant message
3. Badge updates for unread count

## Scope
- VAPID key generation and storage
- Push subscription management
- Backend push sending on new email
- Service worker push handling
- Notification click-to-open

## Out of Scope
- Per-tag notification preferences (future)
- Quiet hours (future)
- Rich notification actions beyond click-to-open (future)
