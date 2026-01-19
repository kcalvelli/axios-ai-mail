# CLI Reference

Complete reference for the `axios-ai-mail` command-line interface.

## Overview

```bash
axios-ai-mail [OPTIONS] COMMAND [ARGS]
```

**Global Options:**
- `--version, -v` - Show version and exit
- `--verbose` - Enable verbose logging
- `--help` - Show help message

## Commands

### accounts

Account maintenance and diagnostics.

```bash
axios-ai-mail accounts COMMAND
```

#### accounts list

List all accounts with their status (active, orphaned, or new).

```bash
axios-ai-mail accounts list
```

- **Active**: Defined in Nix config and exists in database
- **Orphaned**: Exists in database but no longer in config
- **New**: In config but not yet synced

#### accounts check

Test connection and authentication for an account. Useful for diagnosing sync issues.

```bash
axios-ai-mail accounts check ACCOUNT_ID [-v|--verbose]
```

**Example:**
```bash
axios-ai-mail accounts check companies
axios-ai-mail accounts check companies --verbose
```

**Tests performed:**
1. Credential file access
2. Network connectivity to server
3. IMAP/Gmail authentication
4. Server capabilities (KEYWORD, IDLE)
5. Folder access
6. Message retrieval

#### accounts stats

Show detailed statistics for accounts.

```bash
axios-ai-mail accounts stats [ACCOUNT_ID]
```

**Examples:**
```bash
# Stats for all accounts
axios-ai-mail accounts stats

# Stats for specific account
axios-ai-mail accounts stats personal
```

#### accounts cleanup

Remove orphaned accounts and their messages.

```bash
axios-ai-mail accounts cleanup [--dry-run] [--force]
```

**Options:**
- `--dry-run, -n` - Show what would be deleted without deleting
- `--force, -f` - Skip confirmation prompts

#### accounts migrate

Migrate messages from one account to another. Useful when renaming accounts.

```bash
axios-ai-mail accounts migrate SOURCE DEST [--dry-run]
```

**Example:**
```bash
axios-ai-mail accounts migrate personal gmail
```

#### accounts delete

Delete an account and optionally its messages.

```bash
axios-ai-mail accounts delete ACCOUNT_ID [--keep-messages] [--force]
```

**Options:**
- `--keep-messages` - Keep messages (orphan them for later migration)
- `--force, -f` - Skip confirmation

---

### auth

Authentication setup for email accounts.

```bash
axios-ai-mail auth COMMAND
```

#### auth setup

Interactive account setup wizard. Detects accounts from your Nix config.

```bash
axios-ai-mail auth setup
```

This is the recommended way to set up authentication for new accounts.

#### auth gmail

Set up Gmail OAuth2 authentication.

```bash
axios-ai-mail auth gmail --account ACCOUNT_ID
```

**Example:**
```bash
axios-ai-mail auth gmail --account personal
```

**Process:**
1. Opens browser for Google authorization
2. Completes OAuth2 flow
3. Saves token to credential file

#### auth setup-imap

Set up IMAP password authentication.

```bash
axios-ai-mail auth setup-imap --email EMAIL [OPTIONS]
```

**Options:**
- `--email` - Email address (required)
- `--host` - IMAP server host (auto-detected if not specified)
- `--port` - IMAP port (default: 993)

**Example:**
```bash
axios-ai-mail auth setup-imap --email user@fastmail.com
```

**Process:**
1. Auto-detects IMAP server settings
2. Prompts for password
3. Tests connection
4. Saves credentials securely

---

### sync

Email synchronization commands.

```bash
axios-ai-mail sync COMMAND
```

#### sync run

Manually trigger email sync for one or all accounts.

```bash
axios-ai-mail sync run [--account ACCOUNT_ID] [--max N]
```

**Options:**
- `--account, -a` - Sync specific account (default: all accounts)
- `--max` - Maximum messages to fetch (default: 100)

**Examples:**
```bash
# Sync all accounts
axios-ai-mail sync run

# Sync specific account with more messages
axios-ai-mail sync run --account personal --max 200
```

#### sync reclassify

Reclassify all messages for an account using the AI classifier.

```bash
axios-ai-mail sync reclassify ACCOUNT_ID [--max N] [--dry-run]
```

**Options:**
- `--max` - Maximum messages to reclassify
- `--dry-run` - Preview changes without applying

**Example:**
```bash
axios-ai-mail sync reclassify personal --max 50
```

---

### status

View sync status and statistics.

```bash
axios-ai-mail status [--db PATH]
```

**Options:**
- `--db` - Database path (default: `~/.local/share/axios-ai-mail/mail.db`)

**Output includes:**
- Account list with last sync times
- Message counts per account
- Classification statistics
- Tag distribution
- Database size

---

### web

Start the web UI server.

```bash
axios-ai-mail web [OPTIONS]
```

**Options:**
- `--host, -h` - Host to bind to (default: 127.0.0.1)
- `--port, -p` - Port to listen on (default: 8080)
- `--reload` - Enable auto-reload for development

**Examples:**
```bash
# Start on default port
axios-ai-mail web

# Start on custom port
axios-ai-mail web --port 3000

# Development mode with auto-reload
axios-ai-mail web --reload
```

**Note:** The web server is typically managed by the NixOS/systemd service rather than run manually.

---

## Common Workflows

### Initial Setup

```bash
# 1. Set up authentication for accounts defined in Nix config
axios-ai-mail auth setup

# 2. Run initial sync
axios-ai-mail sync run --max 200

# 3. Check status
axios-ai-mail status
```

### Troubleshooting an Account

```bash
# 1. Check account connection
axios-ai-mail accounts check myaccount --verbose

# 2. If working, try manual sync
axios-ai-mail sync run --account myaccount

# 3. Check for errors in logs
journalctl -u axios-ai-mail-web -f
```

### Rename an Account

```bash
# 1. Update Nix config with new account ID
# 2. Rebuild: sudo nixos-rebuild switch

# 3. Migrate messages from old to new
axios-ai-mail accounts migrate old_name new_name

# 4. Clean up orphaned account
axios-ai-mail accounts cleanup
```

### Re-classify Messages After Config Change

```bash
# After updating custom tags in Nix config
axios-ai-mail sync reclassify personal --max 500
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AXIOS_AI_MAIL_DB` | Database file path | `~/.local/share/axios-ai-mail/mail.db` |
| `AXIOS_AI_MAIL_CONFIG` | Config file path | `~/.config/axios-ai-mail/config.yaml` |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Configuration error |
| 3 | Authentication error |
| 4 | Network/connection error |
