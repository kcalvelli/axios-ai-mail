# Design: Notmuch Client Integration

## Alot Integration (`programs.alot`)
Home Manager Module: `programs.alot`
Mapping:
- `accounts`: Map `axios` accounts to `programs.alot.accounts`.
  - `sendMailCommand`: `msmtp --account=${name} -t`
  - `realName`, `address`: Direct mapping.
- `bindings`: Set defaults if needed.
- `hooks`: Optional.

Alot automatically discovers the Notmuch database at `~/Mail`. Since `axios-ai-mail` configures `notmuch` globally, `alot` should pick it up instantly.

## Astroid Integration (`programs.astroid`)
Home Manager Module: `programs.astroid`
Mapping:
- `accounts`: Map to `programs.astroid.accounts`.
  - `sendMailCommand`: `msmtp --account=${name} -t`
- `pollScript`: Not needed (we handle polling via systemd).
- `externalEditor`: Default to editor.

Astroid is a GUI client. It relies on `notmuch` explicitly.

## Configuration Logic
```nix
client = mkOption {
  type = types.enum [ "none" "alot" "astroid" ];
  default = "none";
};

config = mkMerge [
  # ... core config ...

  # Alot
  (mkIf (cfg.client == "alot") {
    programs.alot = {
      enable = true;
      accounts = mapAttrs convertToAlot cfg.accounts;
      # ... extra config ...
    };
  })

  # Astroid
  (mkIf (cfg.client == "astroid") {
    programs.astroid = {
      enable = true;
      # ... extra config ...
    };
    # Astroid accounts are often configured in its own config file string in HM?
    # Checking HM: programs.astroid.extraConfig (lua) maybe? 
    # Or strict options? Need to verify HM module shape.
  })
];
```

## Cleanup
- Delete `xdg.configFile."aerc/..."`.
- Delete `xdg.configFile."meli/..."`.
- Remove packages `aerc`, `meli`, `w3m` (unless alot needs w3m).
