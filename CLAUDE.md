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

This project runs as a **systemd user service** managed by NixOS/home-manager. The correct workflow is:

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
# Check status
systemctl --user status axios-ai-mail-web.service

# Restart manually if needed
systemctl --user restart axios-ai-mail-web.service

# View logs
journalctl --user -u axios-ai-mail-web.service -f
```

## Why not manual execution?

- Manual execution bypasses systemd and won't pick up changes on rebuild
- Creates confusion with multiple instances from different Nix store paths
- Loses systemd's restart-on-failure and logging benefits