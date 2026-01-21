# Spec: Sync Engine Performance

## ADDED Requirements

### Requirement: IMAP Connection Pooling
The sync engine SHALL maintain persistent IMAP connections to avoid re-authentication overhead on each sync cycle.

#### Scenario: Reusing existing connection
- **Given** an IMAP account has been synced previously
- **And** the connection is still healthy
- **When** a new sync cycle starts
- **Then** the existing connection is reused
- **And** no new authentication handshake occurs

#### Scenario: Connection health check fails
- **Given** an IMAP account has an existing connection
- **And** the connection is stale or disconnected
- **When** a sync cycle starts
- **Then** a new connection is established
- **And** the old connection is closed

#### Scenario: Connection idle timeout
- **Given** an IMAP connection has been idle for longer than the configured timeout
- **When** the idle timeout is reached
- **Then** the connection is closed
- **And** a new connection will be created on the next sync

### Requirement: Parallel Account Syncing
The sync engine SHALL sync multiple accounts concurrently to reduce total sync time.

#### Scenario: Multiple accounts sync in parallel
- **Given** there are 4 email accounts configured
- **When** a sync cycle is triggered
- **Then** all 4 accounts begin syncing concurrently
- **And** the total sync time is approximately max(individual_sync_times) not sum(individual_sync_times)

#### Scenario: One account fails during parallel sync
- **Given** multiple accounts are syncing in parallel
- **When** one account encounters an error
- **Then** the error is logged for that account
- **And** other accounts continue syncing normally
- **And** the sync results include both successes and the failure

### Requirement: Folder Mapping Cache
The sync engine SHALL cache folder discovery results to avoid redundant IMAP LIST commands.

#### Scenario: Cache hit on folder lookup
- **Given** folder mapping was discovered within the cache TTL
- **When** a sync cycle needs the folder mapping
- **Then** the cached mapping is used
- **And** no IMAP LIST command is issued

#### Scenario: Cache invalidation on connection reset
- **Given** folder mapping is cached
- **When** the IMAP connection is reset
- **Then** the folder cache is invalidated
- **And** the next sync will re-discover folders

### Requirement: IMAP IDLE Push Notifications
The sync engine SHALL support IMAP IDLE for near-instant email notifications on supported servers.

#### Scenario: Server supports IDLE
- **Given** an IMAP server advertises the IDLE capability
- **When** the sync service starts
- **Then** an IDLE watcher is started for that account
- **And** the watcher monitors the INBOX folder

#### Scenario: New email arrives via IDLE
- **Given** an IDLE watcher is monitoring an INBOX
- **When** a new email arrives on the server
- **Then** the server sends an EXISTS notification
- **And** the sync engine triggers an immediate sync for that account
- **And** the new email appears in the UI within 2 seconds

#### Scenario: IDLE timeout refresh
- **Given** an IDLE watcher has been waiting for 25 minutes
- **When** the IDLE timeout is reached
- **Then** the IDLE command is re-issued
- **And** no messages are missed during the refresh

#### Scenario: Server does not support IDLE
- **Given** an IMAP server does not advertise the IDLE capability
- **When** the sync service starts
- **Then** no IDLE watcher is created for that account
- **And** the account uses polling-based sync

#### Scenario: IDLE connection drops
- **Given** an IDLE watcher is active
- **When** the connection is lost
- **Then** the watcher attempts to reconnect
- **And** IDLE is resumed after reconnection
- **And** a full sync is triggered to catch any missed messages

### Requirement: Gmail Credential Caching
The sync engine SHALL properly cache Gmail API credentials to avoid unnecessary token refreshes.

#### Scenario: Credentials are valid
- **Given** Gmail credentials are cached and not expired
- **When** a Gmail API request is made
- **Then** the cached credentials are used
- **And** no 401 response occurs

#### Scenario: Credentials near expiry
- **Given** Gmail credentials will expire within 5 minutes
- **When** a sync cycle starts
- **Then** credentials are proactively refreshed before the API call
- **And** no 401 response occurs during the sync
