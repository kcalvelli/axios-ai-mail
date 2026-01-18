# AI Features Specification

## ADDED Requirements

### Requirement: Smart Reply Generation

The system SHALL generate contextually appropriate reply suggestions for email messages using the local AI model.

#### Scenario: Generate smart replies for actionable message
- **WHEN** user views a message that warrants a reply (inbox message, not newsletter/junk)
- **THEN** the system generates 3-4 short reply suggestions
- **AND** each suggestion is 1-2 sentences maximum
- **AND** suggestions are contextually relevant to the message content

#### Scenario: Smart replies not shown for newsletters
- **WHEN** user views a message tagged as `newsletter` or `junk`
- **THEN** smart reply suggestions are not displayed
- **AND** no API call is made for reply generation

#### Scenario: Smart replies loading state
- **WHEN** smart replies are being generated
- **THEN** the UI displays a loading skeleton with placeholder chips
- **AND** the loading state completes within 5 seconds

#### Scenario: Smart reply generation fails gracefully
- **WHEN** the AI model is unavailable or returns an error
- **THEN** the smart replies section is hidden
- **AND** the user can still manually reply using the Reply button
- **AND** no error message is shown (graceful degradation)

### Requirement: Smart Reply Selection

The system SHALL allow users to select a suggested reply and populate the compose editor.

#### Scenario: User clicks a smart reply
- **WHEN** user clicks on a smart reply chip
- **THEN** the compose page opens with the selected reply pre-filled in the editor
- **AND** the reply metadata (to, subject, thread_id) is populated from the original message
- **AND** the original message quote is included below the pre-filled reply

#### Scenario: User can edit pre-filled reply
- **WHEN** user selects a smart reply and compose page opens
- **THEN** the pre-filled text is editable
- **AND** user can modify, extend, or replace the suggested text
- **AND** user can add attachments normally

### Requirement: Smart Reply API

The system SHALL provide an API endpoint for fetching smart reply suggestions.

#### Scenario: Fetch smart replies via API
- **WHEN** client requests `GET /api/messages/{id}/smart-replies`
- **THEN** the response includes an array of reply suggestions
- **AND** each suggestion has an `id` and `text` field
- **AND** the response includes a `generated_at` timestamp

#### Scenario: Smart replies API with invalid message
- **WHEN** client requests smart replies for a non-existent message
- **THEN** the API returns 404 Not Found

#### Scenario: Smart replies API with sent message
- **WHEN** client requests smart replies for a message in the Sent folder
- **THEN** the API returns an empty replies array
- **AND** no AI generation is performed
