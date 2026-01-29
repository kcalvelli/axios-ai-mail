## ADDED Requirements

### Requirement: VAPID Key Management
The system SHALL support VAPID key configuration for Web Push authentication.

#### Scenario: VAPID public key served to clients
- **WHEN** a client sends `GET /api/push/vapid-key`
- **THEN** the response SHALL contain the VAPID public key as a base64url-encoded string

#### Scenario: VAPID keys configured via Nix
- **WHEN** the NixOS or Home-Manager module is configured
- **THEN** the VAPID private key path SHALL be configurable as a secret file reference
- **AND** the VAPID public key SHALL be configurable as a string option

### Requirement: Push Subscription Management
The system SHALL allow clients to register and unregister push subscriptions.

#### Scenario: Subscribe to push notifications
- **WHEN** a client sends `POST /api/push/subscribe` with a push subscription object (endpoint, keys.p256dh, keys.auth)
- **THEN** the subscription SHALL be stored in the database
- **AND** the response SHALL confirm the subscription was created

#### Scenario: Unsubscribe from push notifications
- **WHEN** a client sends `DELETE /api/push/unsubscribe` with the subscription endpoint
- **THEN** the subscription SHALL be removed from the database

#### Scenario: Duplicate subscription is idempotent
- **WHEN** a client sends `POST /api/push/subscribe` with an endpoint that already exists
- **THEN** the existing subscription SHALL be updated (not duplicated)

### Requirement: Push Notification on New Email
The system SHALL send a Web Push notification to all active subscriptions when new emails are synced.

#### Scenario: New email triggers push
- **WHEN** the sync engine fetches new messages
- **THEN** a push notification SHALL be sent for each new message (up to a reasonable batch limit)
- **AND** the notification payload SHALL include the sender name and subject line

#### Scenario: Push payload is privacy-respecting
- **WHEN** a push notification is sent
- **THEN** the payload SHALL NOT include the email body content
- **AND** the payload SHALL include only: title (sender), body (subject), URL (message link), and tag for grouping

#### Scenario: Invalid subscription is cleaned up
- **WHEN** a push notification fails with HTTP 404 or 410 from the push service
- **THEN** the subscription SHALL be automatically removed from the database

### Requirement: Service Worker Push Handler
The service worker SHALL handle incoming push events and display notifications.

#### Scenario: Push event displays notification
- **WHEN** a `push` event is received by the service worker
- **THEN** a notification SHALL be displayed with the sender name as title and subject as body

#### Scenario: Notification click opens message
- **WHEN** the user clicks a push notification
- **THEN** the app SHALL open (or focus if already open) and navigate to the relevant message

### Requirement: Push Notification Settings UI
The frontend SHALL provide UI for enabling and disabling push notifications.

#### Scenario: Enable push notifications
- **WHEN** the user enables push notifications in settings
- **THEN** the browser SHALL request notification permission
- **AND** on permission grant, a push subscription SHALL be created and sent to the backend

#### Scenario: Disable push notifications
- **WHEN** the user disables push notifications in settings
- **THEN** the push subscription SHALL be unregistered from the backend
- **AND** the browser push subscription SHALL be unsubscribed

#### Scenario: Permission denied
- **WHEN** the browser notification permission is denied
- **THEN** the settings UI SHALL show a message explaining that push notifications require browser permission
