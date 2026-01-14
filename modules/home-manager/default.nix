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

  config = mkIf cfg.enable {
    # This is where we will eventually write the implementation:
    # 1. Generate the JSON spec file
    # 2. Call the generator script to produce .mbsyncrc, .msmtp, etc
    # 3. Define systemd services
    
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
          export PATH=${lib.makeBinPath [ pkgs.python311 pkgs.isync pkgs.notmuch pkgs.msmtp ]}:$PATH
          
          # 1. Regenerate configs (handles refreshed oauth tokens if needed)
          python3 ${../../src/generate_config.py}
          
          # 2. Sync Mail
          echo "Syncing mail..."
          mbsync -a
          
          # 3. Index Mail
          echo "Indexing mail..."
          notmuch new
          
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

    # Systemd Service: AI Classifier
    systemd.user.services.axios-ai-classifier = mkIf cfg.ai.enable {
      Unit = {
        Description = "Axios AI Email Classifier";
        After = [ "axios-mail-sync.service" ];
      };
      Service = {
        Type = "oneshot";
        ExecStart = "${pkgs.python311}/bin/python3 ${../../src/ai_classifier.py}";
      };
    };

    # Optional: Trigger classifier immediately after sync
    # (Or we can run it on its own timer, but event-driven is better)
    # For now, let's chain it in the sync script OR make it triggered.
    # A cleaner approach is to have the sync service 'Wants' the classifier
    # if it finds new mail, but systemd chaining is easier via `ExecStartPost` or a separate timer.
    
    # Let's run classifier 1 minute after syncs, or just trigger it via the sync script?
    # Actually, appending it to the sync script is the most robust way to ensure ordering.
    
    # REVISION: Let's remove the separate service triggering logic and just append it 
    # to the sync pipeline if enabled. It's simpler.
