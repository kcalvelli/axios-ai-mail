# Implementation Tasks

- [ ] Define `client` option in `modules/home-manager/default.nix` (enum: `none`, `aerc`, `meli`).
- [ ] Implement Aerc integration:
    - [ ] Create mapping logic for `accounts` -> `programs.aerc.accounts`.
    - [ ] Configure defaults (`unsafe-accounts-conf`, etc).
    - [ ] Ensure `programs.aerc.enable = true` is set.
- [ ] Implement Meli integration:
    - [ ] Create TOML generation logic for `xdg.configFile."meli/config.toml"`.
    - [ ] Add `pkgs.meli` to packages.
- [ ] Update README:
    - [ ] Document the `client` option.
    - [ ] Remove the manual Aerc setup guide (replace with "just set client = 'aerc'").
- [ ] Verification:
    - [ ] Build and verify Aerc config generation.
    - [ ] Build and verify Meli config generation.
