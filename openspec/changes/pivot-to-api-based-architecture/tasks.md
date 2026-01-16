# Implementation Tasks

## 0. Planning & Preparation
- [ ] 0.1 Review and approve this proposal
- [ ] 0.2 Create feature branch `pivot-to-api-architecture`
- [ ] 0.3 Archive existing proposals (`integrate-email-clients`, `switch-to-notmuch-clients`, `lifecycle-aware-tagging-v2`)
- [ ] 0.4 Update README with v2 architecture overview

## 1. Core Infrastructure

### 1.1 Database Layer
- [ ] 1.1.1 Create SQLite schema (`src/db/schema.sql`)
- [ ] 1.1.2 Implement database abstraction (`src/db/database.py`)
- [ ] 1.1.3 Add migration system for schema versioning
- [ ] 1.1.4 Implement FTS5 search integration
- [ ] 1.1.5 Add encryption for OAuth tokens using system keychain
- [ ] 1.1.6 Write unit tests for database operations

### 1.2 Credential Storage
- [ ] 1.2.1 Implement secure credential loader (`src/credentials.py`)
- [ ] 1.2.2 Add support for reading sops-nix decrypted files
- [ ] 1.2.3 Add support for reading agenix decrypted files
- [ ] 1.2.4 Add support for systemd LoadCredential paths
- [ ] 1.2.5 Implement file permission validation (600 check)
- [ ] 1.2.6 Add OAuth token refresh and write-back logic
- [ ] 1.2.7 Write credential loader tests with mock files

### 1.3 Email Provider Abstraction
- [ ] 1.3.1 Define `EmailProvider` protocol/interface (`src/providers/base.py`)
- [ ] 1.3.2 Implement `Message` and `Classification` data classes
- [ ] 1.3.3 Create provider registry for dynamic loading
- [ ] 1.3.4 Add provider-agnostic label mapping utilities
- [ ] 1.3.5 Write unit tests for base abstractions

### 1.4 Configuration System
- [ ] 1.4.1 Define new config schema (`Config` dataclass in `src/config.py`)
- [ ] 1.4.2 Implement config validation with Pydantic
- [ ] 1.4.3 Add config file loader (YAML/TOML for runtime)
- [ ] 1.4.4 Add credential file path resolution
- [ ] 1.4.5 Write config validation tests

## 2. Email Provider Implementations

### 2.1 Gmail Provider (Priority: MVP)
- [ ] 2.1.1 Set up Gmail API client (`src/providers/gmail.py`)
- [ ] 2.1.2 Implement OAuth2 flow (authorization + token refresh)
- [ ] 2.1.3 Implement `fetch_messages()` using `users.messages.list`
- [ ] 2.1.4 Implement `update_labels()` using `users.messages.modify`
- [ ] 2.1.5 Implement `create_label()` using `users.labels.create`
- [ ] 2.1.6 Add support for Gmail Pub/Sub webhooks (optional)
- [ ] 2.1.7 Implement incremental sync using historyId
- [ ] 2.1.8 Add rate limiting and exponential backoff
- [ ] 2.1.9 Write integration tests with mock Gmail API
- [ ] 2.1.10 Test with real Gmail account (personal testing)

### 2.2 IMAP Provider (Priority: Phase 3)
- [ ] 2.2.1 Implement basic IMAP connection (`src/providers/imap.py`)
- [ ] 2.2.2 Detect IMAP extensions (X-GM-LABELS, METADATA, KEYWORD)
- [ ] 2.2.3 Implement `fetch_messages()` with IMAP SEARCH
- [ ] 2.2.4 Implement label mapping via IMAP keywords or flags
- [ ] 2.2.5 Add IDLE support for real-time notifications
- [ ] 2.2.6 Write tests with mock IMAP server

### 2.3 Outlook Provider (Priority: Phase 3)
- [ ] 2.3.1 Set up Microsoft Graph API client (`src/providers/outlook.py`)
- [ ] 2.3.2 Implement OAuth2 flow for Microsoft accounts
- [ ] 2.3.3 Implement `fetch_messages()` using `/me/messages`
- [ ] 2.3.4 Implement category updates using `PATCH /messages/{id}`
- [ ] 2.3.5 Implement incremental sync using deltaLink
- [ ] 2.3.6 Add support for Graph API webhooks
- [ ] 2.3.7 Write integration tests with mock Graph API

## 3. AI Classification Engine

### 3.1 Core Classifier
- [ ] 3.1.1 Adapt existing `ai_classifier.py` to work with `Message` objects
- [ ] 3.1.2 Update prompt engineering for JSON output
- [ ] 3.1.3 Add structured response parsing and validation
- [ ] 3.1.4 Implement tag normalization (lowercase, dedupe, etc.)
- [ ] 3.1.5 Add configurable tag taxonomy (user-defined categories)
- [ ] 3.1.6 Implement confidence scoring for classifications
- [ ] 3.1.7 Write unit tests for classification logic

### 3.2 Feedback Loop
- [ ] 3.2.1 Implement feedback storage in database
- [ ] 3.2.2 Add API endpoint for user to correct tags
- [ ] 3.2.3 Create report of common misclassifications
- [ ] 3.2.4 (Optional) Fine-tune prompt based on feedback patterns

### 3.3 Performance Optimization
- [ ] 3.3.1 Add batch classification (process multiple messages at once)
- [ ] 3.3.2 Implement classification queue with priority
- [ ] 3.3.3 Add timeout handling for slow Ollama responses
- [ ] 3.3.4 Measure and log classification latency

## 4. Sync Engine

### 4.1 Core Sync Logic
- [ ] 4.1.1 Implement `SyncEngine` class (`src/sync_engine.py`)
- [ ] 4.1.2 Add fetch → classify → push pipeline
- [ ] 4.1.3 Implement sync state tracking (last sync time, cursors)
- [ ] 4.1.4 Add error handling and retry logic
- [ ] 4.1.5 Implement conflict resolution (user changed label manually)
- [ ] 4.1.6 Add logging for sync operations
- [ ] 4.1.7 Write integration tests for sync flow

### 4.2 Scheduling
- [ ] 4.2.1 Implement timer-based polling (configurable interval)
- [ ] 4.2.2 Add webhook receiver for real-time notifications (Gmail Pub/Sub)
- [ ] 4.2.3 Implement backoff on API errors
- [ ] 4.2.4 Add manual sync trigger endpoint

### 4.3 Multi-Account Support
- [ ] 4.3.1 Implement account manager (load/store multiple accounts)
- [ ] 4.3.2 Run sync for each account in parallel (thread pool)
- [ ] 4.3.3 Add per-account error isolation

## 5. REST API Server

### 5.1 Core API
- [ ] 5.1.1 Set up FastAPI application (`src/api_server.py`)
- [ ] 5.1.2 Implement `GET /api/messages` (list with filters)
- [ ] 5.1.3 Implement `GET /api/messages/{id}` (single message detail)
- [ ] 5.1.4 Implement `POST /api/sync` (trigger manual sync)
- [ ] 5.1.5 Implement `PUT /api/messages/{id}/tags` (update tags)
- [ ] 5.1.6 Implement `GET /api/accounts` (list configured accounts)
- [ ] 5.1.7 Implement `GET /api/stats` (inbox count, todo count, etc.)
- [ ] 5.1.8 Add authentication/authorization (optional for localhost)
- [ ] 5.1.9 Add CORS middleware for frontend
- [ ] 5.1.10 Write API tests with TestClient

### 5.2 WebSocket Support
- [ ] 5.2.1 Implement WebSocket endpoint `/ws`
- [ ] 5.2.2 Broadcast sync events to connected clients
- [ ] 5.2.3 Send real-time classification updates
- [ ] 5.2.4 Add connection management (reconnect on disconnect)

### 5.3 API Documentation
- [ ] 5.3.1 Generate OpenAPI schema (automatic with FastAPI)
- [ ] 5.3.2 Add Swagger UI at `/docs`
- [ ] 5.3.3 Document authentication flow for OAuth setup

## 6. Web UI

### 6.1 Project Setup
- [ ] 6.1.1 Initialize React + TypeScript + Vite project (`web/`)
- [ ] 6.1.2 Set up Tailwind CSS for styling
- [ ] 6.1.3 Configure React Query for API state management
- [ ] 6.1.4 Configure Zustand for client state
- [ ] 6.1.5 Set up React Router for navigation

### 6.2 Core Components
- [ ] 6.2.1 Create `MessageList` component (displays messages with tags)
- [ ] 6.2.2 Create `MessageItem` component (single message row)
- [ ] 6.2.3 Create `TagBadge` component (display individual tag)
- [ ] 6.2.4 Create `TagFilter` sidebar (filter by tag)
- [ ] 6.2.5 Create `SearchBar` component (full-text search)
- [ ] 6.2.6 Create `LoadingSpinner` and error states

### 6.3 Features
- [ ] 6.3.1 Implement tag filtering (click tag to filter)
- [ ] 6.3.2 Implement multi-select for batch operations
- [ ] 6.3.3 Add tag editing (add/remove tags on messages)
- [ ] 6.3.4 Add search with debouncing
- [ ] 6.3.5 Add infinite scroll for message list
- [ ] 6.3.6 Add keyboard shortcuts (vim-style navigation)

### 6.4 Settings Page
- [ ] 6.4.1 Create `Settings` component
- [ ] 6.4.2 Add account management (view configured accounts)
- [ ] 6.4.3 Add AI preferences (model selection, tag taxonomy)
- [ ] 6.4.4 Add sync settings (frequency, webhook enable/disable)
- [ ] 6.4.5 Add theme toggle (light/dark mode)

### 6.5 Real-Time Updates
- [ ] 6.5.1 Set up WebSocket connection
- [ ] 6.5.2 Update message list on sync events
- [ ] 6.5.3 Show toast notifications for new classified emails
- [ ] 6.5.4 Add connection status indicator

### 6.6 Testing & Polish
- [ ] 6.6.1 Write component tests with React Testing Library
- [ ] 6.6.2 Add error boundaries for graceful failures
- [ ] 6.6.3 Implement responsive design (mobile-friendly)
- [ ] 6.6.4 Add loading states for all async operations
- [ ] 6.6.5 Optimize bundle size (lazy loading, code splitting)

## 7. CLI Tools

### 7.1 OAuth Setup Wizard
- [ ] 7.1.1 Create `axios-ai-mail auth setup` command
- [ ] 7.1.2 Guide user through OAuth app creation (Gmail)
- [ ] 7.1.3 Handle OAuth callback and token storage
- [ ] 7.1.4 Generate config snippet for home.nix
- [ ] 7.1.5 Add support for Outlook OAuth setup

### 7.2 Management Commands
- [ ] 7.2.1 Create `axios-ai-mail sync` command (manual sync trigger)
- [ ] 7.2.2 Create `axios-ai-mail reclassify` command (re-run AI on all messages)
- [ ] 7.2.3 Create `axios-ai-mail reset` command (clear database, resync)
- [ ] 7.2.4 Create `axios-ai-mail status` command (show sync state, stats)
- [ ] 7.2.5 Create `axios-ai-mail export` command (export classifications to JSON)

### 7.3 Credential Management
- [ ] 7.3.1 Create `axios-ai-mail creds validate` command (check all credential files readable)
- [ ] 7.3.2 Create `axios-ai-mail creds refresh` command (force OAuth token refresh)
- [ ] 7.3.3 Add credential file path resolution debugging

## 8. NixOS Module

### 8.1 Module Definition
- [ ] 8.1.1 Create new `modules/home-manager.nix` with updated options
- [ ] 8.1.2 Define `programs.axios-ai-mail.accounts.<name>` schema
- [ ] 8.1.3 Define provider-specific options (Gmail, IMAP, Outlook)
- [ ] 8.1.4 Define `programs.axios-ai-mail.ui` options
- [ ] 8.1.5 Define `programs.axios-ai-mail.ai` options (including custom tag taxonomy)
- [ ] 8.1.6 Add build-time validation for account configuration
- [ ] 8.1.7 Add assertions for required credential files
- [ ] 8.1.8 Implement support for sops-nix secret paths
- [ ] 8.1.9 Implement support for agenix secret paths
- [ ] 8.1.10 Implement support for systemd LoadCredential

### 8.2 Service Generation
- [ ] 8.2.1 Generate `axios-ai-mail.service` (backend server)
- [ ] 8.2.2 Generate `axios-ai-mail-sync.timer` (periodic sync)
- [ ] 8.2.3 Add systemd dependencies (ollama.service)
- [ ] 8.2.4 Configure secrets management for OAuth tokens
- [ ] 8.2.5 Add log rotation for service logs

### 8.3 Package Updates
- [ ] 8.3.1 Update `flake.nix` with new Python dependencies
- [ ] 8.3.2 Add FastAPI, SQLAlchemy, google-api-python-client to package
- [ ] 8.3.3 Build web UI and include in package
- [ ] 8.3.4 Update flake outputs with new CLI tools

### 8.4 Testing
- [ ] 8.4.1 Test module on NixOS VM
- [ ] 8.4.2 Test with multiple accounts
- [ ] 8.4.3 Test service startup and restart
- [ ] 8.4.4 Verify OAuth token encryption

## 9. Documentation

### 9.1 User Documentation
- [ ] 9.1.1 Update README with new architecture overview
- [ ] 9.1.2 Write OAuth setup guide with screenshots
- [ ] 9.1.3 Document configuration options (all fields explained)
- [ ] 9.1.4 Write secrets management guide (sops-nix, agenix, systemd-creds examples)
- [ ] 9.1.5 Add troubleshooting guide (common errors, fixes)
- [ ] 9.1.6 Document declarative account configuration patterns

### 9.2 Developer Documentation
- [ ] 9.2.1 Document provider interface (how to add new providers)
- [ ] 9.2.2 Document database schema
- [ ] 9.2.3 Document API endpoints (supplement OpenAPI)
- [ ] 9.2.4 Add architecture diagrams to design.md
- [ ] 9.2.5 Document testing strategy

### 9.3 Examples
- [ ] 9.3.1 Provide example Gmail config
- [ ] 9.3.2 Provide example Outlook config
- [ ] 9.3.3 Provide example IMAP config (Fastmail)
- [ ] 9.3.4 Provide multi-account example

## 10. Testing & Quality

### 10.1 Unit Tests
- [ ] 10.1.1 Database layer (100% coverage)
- [ ] 10.1.2 Provider implementations (mock APIs)
- [ ] 10.1.3 AI classifier (various message types)
- [ ] 10.1.4 Sync engine (edge cases, errors)
- [ ] 10.1.5 API endpoints (all routes)

### 10.2 Integration Tests
- [ ] 10.2.1 End-to-end sync flow (fetch → classify → push)
- [ ] 10.2.2 Multi-account sync
- [ ] 10.2.3 WebSocket real-time updates
- [ ] 10.2.4 OAuth token refresh flow
- [ ] 10.2.5 Migration from v1 to v2

### 10.3 Performance Testing
- [ ] 10.3.1 Benchmark sync speed (1000 messages)
- [ ] 10.3.2 Benchmark classification throughput
- [ ] 10.3.3 Measure API response times
- [ ] 10.3.4 Profile memory usage

### 10.4 User Acceptance Testing
- [ ] 10.4.1 Test with real Gmail account (personal)
- [ ] 10.4.2 Test with real Outlook account (if available)
- [ ] 10.4.3 Test on fresh NixOS installation
- [ ] 10.4.4 Gather feedback from 3-5 beta testers

## 11. Deployment & Release

### 11.1 Pre-Release
- [ ] 11.1.1 Run full test suite and fix all failures
- [ ] 11.1.2 Validate all OpenSpec requirements
- [ ] 11.1.3 Update CHANGELOG with all changes
- [ ] 11.1.4 Tag v2.0.0-rc1 release candidate

### 11.2 Beta Testing
- [ ] 11.2.1 Announce beta in README and GitHub discussions
- [ ] 11.2.2 Gather feedback on setup process
- [ ] 11.2.3 Fix critical bugs discovered in beta
- [ ] 11.2.4 Iterate on UI based on feedback

### 11.3 Release
- [ ] 11.3.1 Tag v2.0.0 stable release
- [ ] 11.3.2 Update flake lock
- [ ] 11.3.3 Publish release notes on GitHub
- [ ] 11.3.4 Update README with v2 as default
- [ ] 11.3.5 Archive v1 documentation to wiki

### 11.4 Post-Release
- [ ] 11.4.1 Monitor GitHub issues for bug reports
- [ ] 11.4.2 Respond to user questions
- [ ] 11.4.3 Plan v2.1 with community feature requests
- [ ] 11.4.4 Archive this proposal using `openspec archive`

## 12. Optional Enhancements (Post-MVP)

- [ ] 12.1 Browser extension for Gmail/Outlook.com
- [ ] 12.2 Mobile companion app (React Native)
- [ ] 12.3 Docker deployment option
- [ ] 12.4 Advanced filtering and rules engine
- [ ] 12.5 Email analytics dashboard
- [ ] 12.6 Collaborative features (shared tags, team inbox)
- [ ] 12.7 Plugin system for custom classifiers
