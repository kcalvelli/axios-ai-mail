## ADDED Requirements

### Requirement: Automated Client Configuration
The system SHALL automatically configure a user-selected email client (`aerc` or `meli`) to work with the synchronized Maildirs.

#### Scenario: Enable Aerc
- **WHEN** the user sets `client = "aerc"`
- **THEN** `programs.aerc` is enabled
- **AND** every account in `axios-ai-mail` operates in Aerc without further config
- **AND** sending mail works via the pre-configured `msmtp` wrapper

#### Scenario: Enable Meli
- **WHEN** the user sets `client = "meli"`
- **THEN** `meli` is installed
- **AND** `~/.config/meli/config.toml` is generated with all accounts configured
