# Configuration Reference

Complete reference for all axios-ai-mail Nix configuration options.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Basic Configuration](#basic-configuration)
- [Account Configuration](#account-configuration)
  - [Gmail (OAuth2)](#gmail-oauth2)
  - [IMAP (Password)](#imap-password)
- [AI Configuration](#ai-configuration)
- [Sync Configuration](#sync-configuration)
- [AI Model Recommendations](#ai-model-recommendations)
- [Custom Tags](#custom-tags)
- [Multi-Account Setup](#multi-account-setup)
- [Systemd Services](#systemd-services)
- [Example Configurations](#example-configurations)

---

## Quick Reference

```nix
programs.axios-ai-mail = {
  enable = true;                          # Enable the module

  # AI Settings
  ai = {
    enable = true;                        # Enable AI classification
    model = "llama3.2";                   # Ollama model name
    endpoint = "http://localhost:11434";  # Ollama API URL
    temperature = 0.3;                    # LLM temperature (0.0-1.0)
    useDefaultTags = true;                # Use built-in 35-tag taxonomy
    tags = [];                            # Additional custom tags
    excludeTags = [];                     # Tags to remove from defaults
    labelPrefix = "AI";                   # Provider label prefix
    labelColors = {};                     # Tag color overrides
  };

  # Sync Settings
  sync = {
    frequency = "5m";                     # Sync interval
    maxMessagesPerSync = 100;             # Messages per sync batch
    enableWebhooks = false;               # Real-time push (experimental)
  };

  # Accounts (see detailed examples below)
  accounts = {};
};
```

---

## Basic Configuration

### Minimal Setup

```nix
{ config, ... }:
{
  programs.axios-ai-mail = {
    enable = true;

    accounts.personal = {
      provider = "gmail";
      email = "you@gmail.com";
      oauthTokenFile = config.age.secrets.gmail-token.path;
    };
  };
}
```

### Module Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enable` | boolean | `false` | Enable axios-ai-mail |
| `package` | package | `pkgs.axios-ai-mail` | Package to use |
| `accounts` | attrset | `{}` | Email account configurations |
| `ai` | submodule | see below | AI classification settings |
| `sync` | submodule | see below | Sync behavior settings |

---

## Account Configuration

### Gmail (OAuth2)

Gmail requires OAuth2 authentication with credentials from Google Cloud Console.

```nix
accounts.personal = {
  provider = "gmail";
  email = "you@gmail.com";
  realName = "Your Name";                              # Optional
  oauthTokenFile = config.age.secrets.gmail-token.path;

  # Optional per-account overrides
  labels = {
    prefix = "AI";                                     # Label prefix
    colors = {                                         # Provider-specific colors
      work = "blue";
      finance = "green";
    };
  };

  sync = {
    frequency = "5m";                                  # Per-account frequency
    enableWebhooks = false;                            # Gmail push notifications
  };
};
```

**OAuth Token Setup:**

1. Run `axios-ai-mail auth gmail --account personal`
2. Complete OAuth flow in browser
3. Encrypt the token with agenix/sops-nix
4. Reference the decrypted path in `oauthTokenFile`

### IMAP (Password)

For Fastmail, ProtonMail Bridge, self-hosted servers, and other IMAP providers.

```nix
accounts.work = {
  provider = "imap";
  email = "you@fastmail.com";
  realName = "Your Name";
  passwordFile = config.age.secrets.fastmail-password.path;

  imap = {
    host = "imap.fastmail.com";
    port = 993;                                        # Default: 993
    tls = true;                                        # Default: true
  };

  smtp = {
    host = "smtp.fastmail.com";
    port = 465;                                        # Default: 465
    tls = true;                                        # Default: true
  };
};
```

**Password Setup:**

Option 1: Plain file (not recommended for multi-user systems)

```bash
mkdir -p ~/.config/axios-ai-mail
echo "your-password" > ~/.config/axios-ai-mail/password
chmod 600 ~/.config/axios-ai-mail/password
```

Option 2: agenix (recommended)

```bash
cd ~/.config/nixos_config/secrets
agenix -e fastmail-password.age
# Enter password, save, exit
git add fastmail-password.age
```

Then reference:

```nix
age.secrets.fastmail-password.file = ../secrets/fastmail-password.age;
```

### Account Options Reference

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `provider` | `"gmail"`, `"imap"`, `"outlook"` | Yes | Provider type |
| `email` | string | Yes | Email address |
| `realName` | string | No | Display name |
| `oauthTokenFile` | path | Gmail/Outlook | OAuth token path |
| `passwordFile` | path | IMAP | Password file path |
| `imap` | submodule | IMAP | IMAP server settings |
| `smtp` | submodule | No | SMTP server settings |
| `labels` | submodule | No | Label customization |
| `sync` | submodule | No | Per-account sync settings |

---

## AI Configuration

### Options

```nix
ai = {
  enable = true;
  model = "llama3.2";
  endpoint = "http://localhost:11434";
  temperature = 0.3;
  useDefaultTags = true;
  tags = [];
  excludeTags = [];
  labelPrefix = "AI";
  labelColors = {};
};
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enable` | boolean | `true` | Enable AI classification |
| `model` | string | `"llama3.2"` | Ollama model name |
| `endpoint` | string | `"http://localhost:11434"` | Ollama API URL |
| `temperature` | float | `0.3` | LLM temperature (0.0-1.0) |
| `useDefaultTags` | boolean | `true` | Use built-in tag taxonomy |
| `tags` | list | `[]` | Additional custom tags |
| `excludeTags` | list | `[]` | Tags to exclude from defaults |
| `labelPrefix` | string | `"AI"` | Prefix for provider labels |
| `labelColors` | attrset | `{}` | Tag color overrides |

### Temperature Guidelines

- `0.1-0.3` - Highly deterministic, best for classification
- `0.4-0.6` - More varied responses
- `0.7+` - Not recommended for classification tasks

---

## Sync Configuration

### Options

```nix
sync = {
  frequency = "5m";
  maxMessagesPerSync = 100;
  enableWebhooks = false;
};
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `frequency` | string | `"5m"` | Systemd timer interval |
| `maxMessagesPerSync` | integer | `100` | Max messages per batch |
| `enableWebhooks` | boolean | `false` | Real-time push (experimental) |

### Frequency Format

Uses systemd timer format:
- `5m` - Every 5 minutes
- `1h` - Every hour
- `30s` - Every 30 seconds
- `1d` - Daily

---

## AI Model Recommendations

### Quick Recommendations

| Use Case | Model | VRAM | Speed |
|----------|-------|------|-------|
| **Best Overall** | `llama3.2` | 4GB | 2-3s/msg |
| **Low VRAM** | `qwen2.5:3b` | 2GB | 1-2s/msg |
| **Maximum Quality** | `llama3.1:8b` | 8GB | 4-5s/msg |
| **Fastest** | `qwen2.5:1.5b` | 1.5GB | <1s/msg |

### Model Configuration Examples

**Default (recommended):**

```nix
ai.model = "llama3.2";
```

**Low VRAM systems:**

```nix
ai = {
  model = "qwen2.5:3b";
  temperature = 0.2;  # More consistent with smaller models
};
```

**Maximum quality:**

```nix
ai = {
  model = "llama3.1:8b";
  temperature = 0.3;
};
```

### Hardware Requirements

| Setup | RAM | VRAM | Recommended Model |
|-------|-----|------|-------------------|
| CPU-only | 8GB+ | - | `qwen2.5:1.5b` |
| Entry GPU | - | 2-4GB | `qwen2.5:3b` |
| Mid-range GPU | - | 4-8GB | `llama3.2` |
| High-end GPU | - | 8GB+ | `llama3.1:8b` |

---

## Custom Tags

### Using Default Tags

The default taxonomy includes 35 tags across categories:

**Priority:** urgent, important, review
**Work:** work, project, meeting, deadline
**Personal:** personal, family, friends, hobby
**Finance:** finance, invoice, payment, expense
**Shopping:** shopping, receipt, shipping
**Travel:** travel, booking, itinerary, flight
**Developer:** dev, github, ci, alert
**Marketing:** marketing, newsletter, promotion, announcement
**Social:** social, notification, update, reminder
**System:** junk

Enable with:

```nix
ai.useDefaultTags = true;
```

### Adding Custom Tags

```nix
ai = {
  useDefaultTags = true;  # Keep defaults
  tags = [
    { name = "clients"; description = "Client communications and support"; }
    { name = "reports"; description = "Weekly and monthly reports"; }
    { name = "urgent-client"; description = "Time-sensitive client issues"; }
  ];
};
```

### Excluding Default Tags

```nix
ai = {
  useDefaultTags = true;
  excludeTags = [ "social" "newsletter" "hobby" ];  # Remove these
};
```

### Replacing All Tags

```nix
ai = {
  useDefaultTags = false;  # Disable defaults
  tags = [
    { name = "work"; description = "Work-related emails"; }
    { name = "personal"; description = "Personal correspondence"; }
    { name = "bills"; description = "Bills and payments"; }
    { name = "junk"; description = "Promotional and marketing"; }
  ];
};
```

### Label Colors

Colors for Gmail labels and UI display:

```nix
ai.labelColors = {
  urgent = "red";
  important = "red";
  work = "blue";
  finance = "green";
  personal = "purple";
  shopping = "yellow";
  travel = "magenta";
  dev = "cyan";
  newsletter = "gray";
  junk = "brown";
};
```

**Gmail color options:** `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `gray`, `brown`, `pink`

---

## Multi-Account Setup

### Example: Personal + Work

```nix
{ config, ... }:
{
  age.secrets = {
    gmail-personal.file = ../secrets/gmail-personal.age;
    fastmail-work.file = ../secrets/fastmail-work.age;
  };

  programs.axios-ai-mail = {
    enable = true;

    ai = {
      model = "llama3.2";
      useDefaultTags = true;
      labelColors = {
        work = "blue";
        finance = "green";
        personal = "purple";
      };
    };

    accounts.personal = {
      provider = "gmail";
      email = "you@gmail.com";
      realName = "Your Name";
      oauthTokenFile = config.age.secrets.gmail-personal.path;
    };

    accounts.work = {
      provider = "imap";
      email = "you@company.com";
      realName = "Your Name";
      passwordFile = config.age.secrets.fastmail-work.path;

      imap = {
        host = "imap.fastmail.com";
        port = 993;
        tls = true;
      };

      smtp = {
        host = "smtp.fastmail.com";
        port = 465;
        tls = true;
      };
    };
  };
}
```

### Account Filtering in UI

Each account email appears as a filter in the sidebar. Click to view only messages from that account.

---

## Systemd Services

axios-ai-mail creates two user-level systemd units:

### Sync Timer

```bash
# Check timer status
systemctl --user status axios-ai-mail-sync.timer

# Manually trigger sync
systemctl --user start axios-ai-mail-sync.service

# View sync logs
journalctl --user -u axios-ai-mail-sync -f
```

### Timer Configuration

The timer uses `OnUnitActiveSec` for intervals:

```nix
sync.frequency = "5m";  # Runs every 5 minutes after last run
```

Timer options:
- `OnBootSec = "2min"` - First run 2 minutes after login
- `Persistent = true` - Catch up missed runs

### Disabling Automatic Sync

If you prefer manual sync only:

```bash
systemctl --user disable axios-ai-mail-sync.timer
systemctl --user stop axios-ai-mail-sync.timer
```

---

## Example Configurations

### Minimal Gmail Setup

```nix
{ config, ... }:
{
  age.secrets.gmail.file = ../secrets/gmail.age;

  programs.axios-ai-mail = {
    enable = true;

    accounts.gmail = {
      provider = "gmail";
      email = "you@gmail.com";
      oauthTokenFile = config.age.secrets.gmail.path;
    };
  };
}
```

### Fastmail with Custom Tags

```nix
{ config, ... }:
{
  age.secrets.fastmail.file = ../secrets/fastmail.age;

  programs.axios-ai-mail = {
    enable = true;

    ai = {
      model = "llama3.2";
      useDefaultTags = true;
      tags = [
        { name = "clients"; description = "Client emails"; }
        { name = "invoices"; description = "Invoices to process"; }
      ];
      labelColors = {
        clients = "blue";
        invoices = "green";
      };
    };

    accounts.main = {
      provider = "imap";
      email = "you@fastmail.com";
      realName = "Your Name";
      passwordFile = config.age.secrets.fastmail.path;

      imap = {
        host = "imap.fastmail.com";
        port = 993;
        tls = true;
      };

      smtp = {
        host = "smtp.fastmail.com";
        port = 465;
        tls = true;
      };
    };
  };
}
```

### Full Production Setup

```nix
{ config, lib, pkgs, inputs, ... }:
{
  imports = [ inputs.axios-ai-mail.homeManagerModules.default ];

  programs.axios-ai-mail = {
    enable = true;

    sync = {
      frequency = "5m";
      maxMessagesPerSync = 100;
    };

    ai = {
      enable = true;
      model = "llama3.2";
      endpoint = "http://localhost:11434";
      temperature = 0.3;
      useDefaultTags = true;

      tags = [
        { name = "newsletter"; description = "Newsletters and subscriptions"; }
        { name = "junk"; description = "Promotional emails, spam, marketing"; }
      ];

      labelPrefix = "AI";
      labelColors = {
        urgent = "red";
        important = "red";
        work = "blue";
        finance = "green";
        personal = "purple";
        shopping = "yellow";
        travel = "magenta";
        dev = "cyan";
        newsletter = "gray";
        junk = "brown";
      };
    };

    accounts.gmail = {
      provider = "gmail";
      email = "you@gmail.com";
      realName = "Your Name";
      oauthTokenFile = config.age.secrets.gmail.path;
    };

    accounts.work = {
      provider = "imap";
      email = "you@company.com";
      realName = "Your Name";
      passwordFile = config.age.secrets.work-email.path;

      imap = {
        host = "imap.fastmail.com";
        port = 993;
        tls = true;
      };

      smtp = {
        host = "smtp.fastmail.com";
        port = 465;
        tls = true;
      };
    };
  };
}
```
