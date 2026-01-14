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
    axios-ai-mail.url = "github:yourusername/axios-ai-mail";
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

For GMail and Outlook, standard passwords usually won't work. You must use OAuth2.

1.  **Get a Client ID/Secret** for your provider (or use a known public client ID like Thunderbird's).
2.  **Generate a Token**:
    This project includes `mutt_oauth2.py` internally, but you need to generate the initial token file yourself.
    
    ```bash
    # Download script for initial setup
    curl -O https://raw.githubusercontent.com/muttmua/mutt/master/contrib/mutt_oauth2.py
    chmod +x mutt_oauth2.py
    
    # Run interactive setup
    ./mutt_oauth2.py --verbose --authorize --authflow localhost ~/.password-store/email/personal.token
    ```
    
3.  **Store the Token**:
    Save the token file path or encypt it. If you use `pass`, you can store the *file path* in pass, OR just point `passwordCommand` to the token file directly if it's secured.
    
    *Recommended*: Store the token in a secure path (e.g. `~/.config/tokens/gmail`) and reference it:
    `passwordCommand = "~/.config/tokens/gmail";`
    
    The system will automatically detect if `passwordCommand` is a file path and use the internal `mutt_oauth2.py` to refresh the access token on runtime.

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
