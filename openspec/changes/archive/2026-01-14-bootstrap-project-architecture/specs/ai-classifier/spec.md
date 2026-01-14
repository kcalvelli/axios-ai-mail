## ADDED Requirements

### Requirement: Local LLM Classification
The system SHALL classify new, untagged emails into semantic categories (`junk`, `important`, `neutral`) using a local LLM via Ollama.

#### Scenario: Classify an important email
- **WHEN** there is a message with the `new` tag in Notmuch
- **THEN** the AI agent extracts the headers and body snippet
- **AND** it sends them to Ollama for classification
- **AND** it applies the `important` tag while removing the `new` tag

### Requirement: Rate Limiting & Timeouts
The system SHALL handle Ollama timeouts and rate limits gracefully without crashing the sync cycle.

#### Scenario: Handle LLM timeout
- **WHEN** the Ollama service fails to respond within 30 seconds
- **THEN** the AI agent logs the error
- **AND** it skips tagging that message for the current cycle (keeping it marked as `new`)
