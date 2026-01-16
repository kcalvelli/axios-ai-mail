# Quick Start Guide

## Development Setup

### 1. Enter Development Environment

```bash
cd /home/keith/Projects/axios-ai-mail
nix develop
```

This will:
- Create a Python virtual environment in `./.venv`
- Install the package in editable mode with dev dependencies
- Make the `axios-ai-mail` command available

### 2. Verify Installation

```bash
axios-ai-mail --version
# Should output: axios-ai-mail version 2.0.0

axios-ai-mail --help
# Shows available commands
```

## First-Time Setup

### 3. Set Up Gmail OAuth2

```bash
# Run the interactive OAuth setup wizard
axios-ai-mail auth setup gmail --output ~/gmail-oauth-token.json
```

This will:
1. Guide you through creating OAuth credentials in Google Cloud Console
2. Open your browser for authorization
3. Save the OAuth token to `~/gmail-oauth-token.json`

**Important**: Keep this file secure! It contains your Gmail access credentials.

### 4. Encrypt Your Credentials (Optional but Recommended)

#### Using sops-nix

```bash
# First time setup
sops ~/gmail-oauth-token.json
# Encrypts the file in place
```

#### Using agenix

```bash
# Encrypt with age
age -e -o ~/gmail-oauth-token.age ~/gmail-oauth-token.json
rm ~/gmail-oauth-token.json
```

#### Using plain file (less secure)

```bash
# Just ensure proper permissions
chmod 600 ~/gmail-oauth-token.json
```

### 5. Test Sync Manually

Since the NixOS module isn't ready yet, you can test the core functionality:

```python
# In the dev shell
python3

from pathlib import Path
from axios_ai_mail.db.database import Database
from axios_ai_mail.providers.implementations.gmail import GmailProvider, GmailConfig
from axios_ai_mail.ai_classifier import AIClassifier, AIConfig
from axios_ai_mail.sync_engine import SyncEngine

# Initialize database
db_path = Path.home() / ".local/share/axios-ai-mail/test.db"
db_path.parent.mkdir(parents=True, exist_ok=True)
db = Database(db_path)

# Create account
db.create_or_update_account(
    account_id="personal",
    name="My Gmail",
    email="your-email@gmail.com",
    provider="gmail",
    settings={
        "oauth_token_file": str(Path.home() / "gmail-oauth-token.json"),
        "label_prefix": "AI",
        "ai_model": "llama3.2",
        "ai_endpoint": "http://localhost:11434",
    }
)

# Initialize Gmail provider
gmail_config = GmailConfig(
    account_id="personal",
    email="your-email@gmail.com",
    credential_file=str(Path.home() / "gmail-oauth-token.json"),
    label_prefix="AI",
)
provider = GmailProvider(gmail_config)
provider.authenticate()

# Initialize AI classifier (make sure Ollama is running!)
ai_config = AIConfig(
    model="llama3.2",
    endpoint="http://localhost:11434"
)
ai_classifier = AIClassifier(ai_config)

# Create sync engine
sync_engine = SyncEngine(
    provider=provider,
    database=db,
    ai_classifier=ai_classifier,
    label_prefix="AI"
)

# Run sync (fetch up to 10 messages)
result = sync_engine.sync(max_messages=10)
print(result)
```

### 6. Check Status

```bash
axios-ai-mail status --db ~/.local/share/axios-ai-mail/test.db
```

## Prerequisites

### Ensure Ollama is Running

```bash
# Start Ollama server
ollama serve

# In another terminal, pull a model
ollama pull llama3.2
```

### Gmail API Setup

Before running OAuth setup, you need to:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select existing)
3. Enable Gmail API: https://console.cloud.google.com/apis/library/gmail.googleapis.com
4. Create OAuth 2.0 Client ID:
   - Application type: **Desktop app**
   - Name: `axios-ai-mail`
5. Download credentials (you'll need Client ID and Client Secret)

The `axios-ai-mail auth setup gmail` command will prompt you for these values.

## Development Commands

### Code Quality

```bash
# Format code
black .

# Lint code
ruff check .

# Type checking
mypy src/axios_ai_mail

# Run tests (when we write them)
pytest
```

### Testing Components Individually

```bash
# Test database
python3 -c "from axios_ai_mail.db.database import Database; db = Database('/tmp/test.db'); print('DB OK')"

# Test credentials
python3 -c "from axios_ai_mail.credentials import Credentials; token = Credentials.load_oauth_token('~/gmail-oauth-token.json'); print('Credentials OK')"

# Test Gmail provider (requires valid token)
python3 -c "
from axios_ai_mail.providers.implementations.gmail import GmailProvider, GmailConfig
config = GmailConfig('test', 'test@gmail.com', '~/gmail-oauth-token.json')
provider = GmailProvider(config)
provider.authenticate()
print('Gmail provider OK')
"

# Test AI classifier (requires Ollama running)
python3 -c "
from axios_ai_mail.ai_classifier import AIClassifier, AIConfig
from axios_ai_mail.providers.base import Message
from datetime import datetime
config = AIConfig(model='llama3.2')
classifier = AIClassifier(config)
msg = Message('test', 'thread', 'Test subject', 'sender@example.com', ['recipient@example.com'], datetime.now(), 'Test snippet')
result = classifier.classify(msg)
print(f'Classification OK: {result}')
"
```

## Troubleshooting

### "Module not found" errors

Make sure you're in the dev shell and the venv is activated:
```bash
which python3  # Should show .venv path
```

If not, re-enter the dev shell:
```bash
exit
nix develop
```

### OAuth token issues

Check file permissions:
```bash
ls -la ~/gmail-oauth-token.json
# Should show: -rw------- (600)
```

Re-run auth setup if token is invalid:
```bash
axios-ai-mail auth setup gmail --output ~/gmail-oauth-token.json
```

### Ollama connection errors

Ensure Ollama is running:
```bash
# Check if Ollama is responding
curl http://localhost:11434/api/tags

# Start Ollama if not running
ollama serve
```

### Gmail API errors

Common issues:
- **Quota exceeded**: Wait 24 hours or request quota increase
- **Invalid credentials**: Re-create OAuth app in Google Cloud Console
- **Scope error**: Make sure OAuth app has Gmail API scope enabled

## Next Steps

Once manual testing works:
1. Update NixOS module for declarative configuration
2. Test with systemd services
3. Add more accounts (IMAP, Outlook)
4. Build Web UI (Phase 2)

## Getting Help

- Check `IMPLEMENTATION.md` for architecture details
- Check `PHASE1_COMPLETE.md` for feature overview
- Check `modules/home-manager/README.md` for NixOS module plans
- Review code comments in `src/axios_ai_mail/`
