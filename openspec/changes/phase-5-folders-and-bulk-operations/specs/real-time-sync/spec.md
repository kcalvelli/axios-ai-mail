# Capability: Real-Time Email Sync

## ADDED Requirements

### Requirement: System SHALL detect new mail in real-time using IMAP IDLE

Instead of polling every 5 minutes, the system MUST use IMAP IDLE to receive immediate notifications when new mail arrives (when supported by the server).

#### Scenario: IMAP IDLE detects new mail

**Given** an IMAP account with IDLE capability enabled
**And** the system has established an IDLE connection to INBOX
**When** a new email arrives on the server
**Then** the IMAP server sends an EXISTS response
**And** the IDLE manager receives the notification within 1 second
**And** an incremental sync is triggered for that account
**And** the new message is fetched and stored in the database
**And** the web UI is notified via Server-Sent Events

#### Scenario: IDLE connection refresh

**Given** an active IDLE connection
**When** 29 minutes have elapsed since the last IDLE command
**Then** the system sends "DONE" to exit IDLE mode
**And** immediately re-enters IDLE mode
**And** the connection remains active
**And** no messages are missed during the refresh

**Rationale**: RFC 2177 recommends refreshing IDLE every 29 minutes to prevent server timeouts.

#### Scenario: IDLE not supported - fall back to polling

**Given** an IMAP server that does not support IDLE (no IDLE in CAPABILITY)
**When** the sync manager initializes
**Then** IDLE is not enabled for this account
**And** the system falls back to polling every 5 minutes
**And** a warning is logged: "IDLE not supported for {account}, using polling"
**And** the user is notified in the UI (optional)

### Requirement: IDLE connection SHALL handle errors gracefully

Network issues and server disconnections MUST be handled with automatic reconnection.

#### Scenario: IDLE connection lost - reconnect

**Given** an active IDLE connection
**When** the network connection is lost
**Then** the IDLE thread detects the disconnection
**And** waits 1 second before attempting reconnection
**And** tries to re-establish IMAP connection
**If reconnection fails**:
  **Then** wait 2 seconds and retry
  **And** double the wait time on each failure (exponential backoff)
  **And** cap the maximum wait at 60 seconds
**When** reconnection succeeds
**Then** IDLE mode is re-entered
**And** normal operation resumes

#### Scenario: IDLE server error

**Given** an active IDLE connection
**When** the IMAP server returns an error response (BAD or NO)
**Then** the IDLE thread exits IDLE mode
**And** logs the error
**And** waits 5 seconds before retrying
**And** re-enters IDLE mode

#### Scenario: Graceful shutdown

**Given** an active IDLE connection
**When** the application receives SIGTERM or SIGINT
**Then** the IDLE thread sends "DONE" to exit IDLE mode
**And** closes the IMAP connection cleanly
**And** terminates the thread
**And** no orphaned connections remain

### Requirement: Web UI SHALL receive real-time notifications of new mail

The frontend MUST be notified immediately when new mail arrives, without polling.

#### Scenario: Server-Sent Events connection

**Given** the user has the web UI open
**When** the page loads
**Then** an EventSource connection is established to /api/events/subscribe
**And** the connection remains open
**And** automatic reconnection is enabled

#### Scenario: Receive new mail notification

**Given** the user is viewing the Inbox
**And** an EventSource connection is active
**When** new mail is detected by IDLE
**Then** the backend sends an SSE event:
```
event: new_mail
data: {"account_id": "work", "folder": "INBOX", "count": 2}
```
**And** the frontend receives the event
**And** the message list query is invalidated
**And** React Query refetches the message list
**And** the new messages appear in the UI
**And** a toast notification shows: "2 new messages"

#### Scenario: New mail in different folder

**Given** the user is viewing the Inbox
**When** new mail arrives in the Sent folder (e.g., via BCC)
**Then** an SSE event is sent with folder="Sent"
**And** if the user is not viewing Sent folder, no UI update occurs
**And** the Sent folder count badge increases by 1

#### Scenario: Reconnect after SSE connection lost

**Given** the SSE connection is active
**When** the network connection is lost
**Then** the EventSource automatically reconnects
**And** missed events are not replayed (acceptable trade-off)
**And** the next IDLE notification will trigger a sync

### Requirement: IDLE connection SHALL be managed per account

Each IMAP account MUST have its own IDLE connection (if IDLE is supported by that account's server).

#### Scenario: Multiple accounts with IDLE

**Given** two IMAP accounts configured: "work" and "personal"
**And** both support IDLE
**When** the sync service starts
**Then** two separate IDLE threads are created
**And** each thread monitors its account's INBOX
**And** new mail in either account triggers independent SSE events

#### Scenario: Mixed IDLE and polling accounts

**Given** "work" account supports IDLE
**And** "personal" account does not support IDLE
**When** the sync service runs
**Then** "work" uses IDLE for real-time sync
**And** "personal" uses polling every 5 minutes
**And** both accounts function correctly

### Requirement: IDLE SHALL only monitor one folder per account

To keep implementation simple, IDLE MUST only monitor the primary folder (typically INBOX) for each account.

#### Scenario: IDLE monitors INBOX only

**Given** an account configured with folders: ["INBOX", "Sent", "Drafts"]
**When** the IDLE connection is established
**Then** only INBOX is selected for IDLE monitoring
**And** new mail in Sent or Drafts is not detected in real-time
**And** those folders are synced during periodic full sync

**Rationale**: Monitoring multiple folders would require multiple IDLE connections, increasing complexity. Most new mail arrives in INBOX.

**Future enhancement**: Support multi-folder IDLE with configurable folder list.

### Requirement: IDLE implementation SHALL comply with RFC 2177

The IMAP IDLE implementation MUST follow the RFC 2177 standard to ensure compatibility with IMAP servers.

#### Scenario: IDLE command sequence

**Given** an IMAP connection is established
**And** the server supports IDLE (CAPABILITY response includes "IDLE")
**When** entering IDLE mode
**Then** the following commands are sent:
1. `SELECT INBOX` (or configured folder)
2. `IDLE`
**And** the server responds with `+ idling`
**And** the client waits for server responses (EXISTS, RECENT, EXPUNGE, etc.)
**When** exiting IDLE mode (after 29 minutes or on new mail)
**Then** the client sends `DONE`
**And** the server responds with `OK IDLE terminated`

### Requirement: System SHALL log IDLE events for debugging

IDLE connection state changes and errors MUST be logged for troubleshooting and monitoring.

#### Scenario: IDLE logging

**Given** IDLE is enabled for an account
**Then** the following events are logged:
- `INFO: IDLE connection established for account {id}`
- `DEBUG: Entering IDLE mode for folder {folder}`
- `INFO: IDLE detected new mail: EXISTS {count}`
- `WARN: IDLE connection lost, reconnecting in {seconds}s`
- `ERROR: IDLE not supported, falling back to polling`
- `INFO: IDLE connection closed gracefully`

## MODIFIED Requirements

### Requirement: Sync process SHALL support both scheduled and event-driven modes

The sync process MUST support both scheduled (polling) and event-driven (IDLE) trigger modes for maximum compatibility.

**Previously**: Sync ran only on scheduled intervals (5 minutes) or manual trigger.

**Now**: Sync MUST also be triggerable by IDLE notifications for incremental updates.

#### Scenario: IDLE-triggered incremental sync

**Given** an IDLE connection detects new mail (EXISTS 25, was 23)
**When** the IDLE manager triggers a sync
**Then** only the 2 new messages are fetched (UID > last_known_uid)
**And** a full folder scan is not performed
**And** the sync completes in < 2 seconds

## REMOVED Requirements

None - polling remains as fallback for servers without IDLE support.
