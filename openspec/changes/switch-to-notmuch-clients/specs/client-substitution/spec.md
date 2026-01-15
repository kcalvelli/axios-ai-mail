## MODIFIED Requirements

### Requirement: Automated Client Configuration
The system SHALL automatically configure a user-selected **notmuch-native** email client (`alot` or `astroid`) to leverage the AI-tagged index.

#### Scenario: Enable Alot
- **WHEN** the user sets `client = "alot"`
- **THEN** `programs.alot` is enabled
- **AND** accounts are configured to send via `msmtp`
- **AND** the client opens the Notmuch database directly

#### Scenario: Enable Astroid
- **WHEN** the user sets `client = "astroid"`
- **THEN** `programs.astroid` is enabled
- **AND** the GUI is pre-configured with user identity and sending hooks

### REMOVED Requirements
- Support for `aerc` (replaced by `alot` for TUI).
- Support for `meli` (removed).
