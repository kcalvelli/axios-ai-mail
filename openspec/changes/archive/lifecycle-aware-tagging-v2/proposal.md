# Intelligent Lifecycle & Tagging Integration

## Objective
Refactor the classification pipeline to ensure emails stay in the inbox by default unless explicitly identified as "archivable". Introduce structured tags for todo, finance, and priority levels, and expose these in the email client.

## Technical Plan

### Python Logic (src/ai_classifier.py)
Replace `classify_email` logic with a JSON-based extraction approach.
- **Protocol**: Use `format="json"` with Ollama API.
- **Schema**:
    ```json
    {
      "tags": ["personal", "work", "finance", "travel", "dev"],
      "priority": "high" | "normal",
      "action_required": boolean,
      "can_archive": boolean
    }
    ```
- **Lifecycle Logic**:
    - Apply categorical tags (`work`, `finance`, etc).
    - Apply metadata tags (`prio-high`, `todo`).
    - Remove `new` tag.
    - Remove `inbox` tag (Archive) **ONLY IF** `can_archive=true` AND `action_required=false`.

### Client Integration (Aerc)
Map the new tags to the Aerc sidebar using `notmuch.querymap`.
- `Inbox`: `tag:inbox`
- `To-Do`: `tag:todo`
- `High Priority`: `tag:prio-high`
- `Work`: `tag:work`
- `Finance`: `tag:finance`
- `Junk`: `tag:junk`

(Note: Original request mentioned Astroid, but project architecture has pivoted to Aerc. These views work identically in Aerc's sidebar).
