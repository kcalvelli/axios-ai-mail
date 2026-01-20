# PWA Capability Delta

## ADDED Requirements

### Requirement: Application is installable as PWA

The web application MUST be installable as a Progressive Web App on supported platforms.

#### Scenario: Installing on Chrome desktop
Given: The user visits the application in Chrome
When: They click the install prompt or use browser menu
Then: The application installs and can be launched from desktop

#### Scenario: Installing on mobile Safari
Given: The user visits the application on iOS Safari
When: They tap "Add to Home Screen"
Then: The application installs as a standalone app

#### Scenario: Launching installed PWA
Given: The PWA is installed
When: The user launches from desktop/home screen
Then: The application opens without browser chrome (standalone mode)

### Requirement: PWA manifest is properly configured

The application MUST have a valid web app manifest with required fields.

#### Scenario: Manifest contains required fields
Given: The application is deployed
When: The manifest.json is fetched
Then: It contains: name, short_name, start_url, display, icons, theme_color, background_color

#### Scenario: Manifest icons are available
Given: The manifest references icon files
When: The icons are requested
Then: Icons at 192x192 and 512x512 are available

### Requirement: Static assets are cached by service worker

The service worker MUST cache static assets for faster subsequent loads.

#### Scenario: First visit caches assets
Given: A user visits the application for the first time
When: The page loads completely
Then: Static assets (JS, CSS, HTML, images) are cached

#### Scenario: Subsequent visits use cache
Given: Assets are cached from a previous visit
When: The user returns to the application
Then: Cached assets load instantly while checking for updates

#### Scenario: API requests are not cached
Given: The service worker is registered
When: An API request is made to /api/*
Then: The request bypasses the cache and goes to the server

### Requirement: Offline status is detected and displayed

The application MUST detect when the user is offline and display an indicator.

#### Scenario: User goes offline
Given: The user is viewing the application
When: Network connectivity is lost
Then: An offline indicator is displayed

#### Scenario: User comes back online
Given: The offline indicator is displayed
When: Network connectivity is restored
Then: The offline indicator is hidden

#### Scenario: Offline indicator is accessible
Given: The user is offline
When: The indicator is displayed
Then: It has appropriate ARIA attributes for screen readers

### Requirement: Actions are disabled when offline

Network-dependent actions MUST be disabled or show appropriate feedback when offline.

#### Scenario: Send button when offline
Given: The user is composing a message and goes offline
When: They attempt to click Send
Then: The button is disabled with a tooltip "Cannot send while offline"

#### Scenario: Sync button when offline
Given: The user is viewing messages and goes offline
When: They attempt to click Sync
Then: The button is disabled with a tooltip "Cannot sync while offline"

#### Scenario: Reading cached messages when offline
Given: The user has previously viewed messages
When: They go offline and view the message list
Then: Previously loaded messages are still visible (browser cache)
