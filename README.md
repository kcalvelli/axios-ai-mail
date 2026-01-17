# axios-ai-mail

**axios-ai-mail** is a declarative, AI-enhanced email workflow designed for NixOS and Home Manager users. It combines robust CLI tools (`isync`, `msmtp`, `notmuch`) with a local LLM-based classifier (`Ollama`) to organize your inbox automatically.

## Product Scope

**axios-ai-mail is an inbox organizer, not a spam filter.**

### What This Product Does ✅
- **Classifies legitimate mail** that reached your inbox
- **Organizes messages** with AI-powered tags (work, finance, personal, etc.)
- **Identifies low-priority content** like promotional emails and newsletters ("junk" tag)
- **Helps you prioritize** what matters in your inbox

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

- **Declarative Configuration**: Define email accounts in Nix. No more manual `.mbsyncrc` editing.
- **Local AI Intelligence**: Uses Ollama (e.g., Llama 3) to classify mail with structured tags (`Work`, `Finance`, `To-Do`) and auto-archive junk.
- **Privacy-First**: All processing happens locally. No mail data is sent to cloud APIs.
- **Universal Backend**: Works with any Notmuch-compatible client. Includes native setup for **Aerc** and **Astroid**.

## Installation

Add `axios-ai-mail` to your flake inputs:

```nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    axios-ai-mail.url = "github:kcalvelli/axios-ai-mail";
  };
  
  outputs = { self, nixpkgs, axios-ai-mail, ... }: {
    # In your home-manager configuration
    homeManagerModules.default = [
      axios-ai-mail.homeManagerModules.default
      {
        programs.axios-ai-mail.enable = true;
      }
    ];
  };
}
```

## Configuration

Configure your accounts in `home.nix`:

```nix
programs.axios-ai-mail = {
  enable = true;
  
  settings = {
    syncFrequency = "5m"; # Run sync every 5 minutes
    maildirBase = "~/Mail";
  };

  ai = {
    enable = true;
    model = "llama3";
    endpoint = "http://localhost:11434";
  };

  accounts = {
    personal = {
      primary = true;
      flavor = "gmail"; # Preconfigures IMAP/SMTP host/port
      address = "jane.doe@gmail.com";
      realName = "Jane Doe";
      # Command to fetch the password or OAuth2 token
      passwordCommand = "pass email/personal"; 
    };

    # Standard IMAP Example
    work = {
      flavor = "manual";
      address = "me@company.com";
      userName = "user"; # Optional if different from address
      realName = "First Last";
      
      # Connection Details
      imap = { host = "imap.fastmail.com"; port = 993; };
      smtp = { host = "smtp.fastmail.com"; port = 465; };
      
      # Password Command (must print password to stdout)
      passwordCommand = "cat ~/.config/secrets/mailpass";
    };
  };
};
```

## Authentication (OAuth2)

1.  **Create the tokens directory**:
    ```bash
    mkdir -p ~/.config/tokens
    ```

2.  **Prerequisite (GMail Only)**:
    Google requires you to create your own "App" credentials (Desktop App). Obtain `Client ID` and `Client Secret`.

3.  **Run the Auth Wizard**:

    ```bash
    nix run github:kcalvelli/axios-ai-mail#auth -- \
        --verbose --authorize \
        ~/.config/tokens/gmail
    ```

4.  **Follow the Interactive Prompts** to authenticate via browser.

5.  **Update your Config**:
    ```nix
    accounts.personal = {
      flavor = "gmail";
      # ...
      passwordCommand = "~/.config/tokens/gmail"; 
    };
    ```

### Authentication (Standard IMAP)

For providers like Fastmail, iCloud, or self-hosted servers, you can use a simple password file or a manager like `pass`.

**Simplest Method (Helper Tool):**

1.  Run the password helper:
    ```bash
    nix run github:kcalvelli/axios-ai-mail#set-password -- <account_name>
    # Example: nix run .#set-password -- work
    ```
    It will securely prompt for your password and save it to `~/.config/axios-ai-mail/secrets/<name>_pass` with correct permissions.

2.  Copy the configuration line it prints (e.g. `passwordCommand = "cat ...";`) into your `home.nix`.

## AI Integration

Ensure [Ollama](https://ollama.com) is installed and running (`ollama serve`).

The classifier analyzes incoming mail (`tag:new`) and applies the following logic:

- **Tags**: Adds categorical tags like `Work`, `Finance`, `Personal`.
- **Priority**: Adds `prio-high` or `prio-normal`.
- **To-Do**: Adds `todo` tag if the email requires action (reply, pay bill, etc.).
- **Auto-Archive**: If the email is a receipt/newsletter AND requires no action, it removes the `Inbox` tag and adds `Archive`.

## Reading Your Email (Integrated Clients)

`axios-ai-mail` can automatically configure a terminal or GUI email client for you.

Simply set the `client` option to either `aerc` (TUI) or `astroid` (GUI):

```nix
programs.axios-ai-mail = {
  enable = true;
  client = "aerc"; # or "astroid"
};
```

This generates all necessary configuration to view your accounts and AI tags out of the box.

- **Folders/Tabs**: Your sidebar will show virtual views like `Inbox`, `To-Do`, `High Priority`, backed by Notmuch queries.
- **Search**: Use Notmuch syntax (e.g. `tag:work and tag:todo`) to find anything instantly.

## Management Tools

### Re-classify Mail
If you change your AI logic or want to process old mail, use the `reclassify` tool.

```bash
# Process ALL mail (resets to Inbox default, then applies AI)
nix run .#reclassify -- --query "*"

# Dry run to see what would happen
nix run .#reclassify -- --query "*" --dry-run
```

### Manual Sync
```bash
systemctl --user start axios-mail-sync
```

### Debugging
```bash
# Check service logs
journalctl --user -u axios-mail-sync -f

# Run classifier manually
nix shell .#default
python3 src/ai_classifier.py --dry-run
```
