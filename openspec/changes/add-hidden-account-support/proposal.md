## Why

Agent accounts (used by AI assistants like GenX64/openclaw) sync emails to the same database as user accounts, causing agent emails to clutter the main inbox view. Users need a way to hide these "system" or "agent" accounts from the normal email client interface while still allowing them to sync and be processed in the background.

## What Changes

- Add a `hidden` boolean setting to account configuration that marks accounts as invisible in the UI
- Backend API filters hidden accounts from default account listings
- Backend API filters messages from hidden accounts from default inbox/message views
- Add Nix configuration option to mark accounts as hidden
- Frontend respects hidden flag when displaying accounts and messages
- Hidden accounts still sync normally and can be accessed via explicit filtering

## Capabilities

### New Capabilities

- `hidden-accounts`: Support for marking accounts as hidden from the default UI while maintaining full sync and background processing capabilities

### Modified Capabilities

(none - this adds new functionality without changing existing spec requirements)

## Impact

- **Database**: Utilizes existing `settings` JSON field on Account model (no migration needed)
- **Backend API**:
  - `GET /accounts` - adds `include_hidden` query param (defaults to false)
  - `GET /messages` - filters out messages from hidden accounts by default
  - Account serialization includes `hidden` field
- **Frontend**:
  - Account list excludes hidden accounts
  - Message list excludes messages from hidden accounts
  - TypeScript types updated to include `hidden` field
- **Configuration**:
  - Home-manager module: new `hidden` boolean option per account
  - Config YAML generation includes hidden setting in account settings
