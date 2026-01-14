# Project Context: axios-ai-mail

## Purpose
A declarative, Notmuch-based TUI email workflow with local AI classification. The goal is to provide a sovereign, terminal-first email experience that leverages local LLMs for intelligent organization.

## Tech Stack
- **Languages**: Python (Agent and Generator), Go (Alternative for Generator)
- **Sync**: `mbsync` (isync)
- **Send**: `msmtp`
- **Search/Indexing**: `notmuch`
- **UI**: `aerc` or `alot` (TUI)
- **AI Engine**: `Ollama` (local LLMs like llama3 or mistral)
- **Authentication**: OAuth2 via `mutt_oauth2.py` (tokens in `pass`/`gpg`)
- **System Automation**: Systemd units (timers/services)
- **Deployment**: Nix Flake with NixOS/Home-Manager modules
- **Env Management**: Nix (Flakes)

## Project Conventions

### Code Style
- **Python**: PEP 8, formatted with Black/Ruff. Type hints are required.
- **Config**: Declarative YAML or TOML for user-facing account definitions.
- **Naming**: `snake_case` for Python scripts, `kebab-case` for systemd units and config files.

### Architecture Patterns
- **Declarative Configuration**: A central spec generates all tool-specific dotfiles.
- **Event-Driven AI**: Post-sync triggers for classifier agents.
- **Notmuch-Centric**: The database is the source of truth for all mail state and tags.
- **Separation of Concerns**: Sync, Indexing, Sending, and AI Classification are independent modules.

### Testing Strategy
- **Validation**: `openspec validate` for all architectural changes.
- **Integration**: Testing the generator output against mock schemas.
- **Dry-runs**: The AI agent should support a `--dry-run` mode to preview tags.

### Git Workflow
- **Spec-First**: Use OpenSpec workflow for all new features and changes.
- **Commit Messages**: Conventional commits.

## Domain Context
- **Nix-Centric Integration**: Designed to be integrated into Home-Manager or NixOS modules directly via a provided Flake. Email accounts are defined as Nix options.
- **Email Sovereignty**: Local storage (Maildir) and local processing.
- **TUI Focus**: Optimized for terminal users and keyboard-driven workflows.
- **NixOS Ecosystem**: Designed to be integrated into home-manager or NixOS modules.

## Important Constraints
- **Local AI Only**: No cloud LLMs; must run via Ollama or similar local backends.
- **OAuth2 Security**: No plain-text passwords; use system keychain or GPG.
- **Idempotency**: Config generation must be idempotent.

## External Dependencies
- `mbsync`
- `msmtp`
- `notmuch`
- `ollama`
- `pass` / `gpg`
- `mutt_oauth2.py` (Script)
