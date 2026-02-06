## ADDED Requirements

### Requirement: Account hidden setting

The system SHALL support a `hidden` boolean setting on accounts stored in `account.settings["hidden"]`. When `hidden` is `true`, the account is considered a hidden account. When `hidden` is `false` or not present, the account is considered visible.

#### Scenario: Hidden account has setting true
- **WHEN** an account has `settings["hidden"] = true`
- **THEN** the account is considered a hidden account

#### Scenario: Visible account has setting false
- **WHEN** an account has `settings["hidden"] = false`
- **THEN** the account is considered a visible account

#### Scenario: Account without hidden setting is visible
- **WHEN** an account does not have a `hidden` key in settings
- **THEN** the account is considered a visible account

### Requirement: List accounts filters hidden by default

The `GET /accounts` endpoint SHALL accept an optional `include_hidden` query parameter (boolean, default `false`). When `include_hidden` is `false`, the response SHALL exclude accounts where `settings["hidden"]` is `true`.

#### Scenario: Default account listing excludes hidden
- **WHEN** client calls `GET /accounts` without parameters
- **THEN** the response contains only visible accounts (hidden accounts are excluded)

#### Scenario: Include hidden parameter returns all accounts
- **WHEN** client calls `GET /accounts?include_hidden=true`
- **THEN** the response contains all accounts (both visible and hidden)

#### Scenario: Explicit exclude hidden
- **WHEN** client calls `GET /accounts?include_hidden=false`
- **THEN** the response contains only visible accounts

### Requirement: List messages filters hidden accounts by default

The `GET /messages` endpoint SHALL accept an optional `include_hidden_accounts` query parameter (boolean, default `false`). When `include_hidden_accounts` is `false`, the response SHALL exclude messages from accounts where `settings["hidden"]` is `true`.

#### Scenario: Default message listing excludes hidden account messages
- **WHEN** client calls `GET /messages` without the `include_hidden_accounts` parameter
- **THEN** the response excludes messages from hidden accounts

#### Scenario: Include hidden accounts parameter returns all messages
- **WHEN** client calls `GET /messages?include_hidden_accounts=true`
- **THEN** the response includes messages from all accounts (both visible and hidden)

#### Scenario: Explicit account filter overrides hidden filter
- **WHEN** client calls `GET /messages?account_id=<hidden_account_id>`
- **THEN** the response contains messages from that specific account regardless of hidden status

### Requirement: Account response includes hidden status

The account API response model SHALL include a `hidden` boolean field indicating whether the account is hidden.

#### Scenario: Hidden account response shows hidden true
- **WHEN** client fetches an account with `settings["hidden"] = true`
- **THEN** the response includes `"hidden": true`

#### Scenario: Visible account response shows hidden false
- **WHEN** client fetches an account without hidden setting or with `settings["hidden"] = false`
- **THEN** the response includes `"hidden": false`

### Requirement: Nix configuration supports hidden option

The Home-Manager module SHALL support a `hidden` boolean option on each account. When set to `true`, the generated config SHALL include `settings.hidden = true` for that account.

#### Scenario: Hidden account in Nix config
- **WHEN** user configures an account with `hidden = true;` in Nix
- **THEN** the generated config.yaml includes `hidden: true` in that account's settings

#### Scenario: Default visible account in Nix config
- **WHEN** user configures an account without the `hidden` option
- **THEN** the account is visible (no hidden key or `hidden: false` in settings)

### Requirement: Hidden accounts sync normally

Hidden accounts SHALL sync email and process classifications identically to visible accounts. The hidden setting MUST NOT affect sync behavior.

#### Scenario: Hidden account syncs email
- **WHEN** the sync service runs
- **THEN** hidden accounts sync their emails normally

#### Scenario: Hidden account messages get classified
- **WHEN** a message from a hidden account is synced
- **THEN** the message is classified by the AI like any other message
