## ADDED Requirements

### Requirement: Declarative Config Generation
The system SHALL generate tool-specific configurations (`mbsync`, `msmtp`, `notmuch`) from a single YAML/TOML source of truth.

#### Scenario: Generate all configs
- **WHEN** the generator is run with a valid `accounts.yaml`
- **THEN** it creates `.mbsyncrc`, `.msmtp-accounts`, and `.notmuch-config`
- **AND** it pulls credentials from `pass` or `gpg` as specified

### Requirement: Credential Integration
The system SHALL support fetching secrets from external password managers (e.g., `pass`) rather than storing them in the config file.

#### Scenario: Fetch token from pass
- **WHEN** an account specifies `password_command: "pass email/gmail"`
- **THEN** the generated config uses that command for authentication
