# Implementation Tasks

- [ ] Verify structure of `programs.astroid` and `programs.alot` in Home Manager via docs/repl.
- [ ] Update `client` enum to `[ "none" "alot" "astroid" ]`.
- [ ] Remove legacy `aerc` and `meli` integration blocks from `modules/home-manager/default.nix`.
- [ ] Implement `programs.alot` integration:
    - [ ] Map accounts.
    - [ ] Configure `msmtp` sending.
- [ ] Implement `programs.astroid` integration:
    - [ ] Map accounts (if HM supports structured accounts for Astroid, otherwise generate config).
- [ ] Update README:
    - [ ] Document new client choices.
    - [ ] Highlight "Notmuch Native" benefits.
- [ ] Verify builds.
