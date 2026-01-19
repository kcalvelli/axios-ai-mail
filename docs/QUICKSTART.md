# Quick Start Guide

Get axios-ai-mail running in about 15 minutes.

## Prerequisites

Before you begin, ensure you have:

1. **NixOS or Home Manager** installed and configured
2. **Ollama** running with a model pulled:
   ```bash
   ollama pull llama3.2
   ```
3. **A Nix flake-based configuration** (recommended)

## Step 1: Add to Your Flake

Add axios-ai-mail to your `flake.nix`:

```nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    home-manager.url = "github:nix-community/home-manager";
    axios-ai-mail.url = "github:kcalvelli/axios-ai-mail";
  };

  outputs = { self, nixpkgs, home-manager, axios-ai-mail, ... }: {
    homeConfigurations.youruser = home-manager.lib.homeManagerConfiguration {
      pkgs = nixpkgs.legacyPackages.x86_64-linux;
      modules = [
        axios-ai-mail.homeManagerModules.default
        ./home.nix
      ];
    };
  };
}
```

## Step 2: Basic Configuration

Add to your Home Manager configuration (e.g., `home.nix`):

```nix
{ config, ... }:
{
  programs.axios-ai-mail = {
    enable = true;

    # AI settings
    ai = {
      enable = true;
      model = "llama3.2";
      endpoint = "http://localhost:11434";
    };
  };
}
```

Rebuild to install:

```bash
home-manager switch
```

## Step 3: Set Up Email Account

Choose your email provider:

### Option A: Gmail (OAuth2)

Gmail requires OAuth2 authentication. Run the setup wizard:

```bash
axios-ai-mail auth gmail --account personal
```

The wizard will:
1. Open Google Cloud Console in your browser
2. Guide you through creating OAuth credentials
3. Complete the OAuth flow

**Creating Google Cloud Credentials:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project named `axios-ai-mail`
3. Enable the **Gmail API**
4. Go to **OAuth consent screen** → Configure as "External"
5. Go to **Credentials** → Create **OAuth client ID**
   - Application type: **Desktop app**
   - Download the JSON file
6. Return to terminal and press Enter

**Encrypt the token (axiOS users):**

```bash
# Add to secrets.nix
cd ~/.config/nixos_config/secrets
echo '"gmail-personal.age".publicKeys = users ++ systems;' >> secrets.nix

# Encrypt
agenix -e gmail-personal.age < ~/.local/share/axios-ai-mail/credentials/personal.json

# Stage for git
git add gmail-personal.age
```

**Add to Nix config:**

```nix
{ config, ... }:
{
  # Decrypt secret at runtime
  age.secrets.gmail-personal.file = ../secrets/gmail-personal.age;

  programs.axios-ai-mail = {
    enable = true;

    accounts.personal = {
      provider = "gmail";
      email = "you@gmail.com";
      realName = "Your Name";
      oauthTokenFile = config.age.secrets.gmail-personal.path;
    };
  };
}
```

### Option B: IMAP (Password-based)

For Fastmail, ProtonMail Bridge, or other IMAP servers:

```bash
# Create password file
mkdir -p ~/.config/axios-ai-mail
echo "your-app-password" > ~/.config/axios-ai-mail/fastmail-password
chmod 600 ~/.config/axios-ai-mail/fastmail-password
```

**Or use agenix (recommended):**

```bash
cd ~/.config/nixos_config/secrets
agenix -e fastmail-password.age
# Enter your password, save and exit
git add fastmail-password.age
```

**Add to Nix config:**

```nix
{ config, ... }:
{
  age.secrets.fastmail-password.file = ../secrets/fastmail-password.age;

  programs.axios-ai-mail = {
    enable = true;

    accounts.work = {
      provider = "imap";
      email = "you@fastmail.com";
      realName = "Your Name";
      passwordFile = config.age.secrets.fastmail-password.path;

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

## Step 4: Rebuild and Sync

```bash
# Apply configuration
home-manager switch

# Run initial sync (fetch 50 messages to test)
axios-ai-mail sync run --max 50

# You should see output like:
# Syncing account: personal
# Fetched 50 messages
# Classifying messages...
# Classification complete: 50/50
```

## Step 5: Start the Web UI

```bash
axios-ai-mail web
```

Open http://localhost:8080 in your browser.

You should see:
- Your messages in the inbox
- AI-assigned tags on each message
- Sidebar with tag filtering

![Desktop View](screenshots/desktop-dark-split-pane.png)

## Step 6: Install as PWA (Optional)

For a native app experience:

1. Open http://localhost:8080 in Chrome/Brave
2. Click the install icon in the address bar
3. Click "Install"

The app will appear in your application launcher.

## Common IMAP Server Settings

| Provider | IMAP Host | IMAP Port | SMTP Host | SMTP Port |
|----------|-----------|-----------|-----------|-----------|
| Fastmail | imap.fastmail.com | 993 | smtp.fastmail.com | 465 |
| ProtonMail | 127.0.0.1 | 1143 | 127.0.0.1 | 1025 |
| iCloud | imap.mail.me.com | 993 | smtp.mail.me.com | 587 |
| Outlook | outlook.office365.com | 993 | smtp.office365.com | 587 |
| Yahoo | imap.mail.yahoo.com | 993 | smtp.mail.yahoo.com | 465 |

> **Note:** ProtonMail requires the ProtonMail Bridge app running locally.

## Troubleshooting

### "Connection refused" on sync

Ensure Ollama is running:
```bash
systemctl --user status ollama  # If using systemd
# or
ollama serve  # Start manually
```

### OAuth token expired (Gmail)

Re-run the auth wizard:
```bash
axios-ai-mail auth gmail --account personal
```

Then re-encrypt and rebuild.

### Messages not appearing

Check sync logs:
```bash
axios-ai-mail sync run --verbose
```

### Web UI not loading

Check the API is running:
```bash
curl http://localhost:8080/api/health
```

## Next Steps

- **[User Guide](USER_GUIDE.md)** - Learn all features
- **[Configuration Reference](CONFIGURATION.md)** - Customize AI, tags, and more
- **[Architecture](ARCHITECTURE.md)** - Understand how it works

## Full Example Configuration

Here's a complete multi-account setup:

```nix
{ config, ... }:
{
  programs.axios-ai-mail = {
    enable = true;

    # Sync settings
    sync = {
      frequency = "5m";
      maxMessagesPerSync = 100;
    };

    # AI classification
    ai = {
      enable = true;
      model = "llama3.2";
      endpoint = "http://localhost:11434";
      temperature = 0.3;
      useDefaultTags = true;

      # Add custom tags
      tags = [
        { name = "clients"; description = "Client communications"; }
        { name = "reports"; description = "Weekly/monthly reports"; }
      ];

      labelColors = {
        urgent = "red";
        work = "blue";
        finance = "green";
        personal = "purple";
      };
    };

    # Gmail account
    accounts.gmail = {
      provider = "gmail";
      email = "you@gmail.com";
      realName = "Your Name";
      oauthTokenFile = config.age.secrets.gmail-token.path;
    };

    # Fastmail account
    accounts.fastmail = {
      provider = "imap";
      email = "you@fastmail.com";
      realName = "Your Name";
      passwordFile = config.age.secrets.fastmail-password.path;

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
