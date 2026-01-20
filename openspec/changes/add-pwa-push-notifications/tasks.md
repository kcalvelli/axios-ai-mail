# Implementation Tasks

## 1. Frontend Push Subscription

- [ ] 1.1 Generate VAPID keys for push service
- [ ] 1.2 Add push subscription logic to service worker
- [ ] 1.3 Update notification settings to request push permission
- [ ] 1.4 Send subscription to backend on registration

## 2. Backend Push Service

- [ ] 2.1 Add push subscription model (user_id, endpoint, p256dh, auth)
- [ ] 2.2 Create POST /api/push/subscribe endpoint
- [ ] 2.3 Create DELETE /api/push/unsubscribe endpoint
- [ ] 2.4 Install and configure `pywebpush` library

## 3. Push on New Email

- [ ] 3.1 Trigger push notification during email sync for new messages
- [ ] 3.2 Build push payload with message summary (sender, subject)
- [ ] 3.3 Handle push event in service worker
- [ ] 3.4 Show notification with click-to-open action
- [ ] 3.5 Update app badge with unread count

## 4. Testing

- [ ] 4.1 Test push with app closed
- [ ] 4.2 Test push with app in background
- [ ] 4.3 Test notification click opens correct message
- [ ] 4.4 Test unsubscribe flow
