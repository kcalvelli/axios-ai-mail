# Tasks: Expand NixOS Module with Tailscale Serve and Sync Service

## 1. Tailscale Serve Integration (NixOS module)

- [x] 1.1 Add `tailscaleServe` option set to NixOS module with suboptions:
  - `enable` (bool, default false)
  - `httpsPort` (port, default 8443)

- [x] 1.2 Create systemd service `axios-ai-mail-tailscale-serve` that:
  - Depends on `tailscaled.service` and `axios-ai-mail-web.service`
  - Waits for Tailscale to reach "Running" state (up to 60s timeout)
  - Runs `tailscale serve --bg --https={port} {webPort}`
  - Cleans up serve config on stop
  - Uses `Type=oneshot` with `RemainAfterExit=true`

- [x] 1.3 Add assertion requiring `services.tailscale.enable = true` when tailscaleServe is enabled

## 2. Sync Service Migration (NixOS module)

- [x] 2.1 Add `sync` option set to NixOS module with suboptions:
  - `enable` (bool, default true)
  - `frequency` (str, default "5m")
  - `onBoot` (str, default "2min")

- [x] 2.2 Create systemd service `axios-ai-mail-sync` that:
  - Runs as `cfg.user`
  - Depends on `network-online.target`
  - Executes `axios-ai-mail sync run`
  - Uses `Type=oneshot`

- [x] 2.3 Create systemd timer `axios-ai-mail-sync.timer` that:
  - Triggers sync service at configured frequency
  - Has configurable boot delay (`OnBootSec`)
  - Uses `Persistent=true` for catch-up after sleep/hibernate

## 3. Home-manager Module Cleanup

- [x] 3.1 Remove `systemd.user.services.axios-ai-mail-sync` from home-manager module
- [x] 3.2 Remove `systemd.user.timers.axios-ai-mail-sync` from home-manager module
- [x] 3.3 Remove `sync.frequency` option from home-manager module (kept maxMessagesPerSync and enableWebhooks)

## 4. User Config Migration

- [x] 4.1 Update keith-mail.nix to remove `sync.frequency` configuration
- [x] 4.2 edge.nix uses defaults (sync enabled by default, tailscaleServe already enabled)

## 5. Documentation

- [ ] 5.1 Update CLAUDE.md with new module structure
- [ ] 5.2 Add migration notes for breaking change

## 6. Testing

- [ ] 6.1 Test Tailscale Serve starts correctly after boot
- [ ] 6.2 Test sync service runs at configured intervals
- [ ] 6.3 Test sync timer respects boot delay
- [ ] 6.4 Verify home-manager module works without sync timer
- [ ] 6.5 Verify assertion fires when Tailscale not enabled
