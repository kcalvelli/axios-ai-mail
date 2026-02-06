## Context

Agent accounts (e.g., AI assistants using openclaw/GenX64) need to sync emails for processing, but their messages clutter the main inbox view alongside user emails. The current architecture treats all accounts identically - there's no concept of account visibility or type.

The Account model already has a `settings: Dict` JSON field that stores arbitrary configuration. This is ideal for adding visibility metadata without a schema migration.

**Current state:**
- `GET /accounts` returns all accounts unconditionally
- `GET /messages` can filter by `account_id` but has no visibility-aware default
- Frontend displays all accounts and messages from all accounts
- Nix config has no visibility option

## Goals / Non-Goals

**Goals:**
- Allow accounts to be marked as "hidden" via Nix configuration
- Hidden accounts are excluded from default API responses
- Hidden account messages are excluded from default inbox view
- Hidden accounts still sync normally (background processing unaffected)
- Explicit `include_hidden=true` parameter allows access when needed

**Non-Goals:**
- Complex permission/role system (just a boolean for now)
- Separate UI for viewing hidden accounts (can add later if needed)
- Account "types" beyond hidden/visible (keep it simple)

## Decisions

### 1. Store visibility in `account.settings["hidden"]`

**Decision:** Use the existing `settings` JSON field with a `hidden` boolean key.

**Alternatives considered:**
- Add a dedicated `hidden` column to Account model - requires Alembic migration
- Add an `account_type` enum - over-engineering for the current need

**Rationale:** The settings field exists precisely for flexible metadata. No migration needed. If we need more sophisticated visibility (roles, types) later, we can add it.

### 2. Filter at the API layer, not database layer

**Decision:** The `list_accounts()` and `query_messages()` functions remain unchanged. Filtering happens in API route handlers.

**Rationale:**
- Keeps database layer simple and unchanged
- API explicitly controls what gets filtered and when
- Sync service can access all accounts without special handling

### 3. Default to excluding hidden accounts and messages

**Decision:** API endpoints default to `include_hidden=false`. Callers must explicitly request hidden content.

**Rationale:** This is the whole point - keep agent accounts out of the normal view. Anyone who needs hidden accounts (admin tools, debugging) can pass the parameter.

### 4. Nix option as `hidden = true;` in account config

**Decision:** Add a simple boolean option to the account submodule.

**Rationale:** Matches the backend design. User sets `hidden = true` in their account definition, it propagates to settings during config generation.

## Risks / Trade-offs

**Risk:** User forgets they have hidden accounts and wonders why emails aren't showing.
**Mitigation:** Document clearly. Consider adding a badge/indicator in AccountsPage showing "N hidden accounts" if any exist.

**Risk:** Sync failures for hidden accounts go unnoticed.
**Mitigation:** Sync service logs are unchanged. Hidden accounts still appear in `/accounts?include_hidden=true` for debugging.

**Trade-off:** No separate view for hidden accounts.
**Accepted:** Users can always pass `include_hidden=true` via API or we can add a toggle later. YAGNI for now.
