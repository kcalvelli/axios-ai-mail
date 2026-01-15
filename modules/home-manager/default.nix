{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.programs.axios-ai-mail;

  # Submodule for individual email accounts
  accountOption = types.submodule {
    options = {
      primary = mkOption {
        type = types.bool;
        default = false;
        description = "Whether this is the primary account.";
      };

      flavor = mkOption {
        type = types.enum [ "gmail" "outlook" "fastmail" "manual" ];
        default = "manual";
        description = "Preset configuration for common providers.";
      };

      address = mkOption {
        type = types.str;
        description = "Email address.";
      };

      userName = mkOption {
        type = types.str;
        default = "";
        description = "Username for auth (defaults to address if empty).";
      };

      realName = mkOption {
        type = types.str;
        description = "Real name to use for sending.";
      };

      passwordCommand = mkOption {
        type = types.str;
        description = "Shell command to retrieve password/token (e.g. 'pass email/me').";
      };

      imap = {
        host = mkOption { type = types.str; default = ""; };
        port = mkOption { type = types.port; default = 993; };
        tls = mkOption { type = types.bool; default = true; };
      };

      smtp = {
        host = mkOption { type = types.str; default = ""; };
        port = mkOption { type = types.port; default = 587; };
        tls = mkOption { type = types.bool; default = true; };
      };

      folders = {
        inbox = mkOption { type = types.str; default = "Inbox"; };
        sent = mkOption { type = types.str; default = "Sent"; };
        drafts = mkOption { type = types.str; default = "Drafts"; };
        trash = mkOption { type = types.str; default = "Trash"; };
        archive = mkOption { type = types.str; default = "Archive"; };
      };
    };
  };

in {
  options.programs.axios-ai-mail = {
    enable = mkEnableOption "axios-ai-mail system";

    accounts = mkOption {
      type = types.attrsOf accountOption;
      default = {};
      description = "Email accounts to manage.";
    };

    ai = {
      enable = mkEnableOption "AI classification";
      
      endpoint = mkOption {
        type = types.str;
        default = "http://localhost:11434";
        description = "Ollama API endpoint.";
      };

      model = mkOption {
        type = types.str;
        default = "llama3";
        description = "Model to use for classification.";
      };
    };

    client = mkOption {
      type = types.enum [ "none" "aerc" "astroid" ];
      default = "none";
      description = "Email client to automatically configure.";
    };

    settings = {
      maildirBase = mkOption {
        type = types.str;
        default = "~/Mail";
        description = "Base directory for Maildir storage.";
      };
      
      syncFrequency = mkOption {
        type = types.str;
        default = "5m";
        description = "Systemd timer frequency for mail synchronization.";
      };
    };
  };

  config = mkMerge [
    # Core Configuration
    (mkIf cfg.enable {
      home.packages = with pkgs; [
        notmuch
        isync
        msmtp
      ];

      # Write configs
      xdg.configFile."axios-ai-mail/accounts.json".text = builtins.toJSON (
        lib.mapAttrs (name: account: account) cfg.accounts
      );
      
      xdg.configFile."axios-ai-mail/config.json".text = builtins.toJSON {
        ai = cfg.ai;
        settings = cfg.settings;
      };

      # Ensure Maildir exists
      home.activation.createMaildir = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
        mkdir -p ${cfg.settings.maildirBase}
      '';

      # Export NOTMUCH_CONFIG globally so clients (alot, astroid) can find the DB
      home.sessionVariables = {
        NOTMUCH_CONFIG = "${config.xdg.configHome}/notmuch/default/config";
      };

      # Systemd Service: Mail Sync
      systemd.user.services.axios-mail-sync = {
        Unit = {
          Description = "Axios AI Mail Synchronization";
          After = [ "network-online.target" ];
        };
        Service = {
          Type = "oneshot";
          
          # We need to run the generator first to ensure fresh tokens/configs
          # Then sync, then index.
          ExecStart = pkgs.writeShellScript "axios-sync-pipeline" ''
            export PATH=${lib.makeBinPath [ 
              (pkgs.python311.withPackages (ps: [ ps.requests ps.notmuch ])) 
              pkgs.isync 
              pkgs.notmuch 
              pkgs.msmtp 
              pkgs.cyrus_sasl
              pkgs.cyrus-sasl-xoauth2
            ]}:$PATH
            
            # Force Notmuch to use our generated config (Environment variable)
            export NOTMUCH_CONFIG=${config.xdg.configHome}/notmuch/default/config
            # Fix for mbsync missing SASL plugins for XOAUTH2
            # Combine default SASL plugins and the XOAUTH2 plugin
            export SASL_PATH=${pkgs.cyrus_sasl.out}/lib/sasl2:${pkgs.cyrus-sasl-xoauth2}/lib/sasl2
            
            # 1. Regenerate configs (handles refreshed oauth tokens if needed)
            python3 ${../../src/generate_config.py} --oauth-script ${../../src/mutt_oauth2.py}
            
            # 2. Sync Mail (Explicit config path)
            echo "Syncing mail..."
            mbsync -c ${config.home.homeDirectory}/.mbsyncrc -a
            
            # 3. Index Mail (Explicit config path)
            echo "Indexing mail..."
            notmuch --config=${config.xdg.configHome}/notmuch/default/config new
            
            # 4. AI Classification (if enabled)
            ${if cfg.ai.enable then ''
              echo "Running AI Classifier..."
              python3 ${../../src/ai_classifier.py}
            '' else ""}
          '';
        };
      };

      systemd.user.timers.axios-mail-sync = {
        Unit = { Description = "Timer for Axios Mail Sync"; };
        Timer = {
          OnBootSec = "2m";
          OnUnitActiveSec = cfg.settings.syncFrequency;
          Unit = "axios-mail-sync.service";
        };
        Install = { WantedBy = [ "timers.target" ]; };
      };

      # Systemd Service: AI Classifier (Legacy/Disabled separate service in favor of pipeline)
    })

    # Astroid Integration (Restored per user request)
    (mkIf (cfg.enable && cfg.client == "astroid") {
      programs.astroid = {
        enable = true;
        extraConfig = {
          startup = {
            queries = {
               "Inbox" = "tag:inbox";
               "To-Do" = "tag:todo";
               "High Priority" = "tag:prio-high";
               "Work" = "tag:work";
               "Finance" = "tag:finance";
               "Archive" = "tag:archive";
               "Spam" = "tag:junk or tag:spam";
            };
          };
          
          # Widen the tags column to accommodate multiple AI tags
          thread_index = {
            cell = {
              tags_length = 200;
            };
          };
        };
      };
    })

    # Aerc Integration (TUI with Notmuch Backend)
    (mkIf (cfg.enable && cfg.client == "aerc") (
      let
        # Generate query map for each account to filter by path
        queryMaps = lib.mapAttrs' (name: acc: lib.nameValuePair 
          "aerc/map-${name}.conf" 
          {
            text = let prefix = "path:${name}/**"; in ''
              Inbox         = tag:inbox and ${prefix}
              To-Do         = tag:todo and ${prefix}
              High Priority = tag:prio-high and ${prefix}
              Work          = tag:work and ${prefix}
              Finance       = tag:finance and ${prefix}
              Archive       = tag:archive and ${prefix}
              Junk          = (tag:junk or tag:spam) and ${prefix}
              All           = ${prefix}
            '';
          }
        ) cfg.accounts;
      in
      {
        home.packages = [ pkgs.aerc ];
        
        xdg.configFile = {
          # 1. Accounts Configuration
          "aerc/accounts.conf".text = lib.concatStringsSep "\n" (
            lib.mapAttrsToList (name: acc: ''
              [${name}]
              source        = notmuch://${cfg.settings.maildirBase}
              maildir-store = ${cfg.settings.maildirBase}/${name}
              query-map     = ${config.xdg.configHome}/aerc/map-${name}.conf
              from          = ${acc.realName} <${acc.address}>
              outgoing      = msmtp --account=${name} -t
              default       = Inbox
              # Enable threading
              thread-sort   = true
            '') cfg.accounts
          );
          
          # 2. General Configuration
          "aerc/aerc.conf".text = ''
            [general]
            unsafe-accounts-conf = true
            [ui]
            index-columns = date<20,name<17,flags<4,subject<*
            column-date = {{.DateAutoFormat .Date.Local}}
            column-name = {{index (.From | names) 0}}
            column-flags = {{.Flags | join ""}}
            column-subject = {{.Subject}}
          '';
        } // queryMaps;
      }
    ))
  ];
}
