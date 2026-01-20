# Documentation Capability Delta

## ADDED Requirements

### Requirement: Single source of truth for each topic

Documentation MUST avoid duplicate guides with conflicting information.

#### Scenario: Quickstart consolidation
Given: A user searches for setup instructions
When: They look in the docs
Then: They find a single docs/QUICKSTART.md file (not multiple quickstart files)

#### Scenario: No conflicting port references
Given: A user follows setup instructions
When: They read about the web UI port
Then: All documentation consistently references port 8080

### Requirement: Comprehensive user guide exists

A user guide MUST document all features of both desktop and mobile interfaces.

#### Scenario: Desktop features documented
Given: A user wants to learn about desktop features
When: They read docs/USER_GUIDE.md
Then: They find documentation for sidebar, message list, reading pane, compose window

#### Scenario: Mobile features documented
Given: A user wants to learn about mobile features
When: They read docs/USER_GUIDE.md
Then: They find documentation for navigation drawer, swipe gestures, and selection mode

#### Scenario: Keyboard shortcuts documented
Given: A user wants to learn keyboard shortcuts
When: They read docs/USER_GUIDE.md
Then: They find a complete list of shortcuts (j/k, Enter, r, f, u, #, o, ?)

#### Scenario: Swipe gestures documented
Given: A user wants to learn mobile gestures
When: They read docs/USER_GUIDE.md
Then: They find documentation for swipe left (delete) and swipe right (select)

### Requirement: Configuration is fully documented

All configuration options MUST be documented in a single reference file.

#### Scenario: Nix module options documented
Given: A user wants to configure the application via Nix
When: They read docs/CONFIGURATION.md
Then: They find all home-manager module options explained

#### Scenario: Gmail account setup documented
Given: A user wants to configure a Gmail account
When: They read docs/CONFIGURATION.md
Then: They find OAuth setup instructions and configuration examples

#### Scenario: IMAP account setup documented
Given: A user wants to configure an IMAP account
When: They read docs/CONFIGURATION.md
Then: They find IMAP configuration options and provider-specific notes

#### Scenario: AI configuration documented
Given: A user wants to configure AI classification
When: They read docs/CONFIGURATION.md
Then: They find model recommendations and configuration options

### Requirement: Visual documentation with screenshots

Documentation MUST include current screenshots of the application UI.

#### Scenario: Desktop screenshots available
Given: A user wants to see the desktop interface
When: They view the documentation
Then: They see screenshots of message list, detail view, and compose window

#### Scenario: Mobile screenshots available
Given: A user wants to see the mobile interface
When: They view the documentation
Then: They see screenshots of message list, drawer, and swipe gestures

#### Scenario: Light and dark mode shown
Given: A user wants to see theme options
When: They view the documentation
Then: They see screenshots in both light and dark mode

### Requirement: README serves as effective landing page

The README MUST provide an accurate overview and quick entry points.

#### Scenario: Accurate feature list
Given: A prospective user reads the README
When: They look at the feature list
Then: All listed features are actually implemented (roadmap items marked as such)

#### Scenario: Current architecture shown
Given: A developer reads the README
When: They look at the architecture section
Then: The diagram reflects the current stack (no outdated TUI/notmuch references)

#### Scenario: Quick setup path
Given: A new user reads the README
When: They want to get started
Then: They are directed to docs/QUICKSTART.md with minimal friction

### Requirement: Developer documentation exists

Developer setup and contribution guidelines MUST be documented.

#### Scenario: Development setup documented
Given: A contributor wants to set up the dev environment
When: They read docs/DEVELOPMENT.md
Then: They find instructions for backend (Python/FastAPI) and frontend (React/Vite)

#### Scenario: Architecture documented
Given: A contributor wants to understand the system
When: They read docs/ARCHITECTURE.md
Then: They find diagrams and explanations of sync engine, AI pipeline, and API design

#### Scenario: Contribution guidelines exist
Given: A contributor wants to submit a PR
When: They read CONTRIBUTING.md
Then: They find code style, PR process, and commit message conventions

## REMOVED Requirements

### Requirement: Root-level quickstart files exist

QUICKSTART.md and QUICKSTART_WEB.md at the repository root are removed after content is merged into docs/QUICKSTART.md.

#### Scenario: No duplicate quickstart files
Given: A user browses the repository root
When: They look for quickstart documentation
Then: They are directed to docs/QUICKSTART.md (no root-level duplicates)

### Requirement: Outdated dev-notes remain in docs

Session logs and completion markers (PHASE1_COMPLETE.md, etc.) are moved to docs/archive/.

#### Scenario: Clean docs structure
Given: A user browses docs/
When: They look at the directory listing
Then: They see organized guides (not session logs or phase completion files)
