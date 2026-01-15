# Proposal: Switch to Notmuch-Native Clients (Alot & Astroid)

## Why
The previous integration with `aerc` and `meli` faced friction because those clients are primarily Maildir-centric or require complex mapping to leverage `notmuch` capabilities (like AI tagging). To provide a seamless "Axios AI" experience, we need clients that are **native** to `notmuch`:
1.  **Tag Visibility**: Smart tags (`important`, `junk`) are first-class citizens in `astroid` and `alot`.
2.  **Configuration**: Both have standard Home Manager modules that map cleanly to our account models.
3.  **Simplicity**: Removing the layer of "Maildir viewing" allows direct interaction with the AI-classified index.

## What Changes
1.  **Remove** `aerc` and `meli` integration from the Nix module.
2.  **Add** `client` option enum values: `alot`, `astroid`, `none`.
3.  **Implement** automated configuration generation for `alot` (TUI) and `astroid` (GUI) using their respective Home Manager modules.
4.  **Cleanup** legacy manual config generation code.

## Impact
- **Users**: Will now choose between a TUI (`alot`) or GUI (`astroid`) that "just works" with tags.
- **Migration**: Users currently using `client = "aerc"` will need to switch configuration or maintain manual setup.
- **Experience**: Drastically improved AI workflow visibility (tags vs folders).
