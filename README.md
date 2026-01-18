# axios-ai-mail

**AI-powered inbox organizer for NixOS and Home Manager users.**

axios-ai-mail is a declarative email management system that combines direct provider integration (Gmail, IMAP) with local AI classification to automatically organize your inbox. Messages are tagged, prioritized, and organized—all locally, with zero cloud dependencies for AI processing.

> **Note:** This application is designed for users of [axiOS](https://github.com/kcalvelli/axios), a NixOS configuration framework. The instructions below assume axiOS conventions (agenix for secrets, `~/.config/nixos_config` for configuration). Non-axiOS NixOS users may need to adapt paths and secret management approaches to their setup.

## Product Scope

**axios-ai-mail is an inbox organizer, not a spam filter.**

### What This Product Does ✅
- **Classifies legitimate mail** that reached your inbox
- **Organizes messages** with AI-powered tags (work, finance, personal, etc.)
- **Identifies low-priority content** like promotional emails and newsletters ("junk" tag)
- **Helps you prioritize** what matters in your inbox
- **Provides a clean web UI** for browsing, searching, and managing messages
- **Supports bulk operations** for efficient inbox management

### What This Product Doesn't Do ❌
- **Does not filter spam** - Your email provider (Gmail, Fastmail, etc.) already does this
- **Does not sync spam folders** - We intentionally exclude provider spam folders from sync
- **Does not replace SpamAssassin/provider filters** - We trust your provider's spam detection

### Spam vs. Junk: The Distinction

| Category | Handled By | Definition | Example |
|----------|-----------|------------|---------|
| **SPAM** | Email Provider | Malicious, fraudulent, blocked content | Phishing, scams, malware |
| **JUNK** | AI Classifier | Legitimate but low-priority promotional mail | Marketing emails, newsletters, promotions |

**Why this matters:** Provider spam filters catch malicious content before it reaches your inbox. Our AI classifier helps you organize the *legitimate* mail that made it through, distinguishing important messages from promotional clutter.

## Features

- **🎯 AI-Powered Classification**: Automatically tags messages with categories like `work`, `finance`, `personal`, `dev`, `shopping`
- **📁 Folder Support**: Browse Inbox, Sent, and Trash folders
- **🏷️ Tag-Based Filtering**: Filter messages by AI-assigned tags or account
- **🔍 Full-Text Search**: Search across all message content
- **⚡ Bulk Operations**: Select multiple messages to delete, mark as read/unread, or restore from trash
- **🔄 Multi-Account**: Manage multiple Gmail and IMAP accounts from a single interface
- **🔒 Privacy-First**: All AI processing happens locally using Ollama
- **🌐 Modern Web UI**: Clean, responsive interface built with React and Material-UI
- **📡 Real-Time Updates**: WebSocket support for live message updates
- **⚙️ Declarative Config**: Define everything in Nix—accounts, AI settings, providers

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Web UI (React)                       │
│  Material-UI • Tag Filtering • Bulk Actions • Search    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────▼────────────────────────────────────┐
│              FastAPI Backend (Python)                   │
│  REST API • WebSocket • Message Management • Sync       │
└─────┬──────────────────────────────────────────┬────────┘
      │                                          │
      │ Gmail API / IMAP                        │ Ollama API
      │                                          │
┌─────▼─────────────────┐              ┌────────▼─────────┐
│  Email Providers      │              │   AI Classifier  │
│  • Gmail (OAuth2)     │              │   • Local LLM    │
│  • IMAP (Password)    │              │   • Tag/Priority │
│  • Fastmail, etc.     │              │   • No cloud API │
└───────────────────────┘              └──────────────────┘
           │
           │ SQLite
           ▼
    ┌──────────────┐
    │   Database   │
    │  • Messages  │
    │  • Tags      │
    │  • Accounts  │
    └──────────────┘
```

## Installation

### Prerequisites

1. **NixOS or Home Manager** - This is a Nix-native application
2. **Ollama** - For local AI classification (or OpenAI API key)

### Add to Your Flake

Add axios-ai-mail to your flake inputs:

```nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    axios-ai-mail.url = "github:kcalvelli/axios-ai-mail";
  };

  outputs = { self, nixpkgs, axios-ai-mail, ... }: {
    homeConfigurations.youruser = home-manager.lib.homeManagerConfiguration {
      modules = [
        axios-ai-mail.homeManagerModules.default
        ./home.nix
      ];
    };
  };
}
```

### Enable in Home Manager

In your `home.nix`:

```nix
{
  programs.axios-ai-mail = {
    enable = true;
  };
}
```

Then rebuild:

```bash
home-manager switch
```

## Configuration

### Gmail Account (OAuth2)

Gmail requires OAuth2 authentication. The setup wizard guides you through creating Google Cloud credentials and encrypting them with agenix.

#### Step 1: Run the Auth Wizard

```bash
axios-ai-mail auth gmail --account personal
```

The wizard will:
1. Prompt for an account name (e.g., `personal`, `work`)
2. Open Google Cloud Console in your browser
3. Guide you through creating OAuth credentials
4. Complete the OAuth flow and save the token

#### Step 2: Create Google Cloud OAuth Credentials

In Google Cloud Console:

1. **Create a new project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name: `axios-ai-mail` → Create

2. **Enable Gmail API**
   - Search for "Gmail API" → Enable

3. **Configure OAuth consent screen**
   - Go to "OAuth consent screen"
   - Choose "External" → Create
   - Fill in App name, email → Save
   - Add your email as a Test User

4. **Create OAuth credentials**
   - Go to "Credentials" → "Create Credentials"
   - Choose "OAuth client ID"
   - Application type: **Desktop app**
   - Name: `axios-ai-mail`
   - Click "Create"

5. **Download the JSON file**
   - Click the download icon (⬇)
   - Save to `~/Downloads`

Press Enter in the terminal when done. The wizard auto-detects the file.

#### Step 3: Encrypt with Agenix

After the OAuth flow completes, the wizard saves the token and shows instructions:

**3a. Add secret to secrets.nix:**
```bash
# Edit ~/.config/nixos_config/secrets/secrets.nix
"gmail-personal.age".publicKeys = users ++ systems;
```

**3b. Encrypt the token:**
```bash
cd ~/.config/nixos_config/secrets
agenix -e gmail-personal.age < ~/.local/share/axios-ai-mail/credentials/personal.json
```

**3c. Stage for git (required for flakes):**
```bash
cd ~/.config/nixos_config
git add secrets/gmail-personal.age
```

#### Step 4: Add to Nix Configuration

```nix
# In your home.nix (axiOS: ~/.config/nixos_config/keith.nix)

age.secrets.gmail-personal.file = ../secrets/gmail-personal.age;

programs.axios-ai-mail = {
  enable = true;

  accounts.personal = {
    provider = "gmail";
    email = "you@gmail.com";
    oauthTokenFile = config.age.secrets.gmail-personal.path;
  };
};
```

#### Step 5: Rebuild and Test

```bash
home-manager switch --flake ~/.config/nixos_config

# Test the connection
axios-ai-mail sync run --account personal --max 10

# Clean up plaintext token
rm ~/.local/share/axios-ai-mail/credentials/personal.json
```

### IMAP Account (Password)

```nix
programs.axios-ai-mail = {
  enable = true;

  accounts.work = {
    provider = "imap";
    email = "you@fastmail.com";
    passwordFile = "/path/to/password-file";

    imap = {
      host = "imap.fastmail.com";
      port = 993;
      tls = true;
    };
  };
};
```

**Setting up IMAP password:**

```bash
# Interactive password setup
axios-ai-mail auth setup-imap --email you@fastmail.com

# Or manually create password file
echo "your-password" > ~/.config/axios-ai-mail/password
chmod 600 ~/.config/axios-ai-mail/password
```

### AI Configuration

#### Option 1: Ollama (Recommended)

```nix
ai = {
  provider = "ollama";
  model = "llama3.2";  # or "qwen2.5", "mistral", etc.
  endpoint = "http://localhost:11434";
};
```

Install and start Ollama:
```bash
# Install model
ollama pull llama3.2

# Ollama runs automatically as a service on NixOS
# Or start manually: ollama serve
```

#### Option 2: OpenAI API

```nix
ai = {
  provider = "openai";
  model = "gpt-4";
  apiKey = "sk-...";  # Or use apiKeyFile for secrets
};
```

### Custom Tags

Define your own classification tags:

```nix
ai = {
  provider = "ollama";
  model = "llama3.2";

  customTags = [
    { name = "urgent"; description = "Time-sensitive emails requiring immediate action"; }
    { name = "clients"; description = "Client communications and support requests"; }
    { name = "reports"; description = "Weekly/monthly reports and analytics"; }
  ];
};
```

Default tags (if not specified):
- `work` - Work-related emails
- `personal` - Personal correspondence
- `finance` - Bills, transactions, statements
- `shopping` - Receipts, order confirmations
- `travel` - Flight/hotel bookings
- `dev` - GitHub, GitLab, CI/CD notifications
- `social` - Social media notifications
- `newsletter` - Newsletters and subscriptions
- `junk` - Promotional emails, marketing

## Usage

### Start the Web Interface

```bash
axios-ai-mail web
```

Then open http://localhost:8080 in your browser.

### Sync Messages

```bash
# Sync all accounts
axios-ai-mail sync run

# Sync specific account
axios-ai-mail sync run --account personal

# Limit messages fetched
axios-ai-mail sync run --max 50
```

### Account Maintenance

Manage accounts and handle migrations when renaming accounts in your Nix config:

```bash
# List all accounts with status (active vs orphaned)
axios-ai-mail accounts list

# Show detailed statistics
axios-ai-mail accounts stats

# Migrate messages when renaming an account
# Example: renamed "personal" to "gmail" in Nix config
axios-ai-mail accounts migrate personal gmail

# Clean up orphaned accounts (no longer in config)
axios-ai-mail accounts cleanup

# Delete a specific account
axios-ai-mail accounts delete old-account
```

**Account Rename Workflow:**

When you rename an account in your Nix config (e.g., `accounts.personal` → `accounts.gmail`):

1. Update Nix config and rebuild
2. Run sync to create the new account: `axios-ai-mail sync run`
3. Check status: `axios-ai-mail accounts list` (shows old as "Orphaned", new as "Active")
4. Migrate messages: `axios-ai-mail accounts migrate personal gmail`
5. Clean up: `axios-ai-mail accounts cleanup`

### CLI Help

```bash
axios-ai-mail --help
axios-ai-mail sync --help
axios-ai-mail auth --help
axios-ai-mail accounts --help
```

## Web UI Features

### Folder Navigation
- **Inbox** - All messages in your inbox
- **Sent** - Messages you've sent
- **Trash** - Deleted messages (can be restored)

### Tag Filtering
- Click any tag to filter messages
- Account emails appear as tags for filtering by account
- Combine with folder navigation (e.g., "work emails in inbox")

### Bulk Operations
1. Select messages by clicking checkboxes
2. Use the floating action bar to:
   - Mark as read/unread
   - Move to trash (with undo)
   - Restore from trash (returns to original folder)
   - Permanently delete (from trash only)

### Search
Use the search bar to find messages by:
- Subject
- Sender
- Recipient
- Body content

## How It Works

### 1. Message Sync

When you run `axios-ai-mail sync run`:

1. **Fetch** - Connects to your email provider (Gmail API or IMAP)
2. **Parse** - Extracts message metadata and body content
3. **Store** - Saves to local SQLite database
4. **Classify** - AI analyzes subject, sender, and content
5. **Tag** - Applies relevant tags based on AI classification
6. **Update** - Syncs tags back to provider (Gmail labels or IMAP keywords)

### 2. AI Classification

The AI classifier:

1. Reads message subject, sender, and snippet
2. Analyzes content against tag definitions
3. Assigns 1-3 most relevant tags
4. Determines priority (high/normal)
5. Identifies if action is needed
6. Suggests archival for newsletters/receipts

All processing happens **locally** - no data leaves your machine.

### 3. Provider Integration

#### Gmail
- Uses Gmail API with OAuth2
- Syncs from all folders (Inbox, Sent, Trash)
- Excludes SPAM folder (intentionally)
- Applies tags as Gmail labels (e.g., `AI/work`, `AI/finance`)
- Detects folder from Gmail labels (SENT, TRASH, INBOX)

#### IMAP
- Standard IMAP protocol with TLS
- Fetches from multiple folders (INBOX, Sent, Trash)
- Supports KEYWORD extension for tag sync
- Falls back to read-only if KEYWORD not supported
- Works with Fastmail, ProtonMail Bridge, self-hosted servers

## Folder Behavior

### Delete (Move to Trash)
- Messages are **soft deleted** - moved to trash folder
- Original folder is saved for restoration
- Toast notification with "Undo" button

### Restore from Trash
- Messages return to **original folder** (Inbox, Sent, etc.)
- Not hardcoded to always go to Inbox

### Permanent Delete
- Only available from Trash folder
- Requires confirmation
- **Cannot be undone**

### Clear Trash
- Permanently deletes all messages in trash
- Requires confirmation

## Development

### Project Structure

```
axios-ai-mail/
├── src/axios_ai_mail/          # Python backend
│   ├── api/                    # FastAPI routes
│   ├── db/                     # Database models & queries
│   ├── providers/              # Gmail & IMAP implementations
│   ├── ai_classifier.py        # LLM integration
│   └── sync_engine.py          # Sync orchestration
├── web/                        # React frontend
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── hooks/              # React Query hooks
│   │   ├── api/                # API client
│   │   └── store/              # Zustand state
│   └── package.json
├── modules/home-manager/       # Nix module
├── alembic/                    # Database migrations
└── flake.nix
```

### Running Locally

```bash
# Backend development
nix develop
python -m axios_ai_mail.api.main

# Frontend development
cd web
npm install
npm run dev

# Database migrations
alembic upgrade head
```

### Adding a New Provider

1. Create provider in `src/axios_ai_mail/providers/implementations/`
2. Implement `BaseEmailProvider` interface
3. Register in `src/axios_ai_mail/providers/__init__.py`
4. Add config options to NixOS module
5. Add auth wizard support in `src/axios_ai_mail/cli/auth.py`

## Troubleshooting

### Messages Not Syncing

```bash
# Check sync logs
journalctl --user -u axios-ai-mail-sync -f

# Manual sync with debug output
axios-ai-mail sync run --verbose
```

### AI Classification Not Working

```bash
# Test Ollama connection
curl http://localhost:11434/api/tags

# Pull model if needed
ollama pull llama3.2

# Check AI service logs
journalctl --user -u axios-ai-mail-api -f
```

### Web UI Not Loading

```bash
# Check API status
curl http://localhost:8000/api/health

# Restart services
systemctl --user restart axios-ai-mail-api
systemctl --user restart axios-ai-mail-web
```

### Gmail OAuth Expired

```bash
# Re-authenticate
axios-ai-mail auth setup-gmail --email you@gmail.com

# Update credential file path in config
```

## FAQ

**Q: Why use this instead of email client filters?**
A: Traditional filters use static rules. AI classification adapts to your mail patterns and understands context.

**Q: Does AI see my full email content?**
A: Only subject, sender, and a snippet (first 200 chars). Full bodies are stored locally but not sent to AI.

**Q: Can I use this with Outlook/Office365?**
A: Not yet. Currently supports Gmail and IMAP. Outlook/Exchange support planned.

**Q: What happens to my existing Gmail labels?**
A: They're preserved. AI tags are added as additional labels under `AI/` prefix.

**Q: Can I train the AI on my corrections?**
A: Feedback system is planned but not yet implemented.

**Q: Does this replace my email client?**
A: No. It's a classification and organization layer. You can still use any email client alongside it.

## Roadmap

- [x] Dark mode
- [x] Email composition and sending
- [x] Attachments view
- [x] Account maintenance CLI
- [ ] Outlook/Office365 provider
- [ ] User feedback loop for AI improvement
- [ ] Keyboard shortcuts in web UI
- [ ] Mobile-responsive improvements
- [ ] Message threading
- [ ] Calendar integration
- [ ] Contact management

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Credits

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [React](https://react.dev/) - Frontend framework
- [Material-UI](https://mui.com/) - UI components
- [Ollama](https://ollama.com/) - Local LLM runtime
- [SQLAlchemy](https://www.sqlalchemy.org/) - Database ORM
- [React Query](https://tanstack.com/query) - Data fetching
- [Zustand](https://zustand-demo.pmnd.rs/) - State management

---

**axios-ai-mail** - Organize your inbox with AI, locally.
