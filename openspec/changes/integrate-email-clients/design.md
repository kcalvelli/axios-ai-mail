# Design: Client Integration

## Configuration Projection

The core logic involves projecting the backend `axios-ai-mail` account model onto the frontend client models.

### Backend Model
```nix
accounts.<name> = {
  address = "...";
  realName = "...";
  flavor = "gmail" | "manual";
  # ...
}
```

### Aerc Projection
Target: `programs.aerc.accounts`
- `source`: `notmuch://${maildirBase}/${name}`
- `outgoing`: `msmtp --account=${name} -t`
- `default`: `INBOX`
- `from`: `${realName} <${address}>`

### Meli Projection
Target: `xdg.configFile."meli/config.toml"` (or HM module if available)
- Meli uses a TOML config.
- We will likely need to generate this TOML since `programs.meli` is not as standard as `aerc`.

## Nix Module Structure

```nix
config = mkMerge [
  # Backend Config (Always)
  (mkIf cfg.enable { ... })
  
  # Aerc Config
  (mkIf (cfg.enable && cfg.client == "aerc") {
    programs.aerc.enable = true;
    programs.aerc.accounts = mapAccountsToAerc cfg.accounts;
    # Opinionated UI defaults
    programs.aerc.extraConfig = { ... };
  })

  # Meli Config
  (mkIf (cfg.enable && cfg.client == "meli") {
    home.packages = [ pkgs.meli ];
    xdg.configFile."meli/config.toml".text = generateMeliConfig cfg.accounts;
  })
];
```

## Considerations
- **Override**: Users might want to add *extra* accounts or *extra* config. Using standard HM modules (`programs.aerc`) allows them to merge their own config alongside ours easily.
- **Dependencies**: `msmtp` is already configured by backend. We rely on it for sending.
