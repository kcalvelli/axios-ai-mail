## 1. Core Infrastructure

- [ ] 1.1 Create `gateway_client.py` - HTTP client for mcp-gateway REST API
  - `GatewayClient` class with async httpx
  - `discover_tools()` → `GET /api/tools` (returns available servers and tools)
  - `call_tool(server, tool, arguments)` → `POST /api/tools/{server}/{tool}`
  - Configurable base URL, timeout, retry logic
  - Graceful error handling (connection refused, timeout, 4xx/5xx)

- [ ] 1.2 Create `config/actions.py` - Action registry with built-in defaults
  - `ActionDefinition` dataclass (name, description, server, tool, extraction_prompt, default_args)
  - `DEFAULT_ACTIONS` dict with `add-contact` and `create-reminder`
  - `merge_actions()` function combining defaults with user-defined actions
  - Extraction prompt templates for each built-in action

- [ ] 1.3 Create `action_agent.py` - Core action processing engine
  - `ActionAgent` class with `__init__(db, gateway_client, ai_classifier, config)`
  - `discover_available_actions()` - cross-reference registry with gateway tools
  - `process_actions(account_id, max_actions)` - main processing loop
  - `_extract_data(message, action_def)` - call Ollama with extraction prompt
  - `_execute_action(action_def, extracted_data)` - call mcp-gateway tool
  - `_update_status(message_id, action_name, result)` - update tags and action_log

- [ ] 1.4 Add `ActionLog` model to `db/models.py`
  - Fields: id, message_id, account_id, action_name, server, tool, extracted_data, tool_result, status, error, processed_at
  - Foreign keys to messages and accounts
  - Index on (account_id, processed_at) for cleanup queries

- [ ] 1.5 Add database methods for action log
  - `store_action_log(...)` - record action result
  - `get_action_log(message_id)` - get action history for a message
  - `cleanup_action_log(max_age_days)` - clean old entries
  - `get_pending_action_messages(account_id)` - find messages with action tags

## 2. Integration with Sync Engine

- [ ] 2.1 Add action processing step to `sync_engine.py`
  - Initialize `ActionAgent` with gateway client and config
  - Add step after classification: `self._process_action_tags()`
  - Respect `max_actions_per_sync` config (default: 10)
  - Log action processing results in sync summary

- [ ] 2.2 Update `ai_classifier.py` to exclude action tags
  - Action category tags MUST NOT appear in classifier output
  - Add action tag names to exclusion list in prompt building
  - Ensure DFSL feedback ignores action tag additions/removals

## 3. Tag System Updates

- [ ] 3.1 Add action category to `config/tags.py`
  - Add `"action"` to `CATEGORY_COLORS` (suggest: a distinct color like `"amber"` or `"pink"`)
  - Add default action tags: `add-contact`, `create-reminder`
  - Mark action tags with `"user_only": True` flag (classifier exclusion hint)

- [ ] 3.2 Update `merge_tags()` to include action tags from config
  - Load action definitions from config
  - Generate corresponding tags with action category
  - Ensure custom user actions also create matching tags

## 4. Configuration

- [ ] 4.1 Update `modules/home-manager/default.nix`
  - Add `programs.axios-ai-mail.actions` option set
  - Each action: `{ description, gateway.server, gateway.tool, extractionPrompt?, defaultArgs? }`
  - Add `programs.axios-ai-mail.gateway.url` option (default: `"http://localhost:8085"`)
  - Generate action config into `config.yaml`

- [ ] 4.2 Update `config/loader.py` to load action and gateway config
  - Parse `actions` section from config.yaml
  - Parse `gateway.url` from config.yaml
  - Create `ActionDefinition` instances from config
  - Merge with built-in defaults

## 5. Web UI

- [ ] 5.1 Style action tags distinctively in the frontend
  - Action category tags get a unique visual treatment (icon, border, color)
  - Show processing status indicator (pending, processing, completed, failed)
  - Action tags should be visually distinguishable from classification tags

- [ ] 5.2 Add action tag assignment UX
  - Allow users to add action tags from the tag editor
  - Group action tags separately in the tag picker (e.g., "Actions" section)
  - Show confirmation tooltip: "This tag will trigger an action on next sync"

- [ ] 5.3 Add action log viewer (optional, can defer)
  - Simple list view of recent action results
  - Show: message subject, action name, status, timestamp
  - Filter by status (success/failed)

## 6. API

- [ ] 6.1 Add action log API endpoints
  - `GET /api/actions/log` - list recent action results (with pagination)
  - `GET /api/actions/log/{message_id}` - action history for a specific message
  - `GET /api/actions/available` - list configured action tags and their tool mappings
  - `POST /api/actions/retry/{log_id}` - retry a failed action

## 7. Database Migration

- [ ] 7.1 Create migration for `action_log` table
  - Add table with all fields from model
  - Add indexes
  - No data migration needed (new table)

## 8. Testing

- [ ] 8.1 Unit tests for `gateway_client.py`
  - Mock HTTP responses for tool discovery and execution
  - Test error handling (connection refused, timeout, 4xx, 5xx)

- [ ] 8.2 Unit tests for `action_agent.py`
  - Mock Ollama responses for data extraction
  - Mock gateway client for tool execution
  - Test action tag lifecycle (pending → success, pending → failure)
  - Test max_actions_per_sync limit
  - Test tool availability filtering

- [ ] 8.3 Unit tests for `config/actions.py`
  - Test default action definitions
  - Test merging with custom actions
  - Test extraction prompt templates

- [ ] 8.4 Integration test: end-to-end action flow
  - Create message with action tag
  - Run action agent
  - Verify tag removed and action_log populated
