# Configuration Specification

## ADDED Requirements

### Requirement: Unified Tag Taxonomy Configuration

The system SHALL provide a unified tag taxonomy configuration that combines tag definitions with visual settings.

#### Scenario: User enables default tag taxonomy
- **WHEN** user sets `ai.useDefaultTags = true` (default)
- **THEN** the system loads the expanded 35-tag default taxonomy
- **AND** any tags in `ai.tags` are appended to defaults
- **AND** any tags in `ai.excludeTags` are removed from the final list

#### Scenario: User disables default tags
- **WHEN** user sets `ai.useDefaultTags = false`
- **THEN** the system only uses tags defined in `ai.tags`
- **AND** the `ai.excludeTags` option has no effect

#### Scenario: User adds custom tags
- **WHEN** user defines tags in `ai.tags`
- **AND** `ai.useDefaultTags = true`
- **THEN** custom tags are appended to the default taxonomy
- **AND** custom tags can override default descriptions if names match

### Requirement: Automatic Label Color Derivation

The system SHALL automatically derive label colors from tag categories with optional overrides.

#### Scenario: Tag receives default color by category
- **WHEN** a tag is used without explicit color configuration
- **THEN** the system assigns a color based on tag category
- **AND** Priority tags receive red
- **AND** Work tags receive blue
- **AND** Finance tags receive green
- **AND** Personal tags receive purple

#### Scenario: User overrides tag color
- **WHEN** user specifies a color in `ai.labelColors.{tagName}`
- **THEN** the override color is used instead of the derived default

#### Scenario: Custom tag receives hashed color
- **WHEN** a user-defined tag has no category match
- **THEN** the system assigns a color by hashing the tag name
- **AND** the color is deterministic (same tag always gets same color)

### Requirement: Simplified Sync Configuration

The system SHALL provide global sync configuration with per-account overrides.

#### Scenario: Global sync settings apply to all accounts
- **WHEN** user defines `sync.frequency` at top level
- **AND** account does not override sync settings
- **THEN** the global frequency applies to that account

#### Scenario: Account overrides global sync
- **WHEN** user defines `accounts.{name}.sync.frequency`
- **THEN** the account-specific frequency is used
- **AND** other sync settings fall back to global defaults

#### Scenario: Backward compatible account sync
- **WHEN** user has existing per-account sync configuration
- **THEN** the system continues to honor those settings
- **AND** a deprecation warning is logged

### Requirement: Label Prefix Simplification

The system SHALL use a single global label prefix rather than per-account prefixes.

#### Scenario: Global label prefix applies
- **WHEN** user defines `ai.labelPrefix`
- **THEN** all accounts use this prefix for AI-generated labels
- **AND** the default prefix is "AI"

#### Scenario: Per-account prefix deprecated
- **WHEN** user has existing `accounts.{name}.labels.prefix`
- **THEN** the system honors it with a deprecation warning
- **AND** suggests migration to global `ai.labelPrefix`
