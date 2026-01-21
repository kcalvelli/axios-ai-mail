# Sync Performance: Connection Pooling, Parallel Sync, and IMAP IDLE

## Problem Statement

Current email sync is slow due to several architectural inefficiencies:

1. **IMAP re-authentication on every sync** - Each sync cycle creates a new TCP + TLS + LOGIN handshake (~1s per account)
2. **Sequential account syncing** - Accounts sync one after another instead of in parallel
3. **Gmail credential refresh overhead** - 401 responses trigger credential refresh on every request
4. **Repeated folder discovery** - Folder list is re-fetched every sync cycle
5. **Polling-based sync** - Currently polls every ~8s instead of using push notifications

With 4 accounts, a full sync cycle takes 6-8 seconds even with no new messages, and 15+ seconds when AI classification is needed.

## Goals

- Reduce sync overhead from ~6-8s to <2s for no-change syncs
- Enable near-instant email notifications via IMAP IDLE
- Improve resource efficiency (fewer connections, less CPU)
- Maintain reliability and error recovery

## Non-Goals

- Gmail push notifications (requires webhook infrastructure)
- Real-time sync for non-IMAP providers
- Changing the sync interval logic

## Proposed Solution

### Phase 1: Connection Pooling & Caching

**IMAP Connection Pool:**
- Maintain persistent IMAP connections per account
- Reuse connections across sync cycles
- Implement connection health checks and auto-reconnect
- Configurable pool size and idle timeout

**Folder Mapping Cache:**
- Cache folder discovery results in memory
- Invalidate on connection reset or explicit refresh
- Reduces folder listing overhead

**Gmail Credential Caching:**
- Fix credential caching to avoid 401 refresh dance
- Pre-emptively refresh credentials before expiry

### Phase 2: Parallel Account Syncing

**Concurrent Sync Engine:**
- Sync all accounts in parallel using asyncio
- Aggregate results for WebSocket broadcast
- Per-account error isolation (one failure doesn't block others)
- Configurable concurrency limit

### Phase 3: IMAP IDLE (Push Notifications)

**IMAP IDLE Support:**
- Implement RFC 2177 IMAP IDLE for real-time notifications
- One persistent connection per account watching INBOX
- Trigger immediate sync on IDLE notification
- Fallback to polling if IDLE not supported or fails

**Architecture:**
```
┌─────────────────────────────────────────────────────┐
│                   Sync Service                       │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ Account 1   │  │ Account 2   │  │ Account 3   │  │
│  │ IDLE Watch  │  │ IDLE Watch  │  │ IDLE Watch  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
│         │                │                │         │
│         └────────────────┼────────────────┘         │
│                          ▼                          │
│              ┌───────────────────┐                  │
│              │  Connection Pool  │                  │
│              │  (reused conns)   │                  │
│              └─────────┬─────────┘                  │
│                        ▼                            │
│              ┌───────────────────┐                  │
│              │   Sync Engine     │                  │
│              │  (parallel sync)  │                  │
│              └───────────────────┘                  │
└─────────────────────────────────────────────────────┘
```

## Technical Details

### IMAP Connection Pool

```python
class IMAPConnectionPool:
    """Manages persistent IMAP connections per account."""

    def __init__(self, max_idle_time: int = 300):
        self._connections: Dict[str, IMAPConnection] = {}
        self._locks: Dict[str, asyncio.Lock] = {}
        self._max_idle_time = max_idle_time

    async def get_connection(self, account_id: str) -> IMAPConnection:
        """Get or create a connection for an account."""
        # Reuse existing connection if healthy
        # Create new connection if needed
        # Handle connection failures gracefully

    async def release_connection(self, account_id: str):
        """Release connection back to pool (keep alive)."""

    async def close_all(self):
        """Close all connections (shutdown)."""
```

### IMAP IDLE Watcher

```python
class IMAPIdleWatcher:
    """Watches INBOX via IMAP IDLE for real-time notifications."""

    async def start(self, account: Account):
        """Start IDLE watch for an account."""
        while self._running:
            try:
                # IDLE command blocks until server sends update
                await self._connection.idle()
                # Notification received - trigger sync
                await self._on_notification(account)
            except IMAPIdleTimeout:
                # Re-issue IDLE (RFC recommends <29 min)
                continue
            except ConnectionError:
                # Reconnect and retry
                await self._reconnect()
```

### Parallel Sync

```python
async def sync_all_accounts(accounts: List[Account]) -> List[SyncResult]:
    """Sync all accounts in parallel."""
    tasks = [sync_account(account) for account in accounts]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

## Performance Expectations

| Metric | Current | After Phase 1 | After Phase 2 | After Phase 3 |
|--------|---------|---------------|---------------|---------------|
| No-change sync (4 accounts) | 6-8s | 3-4s | 1-2s | <1s |
| New message latency | 8s (poll) | 8s (poll) | 8s (poll) | <2s (push) |
| Connections per cycle | 4 new | 4 reused | 4 reused | 4 persistent |
| Auth overhead | 4× full | 0 | 0 | 0 |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Connection timeouts | Health checks, auto-reconnect, fallback to new connection |
| IDLE not supported | Feature detection, fallback to polling |
| Server connection limits | Respect server limits, configurable pool size |
| Memory leaks | Connection lifecycle management, idle timeout |
| Race conditions | Per-account locks, careful state management |

## Alternatives Considered

1. **Webhooks for Gmail** - Requires public endpoint and infrastructure changes
2. **Longer polling interval** - Increases latency unacceptably
3. **Client-side polling** - Moves load to frontend, doesn't solve backend overhead

## Dependencies

- None for Phase 1-2
- IMAP server must support IDLE extension for Phase 3 (most do)
