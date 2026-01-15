# Proposal: Integrated Email Clients

## Why
Currently, users must manually configure an email frontend (like `aerc` or `alot`) separately from the `axios-ai-mail` backend. This leads to:
1.  **Duplication**: Account details (address, name, maildir path) are repeated in two places.
2.  **Friction**: New users have a working backend but no way to read mail until they learn another tool's config.
3.  **Inconsistency**: The "Axios" opinionated experience breaks at the UI layer.

## What Changes
We will extend the `axios-ai-mail` Home Manager module to:
1.  Introduce a `client` option (enum: `aerc`, `meli`, `none`).
2.  Automatically generate the full configuration for the selected client based on the existing `accounts` definition.
3.  Install the necessary client packages automatically.

## Impact
- **Users**: Can enable a full CLI mail experience with one line (`client = "aerc"`).
- **Maintainers**: Must map our abstract account schema to specific client config schemas.
- **Breaking**: None, defaults to `none` (or compatible with existing manual configs via `mkDefault`).
