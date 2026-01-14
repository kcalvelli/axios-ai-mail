# axios-ai-mail

**axios-ai-mail** is a declarative, AI-enhanced email workflow designed for NixOS and Home Manager users. It combines robust CLI tools (`isync`, `msmtp`, `notmuch`) with a local LLM-based classifier (`Ollama`) to organize your inbox automatically.

## Features

- **Declarative Configuration**: Define email accounts in Nix. No more manual `.mbsyncrc` editing.
- **Local AI Intelligence**: Uses Ollama (e.g., Llama 3) to classify mail as `Important`, `Junk`, or `Neutral`.
- **Privacy-First**: All processing happens locally. No mail data is sent to cloud APIs.
- **Universal Backend**: Works with any Notmuch-compatible TUI (e.g., `alot`, `astroid`, `neo-mutt`, `aerc`).

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

    work = {
      flavor = "outlook";
      address = "jane.doe@work.com";
      passwordCommand = "pass email/work";
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
    Google requires you to create your own "App" credentials.
    1.  Go to [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
    2.  **API & Services** > **Library** > Search for and Enable **Gmail API**.
    3.  **OAuth Consent Screen**:
        *   User Type: **External**.
        *   Test Users: **Add your email address** (Important! This bypasses app verification).
    4.  **Credentials** > **Create Credentials** > **OAuth Client ID**:
        *   Application Type: **Desktop App**.
        *   Name: `axios-mail`.
    5.  **Copy** the `Client ID` and `Client Secret`. You will need them in the next step.

    *(Outlook users can skip this; a default ID is provided.)*

3.  **Run the Auth Wizard**:

    ```bash
    nix run github:kcalvelli/axios-ai-mail#auth -- \
        --verbose --authorize \
        ~/.config/tokens/gmail
    ```
    *(Replace `gmail` with `outlook` or any name you prefer)*

3.  **Follow the Interactive Prompts**:
    The script will ask for details. Use these settings:

    | Provider | Registration | Flow | Note |
    | :--- | :--- | :--- | :--- |
    | **GMail** | `google` | `authcode` | Copy the link it gives you to a browser, log in, copy the code back. |
    | **Outlook** | `microsoft` | `devicecode` | Go to microsoft.com/devicelogin and enter the code displayed. |

4.  **Update your Config**:
    ```nix
    accounts.personal = {
      flavor = "gmail";
      # ...
      passwordCommand = "~/.config/tokens/gmail"; 
    };
    ```

## AI Setup

Ensure [Ollama](https://ollama.com) is installed and running.

```bash
ollama serve
ollama pull llama3
```

By default, the classifier looks for mail tagged `new` in Notmuch, classifies it, and removes the `new` tag.

## Architecture

1.  **Generator**: Configs for `mbsync`, `msmtp`, and `notmuch` are regenerated before every sync.
2.  **Sync**: `mbsync` pulls mail to `~/Mail/<account>`.
3.  **Index**: `notmuch new` indexes headers and tags new mail as `new`.
4.  **Classify**: `ai_classifier.py` reads `tag:new`, prompts Ollama, and applies tags (`important`, `junk`).

## Reading Your Email

Since `axios-ai-mail` operates as a backend (sync + index + classify), you need a frontend to read your mail. Any client that supports **Notmuch** or **Maildir** will work.

### Option A: aerc (Recommended)
[aerc](https://aerc-mail.org/) is a highly efficient TUI client.

1.  Isolate `aerc` configuration to use the Notmuch backend.
2.  In your `aerc.conf` or `accounts.conf`:

```ini
[Personal]
source = notmuch://~/Mail
query-map = ~/.config/aerc/map.conf
default = INBOX
from = Jane Doe <jane.doe@gmail.com>
```

### Option B: alot
[alot](https://github.com/pazz/alot) is a terminal client written in Python specifically for Notmuch.

```bash
# ~/.config/alot/config
[accounts]
  [[personal]]
    realname = Jane Doe
    address = jane.doe@gmail.com
    sendmail_command = msmtp --account=personal -t
    # alot automatically discovers the notmuch DB at ~/Mail
```

### Option C: Emacs (notmuch.el)
If you use Emacs, the built-in `notmuch` package is the gold standard.

```elisp
(setq notmuch-search-oldest-first nil)
(notmuch)
```

## Troubleshooting

**Check Service Status**:
```bash
systemctl --user status axios-mail-sync
systemctl --user status axios-ai-classifier
```

**Run Manually to Debug**:
```bash
# Force a sync run
systemctl --user start axios-mail-sync

# Run classifier purely manually (requires python env)
nix develop
python3 src/ai_classifier.py --dry-run
```
