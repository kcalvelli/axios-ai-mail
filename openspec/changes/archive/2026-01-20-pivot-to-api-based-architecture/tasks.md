# Implementation Tasks

> **STATUS: COMPLETE**
>
> Architecture pivot from notmuch/Maildir to API-based system completed.
> FastAPI backend + React frontend, with Gmail and IMAP providers.

## 1. Core Infrastructure

### 1.1 Database Layer
- [x] SQLite database with SQLAlchemy ORM
- [x] Full-text search via FTS5
- [x] Account, Message, ClassificationResult models
- [x] PendingOperation model for async provider sync

### 1.2 Credential Storage
- [x] Nix-native configuration via Home Manager module
- [x] Support for agenix-encrypted secrets
- [x] OAuth token files for Gmail
- [x] Password files for IMAP

### 1.3 Email Provider Abstraction
- [x] BaseEmailProvider protocol
- [x] GmailProvider implementation
- [x] IMAPProvider implementation
- [x] Provider factory from account config

### 1.4 Configuration System
- [x] Nix module generates JSON config
- [x] Config loaded at runtime
- [x] Account, AI, sync settings

## 2. Email Provider Implementations

### 2.1 Gmail Provider
- [x] OAuth2 authentication with token refresh
- [x] fetch_messages() via Gmail API
- [x] mark_read/mark_unread via label modification
- [x] trash/restore/delete operations
- [x] Label/folder mapping
- [x] Send message support

### 2.2 IMAP Provider
- [x] IMAP connection with authentication
- [x] fetch_messages() with folder support
- [x] mark_read/mark_unread via STORE FLAGS
- [x] trash/restore/delete operations
- [x] Multi-folder sync (INBOX, SENT, DRAFTS, TRASH)
- [x] Send message via SMTP

## 3. AI Classification

- [x] Ollama integration for local LLM
- [x] Tag taxonomy (35 default tags)
- [x] Confidence scoring
- [x] Classification during sync
- [x] Labels synced to providers

## 4. Sync Engine

- [x] Systemd timer-based sync
- [x] Async pending operations queue
- [x] Smart deduplication (opposite ops cancel)
- [x] Per-account sync support
- [x] WebSocket notifications on sync

## 5. REST API (FastAPI)

- [x] GET /api/messages with filtering
- [x] GET /api/messages/{id}/body
- [x] POST /api/messages/{id}/read
- [x] DELETE /api/messages/{id}
- [x] POST /api/messages/bulk/*
- [x] GET /api/accounts
- [x] GET /api/tags
- [x] POST /api/compose (send)
- [x] POST /api/drafts
- [x] WebSocket endpoint

## 6. Web UI (React)

- [x] Material-UI 3 component library
- [x] Responsive sidebar navigation
- [x] Message list with tag filtering
- [x] Full message detail view
- [x] HTML email rendering with dark mode
- [x] Compose/Reply/Forward
- [x] Draft auto-save
- [x] Bulk selection and actions
- [x] Mobile swipe gestures
- [x] PWA support
- [x] Keyboard shortcuts

## 7. NixOS Integration

- [x] Home Manager module for user config
- [x] NixOS module for system services
- [x] Overlay for package
- [x] Systemd web service
- [x] Systemd sync timer
- [x] Tailscale Serve integration option
