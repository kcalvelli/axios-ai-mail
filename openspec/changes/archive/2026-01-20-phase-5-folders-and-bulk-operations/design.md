# Design: Phase 5 - Folders and Bulk Operations

## Architecture Overview

This phase extends the single-message operations from Phase 4 with bulk operations and multi-folder support, requiring coordination between:
1. **Web UI** - Selection state management and bulk action interface
2. **API Layer** - Bulk operation endpoints with transaction support
3. **Provider Layer** - Multi-folder sync and real-time updates (IDLE)
4. **Database** - Folder field and efficient bulk queries

## Key Design Decisions

### 1. Bulk Selection State Management

**Decision**: Use Zustand store for selection state (not React Query)

**Rationale**:
- Selection is ephemeral UI state, not server state
- Need to track selected message IDs across component tree
- Clear selection after bulk operation completes
- No need for cache invalidation or server sync

**Implementation**:
```typescript
interface SelectionStore {
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}
```

**Alternative considered**: React Context + useState
- Rejected: Causes unnecessary re-renders of entire message list
- Zustand provides better performance with selective subscriptions

### 2. Bulk Operations API Design

**Decision**: Single bulk endpoint per operation type, accept array of IDs

**Format**:
```json
POST /api/messages/bulk/delete
{
  "message_ids": ["id1", "id2", "id3"]
}

Response:
{
  "deleted": 2,
  "total": 3,
  "errors": [
    {"message_id": "id3", "error": "Not found"}
  ]
}
```

**Rationale**:
- Atomic transactions ensure partial success handling
- Client can show which messages succeeded/failed
- Single HTTP request reduces network overhead
- Easier to implement provider sync (batch operations)

**Alternative considered**: Individual DELETE requests with Promise.all()
- Rejected: No transaction guarantees, harder to implement retry logic
- Rejected: More HTTP overhead for large selections

### 3. "Delete All" vs Bulk Delete

**Decision**: Separate endpoint for delete-all with filter params

**Format**:
```json
POST /api/messages/delete-all
{
  "account_id": "work",
  "tag": "newsletter",
  "is_unread": false,
  "folder": "INBOX"
}

Response:
{
  "deleted": 127,
  "filter": {...}
}
```

**Rationale**:
- User intent is different: "delete everything matching filter" vs "delete these specific messages"
- Avoids sending potentially huge array of IDs over wire
- Server can optimize query (single DELETE WHERE instead of IN clause)
- Clearer confirmation dialog ("Delete all newsletters in Inbox?")

**Trade-off**:
- More complex confirmation logic in UI
- Need to ensure filter params match what's displayed
- Risk of accidental deletion if filter state is stale

**Mitigation**:
- Return count in confirmation dialog before executing
- Require explicit user confirmation checkbox
- Show filter criteria in plain English

### 4. Multi-folder Architecture

**Decision**: Store folder as column in messages table, not separate table

**Schema**:
```sql
ALTER TABLE messages ADD COLUMN folder VARCHAR(255) DEFAULT 'INBOX';
CREATE INDEX idx_messages_account_folder ON messages(account_id, folder);
```

**Rationale**:
- Simple, denormalized design
- Folder is intrinsic to message identity (message in INBOX ≠ same message in Sent)
- Fast queries: `WHERE account_id = ? AND folder = ?`
- Matches IMAP model (messages belong to mailbox)

**Alternative considered**: Separate folders table with foreign key
- Rejected: Over-engineering for this use case
- Rejected: No benefit from normalization (folder names rarely change)

**Folder Name Mapping**:
```python
LOGICAL_TO_IMAP = {
    "Inbox": "INBOX",
    "Sent": "Sent",  # or "Sent Items", "[Gmail]/Sent Mail"
    "Drafts": "Drafts",
    "Archive": "Archive",
    "Trash": "Trash",  # or "Deleted Items", "[Gmail]/Trash"
}
```

- Make mapping configurable per account
- Auto-detect common patterns (Gmail, Outlook, Fastmail)
- Fall back to IMAP LIST output if no mapping defined

### 5. IMAP IDLE Implementation

**Decision**: Use threading with single IDLE connection per account

**Architecture**:
```
Main Process (FastAPI)
    |
    ├─ HTTP API Server (port 8080)
    |
    └─ Background Thread: IMAPIdleManager
           ├─ IDLE Connection (INBOX)
           ├─ Auto-reconnect on timeout/error
           └─ Emit WebSocket events on new mail
```

**Why threading (not asyncio)**:
- IMAP library (imaplib) is synchronous
- Blocking IDLE command waits for server push
- Easier to integrate with existing sync code
- Thread-safe queue for event passing

**IDLE Connection Lifecycle**:
1. Check CAPABILITY for IDLE support
2. SELECT folder (INBOX by default)
3. Send IDLE command
4. Wait for EXISTS/RECENT response (or 29 min timeout per RFC 2177)
5. Send DONE, refresh IDLE
6. On error: exponential backoff (1s → 2s → 4s → ... → 60s max)

**Trade-off**: One IDLE connection per account
- **Limitation**: Only monitors one folder (typically INBOX)
- **Benefit**: Simpler implementation, lower resource usage
- **Future**: Could extend to multiple IDLE connections for multi-folder real-time

**Alternative considered**: aioimap library for async IDLE
- Rejected: Adds complexity, requires refactoring entire IMAP provider
- Rejected: Not necessary for current scale (< 10 accounts)

### 6. WebSocket Notifications

**Decision**: Server-Sent Events (SSE) instead of WebSocket

**Rationale**:
- One-way communication (server → client) is sufficient
- Simpler than WebSocket (no handshake, just HTTP)
- Automatic reconnection in EventSource API
- FastAPI has built-in SSE support

**Event Format**:
```
event: new_mail
data: {"account_id": "work", "folder": "INBOX", "count": 3}
```

**Client Implementation**:
```typescript
const eventSource = new EventSource('/api/events/subscribe');
eventSource.addEventListener('new_mail', (event) => {
  const { account_id, folder, count } = JSON.parse(event.data);
  queryClient.invalidateQueries({ queryKey: messageKeys.list(...) });
  toast.info(`${count} new messages in ${folder}`);
});
```

**Alternative considered**: Full WebSocket with bidirectional communication
- Rejected: Overkill for current needs
- Future consideration: Could add client → server commands (e.g., trigger sync)

### 7. Bulk Operation Optimistic Updates

**Decision**: Optimistic updates for all bulk operations

**Flow**:
1. User clicks "Delete" on 10 selected messages
2. Immediately remove messages from UI (optimistic)
3. Send API request in background
4. On success: Do nothing (already removed)
5. On error: Re-add messages to UI, show error toast

**Rationale**:
- Perceived performance: instant feedback
- Matches user expectations from Gmail/Outlook
- Reduces perceived latency

**Implementation**:
```typescript
const { mutate } = useBulkDelete({
  onMutate: async (messageIds) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: messageKeys.lists() });

    // Snapshot previous value
    const previous = queryClient.getQueryData(messageKeys.list(filters));

    // Optimistically update
    queryClient.setQueryData(messageKeys.list(filters), (old) => ({
      ...old,
      messages: old.messages.filter(m => !messageIds.includes(m.id))
    }));

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(messageKeys.list(filters), context.previous);
  },
});
```

**Risk**: Partial success handling is complex
- If 8/10 messages deleted successfully, should we:
  - Keep all 10 removed (optimistic) and show error for 2?
  - Re-add only the 2 failed messages?

**Decision**: Re-add only failed messages, show error count
```
Toast: "8 of 10 messages deleted. 2 failed."
```

### 8. Unified Account Filtering UI

**Decision**: Treat accounts AS tags in the existing Tags section

**Rationale**:
- Maintains the tag-focused filtering approach that sets this software apart
- No new UI sections needed - accounts appear alongside AI tags
- Simpler mental model: everything is a tag (accounts, AI categories, etc.)
- Multi-selection and OR logic already work for tags
- Reduces UI complexity and maintains consistency

**Implementation**:
```typescript
// Tags are just tags - no separate state needed for accounts
interface FilterStore {
  selectedTags: string[];  // Includes both AI tags and account tags
  selectedFolder: string | null;

  toggleTag: (tag: string) => void;
  setFolder: (folder: string) => void;
  clearFilters: () => void;
}

// Sidebar component - single Tags section
<Section title="Tags">
  {tags.map(tag => (
    <TagChip
      key={tag.name}
      tag={tag.name}
      selected={selectedTags.includes(tag.name)}
      onClick={() => toggleTag(tag.name)}
      count={tag.count}
      isAccountTag={tag.type === 'account'}
    />
  ))}
</Section>
```

**Tag Types**:
```typescript
interface Tag {
  name: string;           // "work", "urgent", "newsletter", etc.
  count: number;          // Message count
  type: 'ai' | 'account'; // Distinguish for visual styling
}
```

**Backend API**:
- GET /api/tags returns BOTH AI tags and account tags
- Account tags have type='account' and name=account_id
- Frontend treats them identically - just clickable filters
- URL: `?tags=work&tags=urgent` (work is account, urgent is AI tag)

**Visual Distinction**:
- Account tags: Email icon prefix or "@" symbol
- AI tags: Existing semantic colors (urgent=red, work=blue, etc.)
- Both use same TagChip component
- Optional: Subsections within Tags ("Accounts" header, then "Categories" header)

**Example Tags List**:
```
Tags
  @ work (150)              ← Account tag (email icon)
  @ personal (75)           ← Account tag
  @ kc.calvelli@gmail.com  ← Account tag (full email)
  urgent (12)               ← AI tag (red)
  newsletter (45)           ← AI tag (grey)
  finance (8)               ← AI tag (green)
```

**Alternative considered**: Separate "Accounts" section
- Rejected: Violates tag-focused approach
- Rejected: Adds UI complexity
- Rejected: Would require separate state management

**Decision**: Single Tags section, visual indicators for account vs AI tags

## Data Flow Diagrams

### Bulk Delete Flow

```
User selects messages → Selection Store (Zustand)
                              ↓
User clicks "Delete" → Optimistic Update (remove from UI)
                              ↓
                       POST /api/messages/bulk/delete
                              ↓
                       Database Transaction
                              ↓
                       IMAP STORE +FLAGS (\Deleted)
                              ↓
                       IMAP EXPUNGE
                              ↓
                       Response: {deleted: X, errors: []}
                              ↓
On success: Clear selection, show toast
On error: Rollback UI, show error details
```

### IDLE Real-time Update Flow

```
IDLE Thread detects new mail
        ↓
Emit SSE event: {account_id, folder, count}
        ↓
Frontend EventSource receives event
        ↓
Invalidate React Query cache
        ↓
Auto-refetch message list
        ↓
UI updates with new messages
        ↓
Show toast: "3 new messages"
```

### Multi-folder Sync Flow

```
User triggers sync → ConfigLoader reads folders from config
                            ↓
For each account:
  For each folder in account.folders:
    ↓
    IMAP SELECT folder
    ↓
    IMAP SEARCH SINCE date
    ↓
    IMAP FETCH messages
    ↓
    Store in DB with folder field
    ↓
GET /api/folders → Return folder list with counts
```

## Performance Considerations

### Bulk Operations
- **Database**: Use transaction + prepared statements for bulk INSERT/UPDATE/DELETE
- **IMAP**: Use UID STORE for batch flag updates (single command)
- **UI**: Virtual scrolling for large message lists (react-window)

### Folder Queries
- **Index**: Create composite index on (account_id, folder, date)
- **Query**: Use LIMIT/OFFSET pagination per folder
- **Count**: Cache folder counts, update incrementally

### IDLE Connections
- **Resource usage**: 1 thread + 1 TCP connection per account
- **Scale**: Should handle 10-20 accounts without issue
- **Timeout**: Auto-disconnect after 12 hours idle, reconnect on demand

## Error Handling

### Bulk Operations
- **Partial failure**: Return detailed error per message
- **Transaction rollback**: Atomic DB updates (all-or-nothing)
- **Provider errors**: Retry IMAP commands with exponential backoff
- **UI feedback**: Show progress bar, success/error count

### IDLE Connection
- **Network failure**: Reconnect with exponential backoff
- **Server timeout**: Refresh IDLE every 29 minutes (RFC 2177)
- **Capability missing**: Fall back to polling (5 min interval)
- **Thread crash**: Log error, restart thread, notify user

### Folder Sync
- **Folder not found**: Log warning, skip folder
- **Permission denied**: Mark folder as unavailable
- **Name mismatch**: Use auto-detection, fall back to config

## Security Considerations

### Delete All
- **Confirmation required**: User must explicitly confirm with checkbox
- **Rate limiting**: Prevent accidental rapid deletion
- **Audit log**: Log all delete-all operations (future)

### Bulk Operations
- **Authorization**: Verify user owns all selected messages
- **Input validation**: Limit array size (max 500 messages per request)
- **SQL injection**: Use parameterized queries

## Migration Path

### Phase 4 → Phase 5
1. Run Alembic migration to add folder column
2. Update existing messages: `UPDATE messages SET folder = 'INBOX'`
3. Deploy backend with folder support
4. Deploy frontend with folder navigation
5. Enable IDLE in systemd service (restart required)

**Backward compatibility**: Phase 4 frontend continues to work with Phase 5 backend (ignores folder field).

## Future Enhancements (Post-Phase 5)

- Multi-folder IDLE (monitor Inbox + Sent simultaneously)
- Smart folders / saved searches
- Bulk move between folders
- Undo deletion (soft delete with TTL)
- Batch tag operations (add/remove tag from all matching filter)
- Archive functionality (move to Archive folder)
