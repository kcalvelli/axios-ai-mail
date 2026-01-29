## ADDED Requirements

### Requirement: Build Version Identification
The system SHALL embed a unique build version identifier into the frontend at build time and serve the same identifier from a backend API endpoint.

#### Scenario: Version endpoint returns current build hash
- **WHEN** a client sends `GET /api/version`
- **THEN** the response SHALL contain a JSON object with a `version` field matching the currently deployed build hash

#### Scenario: Frontend embeds build version
- **WHEN** the frontend is built by Vite
- **THEN** a global `__APP_VERSION__` constant SHALL be defined containing the build hash

### Requirement: Automatic Service Worker Activation
The system SHALL configure the service worker to activate immediately upon installation, without waiting for existing clients to close.

#### Scenario: New service worker takes control immediately
- **WHEN** a new service worker is installed (due to changed precache manifest)
- **THEN** the service worker SHALL call `skipWaiting()` during the `install` event
- **AND** the service worker SHALL call `clientsClaim()` during the `activate` event
- **AND** all open clients SHALL begin using the new service worker immediately

### Requirement: Version Polling and Auto-Reload
The system SHALL periodically poll the backend version endpoint and reload the page when a version mismatch is detected.

#### Scenario: Version mismatch triggers reload
- **WHEN** the frontend polls `GET /api/version`
- **AND** the returned version differs from the embedded `__APP_VERSION__`
- **THEN** the page SHALL reload to pick up the new service worker and assets

#### Scenario: Polling interval
- **WHEN** the app is running
- **THEN** the version check SHALL execute every 5 minutes

#### Scenario: No reload when versions match
- **WHEN** the returned version matches `__APP_VERSION__`
- **THEN** no reload SHALL occur

### Requirement: IndexedDB Cache Invalidation on Version Change
The system SHALL tie the React Query persistence cache buster to the build version so that cached data is invalidated when the app is updated.

#### Scenario: Cache buster changes with version
- **WHEN** a new version of the app is deployed
- **THEN** the `PersistQueryClientProvider` buster value SHALL change
- **AND** the stale IndexedDB cache SHALL be discarded
