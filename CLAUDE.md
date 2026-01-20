<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Deployment Workflow

**IMPORTANT: Do NOT manually start the application with `./result/bin/axios-ai-mail` or `nix build` commands!**

This project runs as **system-level systemd services** managed by the NixOS module. The correct workflow is:

## After making changes:

1. Commit and push to GitHub:
   ```bash
   git add -A && git commit -m "message" && git push
   ```

2. Update the flake and rebuild NixOS (run from `~/.config/nixos_config`):
   ```bash
   cd ~/.config/nixos_config && nix flake update axios-ai-mail && sudo nixos-rebuild switch --flake .
   ```

3. The systemd service will restart automatically if the package changed.

## Service management:

```bash
# Check service status
systemctl status axios-ai-mail-web.service
systemctl status axios-ai-mail-sync.timer

# Restart web service manually if needed
sudo systemctl restart axios-ai-mail-web.service

# Trigger a sync manually (instead of waiting for timer)
sudo systemctl start axios-ai-mail-sync.service

# View web service logs
sudo journalctl -u axios-ai-mail-web.service -f

# View sync service logs (where pending operations are processed)
sudo journalctl -u axios-ai-mail-sync.service -f
```

## Why not manual execution?

- Manual execution bypasses systemd and won't pick up changes on rebuild
- Creates confusion with multiple instances from different Nix store paths
- Loses systemd's restart-on-failure and logging benefits

# NixOS/Home-Manager Integration

Split architecture for proper Nix dependency tracking:
- **NixOS module**: System services (web, sync timer, tailscale-serve)
- **Home-manager module**: User config only (accounts, AI settings, generates config.yaml)

## Usage in your NixOS flake:

```nix
{
  inputs.axios-ai-mail.url = "github:kcalvelli/axios-ai-mail";

  outputs = { nixpkgs, axios-ai-mail, ... }: {
    nixosConfigurations.myhost = nixpkgs.lib.nixosSystem {
      modules = [
        # 1. Apply overlay (adds pkgs.axios-ai-mail)
        { nixpkgs.overlays = [ axios-ai-mail.overlays.default ]; }

        # 2. Import NixOS module for web service
        axios-ai-mail.nixosModules.default

        # 3. Enable the service
        {
          services.axios-ai-mail = {
            enable = true;
            port = 8080;
            user = "keith";  # Reads config from this user's home
          };
        }

        # 4. Home-manager for user config (accounts, AI settings)
        {
          home-manager.users.keith = { ... }: {
            imports = [ axios-ai-mail.homeManagerModules.default ];

            programs.axios-ai-mail = {
              enable = true;
              accounts.gmail = {
                provider = "gmail";
                email = "user@gmail.com";
                oauthTokenFile = "/run/agenix/gmail-token";
              };
              ai.model = "mistral";
            };
          };
        }
      ];
    };
  };
}
```

## Key Points:

1. **Overlay required**: Adds `pkgs.axios-ai-mail` - proper dependency tracking
2. **NixOS module**: Runs web service as system service
3. **Home-manager module**: User-specific config (accounts, settings)