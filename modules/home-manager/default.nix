# Curried function: first takes packages from flake, then module args
{ axios-ai-mail-pkg, axios-ai-mail-web-pkg }:
{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.programs.axios-ai-mail;

  # Packages come directly from flake closure - proper dependency tracking
  webFrontend = axios-ai-mail-web-pkg;

  # Submodule for individual email accounts
  accountOption = types.submodule ({ name, config, ... }: {
    options = {
      provider = mkOption {
        type = types.enum [ "gmail" "imap" "outlook" ];
        description = "Email provider type.";
        example = "gmail";
      };

      email = mkOption {
        type = types.str;
        description = "Email address for this account.";
        example = "user@gmail.com";
      };

      realName = mkOption {
        type = types.str;
        default = "";
        description = "Real name to display for this account.";
        example = "John Doe";
      };

      # OAuth2 configuration (for Gmail, Outlook)
      oauthTokenFile = mkOption {
        type = types.nullOr types.str;
        default = null;
        description = ''
          Path to OAuth2 token file (decrypted by sops-nix, agenix, or systemd-creds).
          Required for Gmail and Outlook providers.
        '';
        example = literalExpression ''config.sops.secrets."email/gmail-oauth".path'';
      };

      # IMAP configuration (for IMAP provider)
      passwordFile = mkOption {
        type = types.nullOr types.str;
        default = null;
        description = ''
          Path to password file for IMAP authentication.
          Required for IMAP provider.
        '';
        example = literalExpression ''config.sops.secrets."email/fastmail-password".path'';
      };

      imap = mkOption {
        type = types.nullOr (types.submodule {
          options = {
            host = mkOption {
              type = types.str;
              description = "IMAP server hostname.";
              example = "imap.fastmail.com";
            };

            port = mkOption {
              type = types.port;
              default = 993;
              description = "IMAP server port.";
            };

            tls = mkOption {
              type = types.bool;
              default = true;
              description = "Use TLS for IMAP connection.";
            };
          };
        });
        default = null;
        description = "IMAP server configuration (required for IMAP provider).";
      };

      smtp = mkOption {
        type = types.nullOr (types.submodule {
          options = {
            host = mkOption {
              type = types.str;
              description = "SMTP server hostname.";
              example = "smtp.fastmail.com";
            };

            port = mkOption {
              type = types.port;
              default = 465;
              description = "SMTP server port.";
            };

            tls = mkOption {
              type = types.bool;
              default = true;
              description = "Use TLS for SMTP connection.";
            };
          };
        });
        default = null;
        description = "SMTP server configuration (for sending mail).";
      };

      sync = mkOption {
        type = types.submodule {
          options = {
            frequency = mkOption {
              type = types.str;
              default = "5m";
              description = "Sync frequency (systemd timer format).";
              example = "10m";
            };

            enableWebhooks = mkOption {
              type = types.bool;
              default = false;
              description = "Enable real-time webhooks (Gmail Pub/Sub, MS Graph notifications).";
            };
          };
        };
        default = {};
        description = "Sync configuration for this account.";
      };

      labels = mkOption {
        type = types.submodule {
          options = {
            prefix = mkOption {
              type = types.str;
              default = "AI";
              description = "Prefix for AI-generated labels.";
              example = "MyAI";
            };

            colors = mkOption {
              type = types.attrsOf types.str;
              default = {
                work = "blue";
                finance = "green";
                todo = "orange";
                priority = "red";
                personal = "purple";
                dev = "cyan";
              };
              description = "Label colors (provider-specific format).";
            };
          };
        };
        default = {};
        description = "Label configuration for AI tags.";
      };
    };
  });

  # Runtime configuration file
  runtimeConfig = {
    database_path = "${config.xdg.dataHome}/axios-ai-mail/mail.db";

    accounts = mapAttrs (name: account: {
      id = name;
      provider = account.provider;
      email = account.email;
      real_name = account.realName;

      credential_file =
        if account.oauthTokenFile != null then account.oauthTokenFile
        else if account.passwordFile != null then account.passwordFile
        else throw "Account ${name}: either oauthTokenFile or passwordFile must be set";

      settings = {
        label_prefix = account.labels.prefix;
        label_colors = account.labels.colors;
        sync_frequency = account.sync.frequency;
        enable_webhooks = account.sync.enableWebhooks;
        ai_model = cfg.ai.model;
        ai_endpoint = cfg.ai.endpoint;
        ai_temperature = cfg.ai.temperature;
      } // optionalAttrs (account.imap != null) {
        imap_host = account.imap.host;
        imap_port = account.imap.port;
        imap_tls = account.imap.tls;
      } // optionalAttrs (account.smtp != null) {
        smtp_host = account.smtp.host;
        smtp_port = account.smtp.port;
        smtp_tls = account.smtp.tls;
        # SMTP uses same password as IMAP by default
        smtp_password_file = account.passwordFile;
      };
    }) cfg.accounts;

    ai = {
      enable = cfg.ai.enable;
      model = cfg.ai.model;
      endpoint = cfg.ai.endpoint;
      temperature = cfg.ai.temperature;
      useDefaultTags = cfg.ai.useDefaultTags;
      tags = cfg.ai.tags;
      excludeTags = cfg.ai.excludeTags;
      labelPrefix = cfg.ai.labelPrefix;
      labelColors = cfg.ai.labelColors;
    };

    # Global sync config
    sync = {
      frequency = cfg.sync.frequency;
      maxMessagesPerSync = cfg.sync.maxMessagesPerSync;
      enableWebhooks = cfg.sync.enableWebhooks;
    };

    ui = {
      enable = cfg.ui.enable;
      type = cfg.ui.type;
      port = cfg.ui.port;
    };
  };

  # Package comes from flake - no fallback needed
  # This ensures proper versioning and avoids eval cache issues
  axios-ai-mail = axios-ai-mail-pkg;

in {
  options.programs.axios-ai-mail = {
    enable = mkEnableOption "axios-ai-mail v2";

    package = mkOption {
      type = types.package;
      default = axios-ai-mail;
      defaultText = literalExpression "pkgs.axios-ai-mail";
      description = "The axios-ai-mail package to use.";
    };

    accounts = mkOption {
      type = types.attrsOf accountOption;
      default = {};
      description = "Email accounts to manage with axios-ai-mail.";
      example = literalExpression ''
        {
          personal = {
            provider = "gmail";
            email = "user@gmail.com";
            realName = "John Doe";
            oauthTokenFile = config.sops.secrets."gmail-oauth".path;
            sync.frequency = "5m";
            labels.prefix = "AI";
          };

          work = {
            provider = "imap";
            email = "user@fastmail.com";
            realName = "John Doe";
            passwordFile = config.sops.secrets."fastmail-password".path;
            imap = {
              host = "imap.fastmail.com";
              port = 993;
            };
            smtp = {
              host = "smtp.fastmail.com";
              port = 465;
            };
          };
        }
      '';
    };

    ai = {
      enable = mkOption {
        type = types.bool;
        default = true;
        description = "Enable AI classification.";
      };

      model = mkOption {
        type = types.str;
        default = "llama3.2";
        description = "Ollama model to use for classification.";
        example = "mistral";
      };

      endpoint = mkOption {
        type = types.str;
        default = "http://localhost:11434";
        description = "Ollama API endpoint.";
      };

      temperature = mkOption {
        type = types.float;
        default = 0.3;
        description = "LLM temperature (0.0-1.0, lower = more deterministic).";
      };

      useDefaultTags = mkOption {
        type = types.bool;
        default = true;
        description = ''
          Use the expanded default tag taxonomy (35 tags covering Priority, Work,
          Personal, Finance, Shopping, Travel, Developer, Marketing, Social, System).
          Custom tags in 'tags' will be appended to defaults.
          Set to false to use only custom tags.
        '';
      };

      tags = mkOption {
        type = types.listOf (types.submodule {
          options = {
            name = mkOption {
              type = types.str;
              description = "Tag name (lowercase, no spaces).";
              example = "work";
            };

            description = mkOption {
              type = types.str;
              description = "Tag description for LLM prompt.";
              example = "Work-related emails";
            };
          };
        });
        default = [];
        description = ''
          Custom tags for AI classification. When useDefaultTags is true (default),
          these are appended to the default taxonomy. When false, only these tags are used.
        '';
        example = literalExpression ''
          [
            { name = "client-acme"; description = "Emails from ACME Corp"; }
            { name = "internal"; description = "Internal company communications"; }
          ]
        '';
      };

      excludeTags = mkOption {
        type = types.listOf types.str;
        default = [];
        description = ''
          Tag names to exclude from the default taxonomy.
          Only effective when useDefaultTags is true.
        '';
        example = [ "hobby" "social" ];
      };

      labelPrefix = mkOption {
        type = types.str;
        default = "AI";
        description = "Prefix for AI-generated labels in email providers.";
      };

      labelColors = mkOption {
        type = types.attrsOf types.str;
        default = {};
        description = ''
          Override colors for specific tags. Colors are auto-derived from tag
          categories by default (Priority=red, Work=blue, Finance=green, etc.).
          Only specify overrides for tags that need different colors.
        '';
        example = literalExpression ''
          {
            urgent = "orange";  # Override default red
            client-acme = "purple";  # Color for custom tag
          }
        '';
      };
    };

    # Global sync configuration (can be overridden per-account)
    sync = mkOption {
      type = types.submodule {
        options = {
          frequency = mkOption {
            type = types.str;
            default = "5m";
            description = "Default sync frequency (systemd timer format).";
          };

          maxMessagesPerSync = mkOption {
            type = types.int;
            default = 100;
            description = "Maximum messages to fetch per sync.";
          };

          enableWebhooks = mkOption {
            type = types.bool;
            default = false;
            description = "Enable real-time webhooks (provider-specific).";
          };
        };
      };
      default = {};
      description = "Global sync configuration. Can be overridden per-account.";
    };

    ui = {
      enable = mkOption {
        type = types.bool;
        default = false;
        description = "Enable web UI (Phase 2 feature).";
      };

      type = mkOption {
        type = types.enum [ "web" "cli" ];
        default = "cli";
        description = "UI type.";
      };

      port = mkOption {
        type = types.port;
        default = 8080;
        description = "Web UI port (if enabled).";
      };
    };
  };

  config = mkIf cfg.enable {
    # Assertions for validation
    assertions = [
      {
        assertion = cfg.accounts != {};
        message = "axios-ai-mail: at least one account must be configured";
      }
    ] ++ (lib.flatten (lib.mapAttrsToList (name: account: [
      {
        assertion = (account.provider == "gmail" || account.provider == "outlook") -> account.oauthTokenFile != null;
        message = "axios-ai-mail account '${name}': OAuth providers (gmail, outlook) require oauthTokenFile";
      }
      {
        assertion = account.provider == "imap" -> (account.passwordFile != null && account.imap != null);
        message = "axios-ai-mail account '${name}': IMAP provider requires passwordFile and imap configuration";
      }
      {
        assertion = account.provider == "imap" -> account.imap.host != "";
        message = "axios-ai-mail account '${name}': IMAP provider requires imap.host";
      }
    ]) cfg.accounts));

    # Install package
    home.packages = [ cfg.package ];

    # Create data directory
    home.file."${config.xdg.dataHome}/axios-ai-mail/.keep".text = "";

    # Generate runtime configuration
    xdg.configFile."axios-ai-mail/config.yaml".text = builtins.toJSON runtimeConfig;

    # Systemd services
    systemd.user.services.axios-ai-mail-sync = {
      Unit = {
        Description = "axios-ai-mail sync service";
        After = [ "network-online.target" ];
        Wants = [ "network-online.target" ];
      };

      Service = {
        Type = "oneshot";
        ExecStart = "${cfg.package}/bin/axios-ai-mail sync run";

        # Environment
        Environment = [
          "PYTHONUNBUFFERED=1"
        ];
      };
    };

    systemd.user.timers.axios-ai-mail-sync = {
      Unit = {
        Description = "axios-ai-mail sync timer";
      };

      Timer = {
        OnBootSec = "2min";
        OnUnitActiveSec = "5min"; # Default, can be overridden per-account
        Unit = "axios-ai-mail-sync.service";
        Persistent = true;
      };

      Install = {
        WantedBy = [ "timers.target" ];
      };
    };

    # Optional: Web UI service (Phase 2)
    systemd.user.services.axios-ai-mail-web = mkIf cfg.ui.enable {
      Unit = {
        Description = "axios-ai-mail web UI";
        After = [ "network-online.target" ];
        Wants = [ "network-online.target" ];
      };

      Service = {
        Type = "simple";
        ExecStart = "${cfg.package}/bin/axios-ai-mail web --port ${toString cfg.ui.port}";
        Restart = "on-failure";
        RestartSec = "5s";

        # Environment for proper logging
        Environment = [
          "PYTHONUNBUFFERED=1"
        ];
      };

      Install = {
        WantedBy = [ "default.target" ];
      };
    };
  };
}
