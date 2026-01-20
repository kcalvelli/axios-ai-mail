# Design: Dynamic Few-Shot Learning

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User edits    │────▶│  Record feedback │────▶│ classification_ │
│   message tags  │     │  (API endpoint)  │     │ feedback table  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Sync Engine    │────▶│  AIClassifier    │────▶│ Retrieve recent │
│  (new email)    │     │  classify()      │     │ corrections     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                         │
                                ▼                         │
                        ┌──────────────────┐              │
                        │ Augment prompt   │◀─────────────┘
                        │ with examples    │
                        └──────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │ Ollama LLM       │
                        │ (few-shot aware) │
                        └──────────────────┘
```

## Database Schema

### New Table: classification_feedback

```sql
CREATE TABLE classification_feedback (
    id TEXT PRIMARY KEY,              -- UUID
    account_id TEXT NOT NULL,         -- FK to accounts (user-specific learning)
    message_id TEXT,                  -- FK to messages (nullable, for orphan cleanup)
    sender_domain TEXT NOT NULL,      -- Extracted domain for similarity matching
    subject_pattern TEXT,             -- Normalized subject (numbers removed, etc.)
    original_tags TEXT NOT NULL,      -- JSON array of AI-suggested tags
    corrected_tags TEXT NOT NULL,     -- JSON array of user-assigned tags
    context_snippet TEXT,             -- First 200 chars of body for prompt context
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_count INTEGER DEFAULT 0,     -- Track how often this example is used

    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL
);

CREATE INDEX idx_feedback_account ON classification_feedback(account_id);
CREATE INDEX idx_feedback_domain ON classification_feedback(sender_domain);
CREATE INDEX idx_feedback_created ON classification_feedback(created_at DESC);
```

### Design Decisions

1. **Per-account learning**: Each user's corrections only affect their own classifications
2. **Soft FK to messages**: If message is deleted, keep the feedback (learning persists)
3. **Sender domain extraction**: `user@github.com` → `github.com` for matching
4. **Subject normalization**: Remove ticket numbers, dates, etc. for pattern matching

## Correction Capture Logic

### When to Record Feedback

Record a correction when:
1. User explicitly edits tags (PUT /api/messages/{id}/tags)
2. The new tags differ from the AI-assigned tags
3. The message has been classified (has classification record)

```python
def should_record_feedback(original_tags: List[str], new_tags: List[str]) -> bool:
    """Only record if tags actually changed."""
    return set(original_tags) != set(new_tags)
```

### What to Store

```python
def create_feedback(message: Message, original: Classification, new_tags: List[str]) -> Feedback:
    return Feedback(
        account_id=message.account_id,
        message_id=message.id,
        sender_domain=extract_domain(message.from_email),
        subject_pattern=normalize_subject(message.subject),
        original_tags=json.dumps(original.tags),
        corrected_tags=json.dumps(new_tags),
        context_snippet=message.snippet[:200],
    )
```

## Example Retrieval Strategy

### Selection Criteria

For a new email being classified, retrieve up to 5 examples prioritized by:

1. **Exact domain match** (highest priority)
   - Same sender domain as the new email

2. **Recency** (secondary)
   - More recent corrections are more likely to reflect current preferences

3. **Diversity** (tertiary)
   - Avoid 5 examples all from the same domain

### Query

```python
def get_relevant_examples(
    account_id: str,
    sender_domain: str,
    limit: int = 5
) -> List[Feedback]:
    """Get most relevant correction examples for few-shot learning."""

    # First: exact domain matches (up to 3)
    domain_matches = db.query(Feedback)
        .filter(account_id=account_id, sender_domain=sender_domain)
        .order_by(created_at.desc())
        .limit(3)

    # Fill remaining slots with recent corrections from other domains
    remaining = limit - len(domain_matches)
    if remaining > 0:
        other_matches = db.query(Feedback)
            .filter(account_id=account_id, sender_domain != sender_domain)
            .order_by(created_at.desc())
            .limit(remaining)

    return domain_matches + other_matches
```

## Prompt Augmentation

### Template

```
Analyze this email and classify it with structured tags.

USER PREFERENCE HISTORY:
(The user has made these corrections to similar emails in the past)
- From: notifications@github.com | Subject: "[repo] PR #123 merged" | User tags: [dev, work]
  (AI originally suggested: [dev] → User corrected to: [dev, work])
- From: news@medium.com | Subject: "Weekly digest" | User tags: [newsletter]
  (AI originally suggested: [junk] → User corrected to: [newsletter])

EMAIL CONTENT:
Subject: {message.subject}
From: {message.from_email}
...

AVAILABLE TAGS:
...

CLASSIFICATION RULES:
...
Consider the user's past corrections when choosing tags. If you see similar patterns
to the examples above, follow the user's demonstrated preferences.
```

### Token Budget

- Base prompt: ~800 tokens
- Per example: ~80 tokens × 5 = 400 tokens
- Email content: ~300 tokens
- **Total: ~1500 tokens** (well within 4K context)

## Maintenance

### Cleanup Strategy

1. **Age-based**: Delete feedback older than 90 days
2. **Count-based**: Keep at most 100 feedback entries per account
3. **Orphan cleanup**: Remove entries where message was permanently deleted

### API for Management

```
GET  /api/feedback              - List corrections for current account
GET  /api/feedback/stats        - Learning statistics
DELETE /api/feedback/{id}       - Remove a specific correction
DELETE /api/feedback            - Clear all corrections (reset learning)
```

## Future Enhancements

1. **Semantic similarity**: Use embeddings to find conceptually similar emails
2. **Confidence weighting**: Weight examples by how confident the original classification was
3. **Negative examples**: Track emails the user explicitly did NOT re-tag (implicit approval)
4. **Cross-tag learning**: Learn tag co-occurrence patterns
