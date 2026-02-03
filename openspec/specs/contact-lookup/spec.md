# contact-lookup Specification

## Purpose
TBD - created by archiving change add-contact-lookup-for-compose. Update Purpose after archive.
## Requirements
### Requirement: Contact Search API Endpoint

The system SHALL provide a REST endpoint `GET /api/contacts/search` that proxies contact searches to mcp-gateway for web UI autocomplete.

#### Scenario: Web UI searches contacts
- **WHEN** frontend calls `GET /api/contacts/search?q=john`
- **THEN** backend queries mcp-gateway's `dav/search_contacts`
- **AND** returns JSON array of contacts with name, email, and organization

#### Scenario: Minimum query length
- **WHEN** query is fewer than 2 characters
- **THEN** endpoint returns empty results without calling gateway

#### Scenario: Gateway unavailable
- **WHEN** mcp-gateway is unreachable
- **THEN** endpoint returns empty results
- **AND** logs a warning
- **AND** does not return an error to the client

### Requirement: Recipient Autocomplete in Compose Form

The system SHALL provide autocomplete functionality in the email compose form's To, CC, and BCC fields, populated from contact search results.

#### Scenario: User types recipient name
- **WHEN** user types "joh" in the To field
- **THEN** system queries `/api/contacts/search?q=joh` after debounce delay
- **AND** displays dropdown with matching contacts showing name and email

#### Scenario: User selects contact from autocomplete
- **WHEN** user clicks or presses Enter on a contact in the dropdown
- **THEN** contact's email is added to the recipient field
- **AND** dropdown closes

#### Scenario: Keyboard navigation
- **WHEN** autocomplete dropdown is visible
- **THEN** user can navigate with Up/Down arrows and select with Enter
- **AND** Escape closes the dropdown

#### Scenario: Multiple recipients
- **WHEN** user has already added recipients to a field
- **THEN** autocomplete still works for adding additional recipients
- **AND** existing recipients are displayed as removable chips

