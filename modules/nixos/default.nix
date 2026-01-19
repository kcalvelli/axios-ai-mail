# NixOS module for axios-ai-mail
# Provides the package via overlay and optionally runs the web service
{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.services.axios-ai-mail;
in {
  options.services.axios-ai-mail = {
    enable = mkEnableOption "axios-ai-mail web service";

    package = mkOption {
      type = types.package;
      default = pkgs.axios-ai-mail;
      defaultText = literalExpression "pkgs.axios-ai-mail";
      description = "The axios-ai-mail package to use.";
    };

    port = mkOption {
      type = types.port;
      default = 8080;
      description = "Port for the web UI.";
    };

    user = mkOption {
      type = types.str;
      description = "User to run the service as. Config is read from this user's home.";
    };

    group = mkOption {
      type = types.str;
      default = "users";
      description = "Group to run the service as.";
    };

    openFirewall = mkOption {
      type = types.bool;
      default = false;
      description = "Open firewall port for the web UI.";
    };
  };

  config = mkIf cfg.enable {
    # System service for the web UI
    systemd.services.axios-ai-mail-web = {
      description = "axios-ai-mail web UI";
      after = [ "network-online.target" ];
      wants = [ "network-online.target" ];
      wantedBy = [ "multi-user.target" ];

      serviceConfig = {
        Type = "simple";
        User = cfg.user;
        Group = cfg.group;
        ExecStart = "${cfg.package}/bin/axios-ai-mail web --port ${toString cfg.port}";
        Restart = "on-failure";
        RestartSec = "5s";

        # Read config from user's home
        Environment = [
          "PYTHONUNBUFFERED=1"
          "HOME=/home/${cfg.user}"
        ];

        # Hardening
        NoNewPrivileges = true;
        ProtectSystem = "strict";
        ProtectHome = "read-only";
        ReadWritePaths = [
          "/home/${cfg.user}/.local/share/axios-ai-mail"
        ];
        PrivateTmp = true;
      };
    };

    # Firewall
    networking.firewall.allowedTCPPorts = mkIf cfg.openFirewall [ cfg.port ];
  };
}
