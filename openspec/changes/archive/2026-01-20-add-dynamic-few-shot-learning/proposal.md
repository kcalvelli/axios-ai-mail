# Proposal: Dynamic Few-Shot Learning for AI Classifier (DFSL-001)

## Why

The current classifier uses a static system prompt. While effective for general categories, it cannot adapt to nuanced user preferences (e.g., whether GitHub notifications should be tagged as "work" or "dev"). Retraining the model locally is computationally expensive, but injecting 3-5 "Gold Standard" examples into the prompt context efficiently aligns the LLM with user intent in real-time.

**Benefits:**
- Classification accuracy improves based on individual user preferences
- No model retraining or service restarts required
- Learning takes effect immediately after user correction
- Minimal computational overhead (just prompt augmentation)

## What Changes

Introduce a learning feedback loop for the AI classifier that uses user tag corrections as few-shot examples in subsequent classification requests, enabling real-time adaptation to user preferences without model fine-tuning.

**Components Added:**
- DFSL feedback fields in existing Feedback database model (sender_domain, subject_pattern, context_snippet, used_count)
- Backend logic to capture tag corrections with context (domain, subject pattern, snippet)
- Retrieval of relevant examples during classification (prioritizing domain matches)
- Prompt augmentation with few-shot examples in User Preference History block
- API endpoints to view/manage learned corrections (/api/feedback, /api/feedback/stats)
- Automatic cleanup of old/excessive feedback entries during sync

## Scope

**In Scope:**
- Enhanced `Feedback` database model with DFSL fields
- Backend logic to capture tag corrections
- Retrieval of relevant examples during classification
- Prompt augmentation with few-shot examples
- API to view/manage learned corrections

**Out of Scope:**
- Vector embeddings for semantic similarity (future enhancement)
- Cross-account learning sharing
- Bulk import of training examples
- UI for managing feedback (can use existing tag edit)

## Success Criteria

1. System correctly classifies a previously mis-tagged sender/subject pattern within one iteration of a manual correction
2. Classification latency remains under 2 seconds on local hardware
3. Zero manual retraining or service restarts required for learning to take effect
4. Prompt context stays within model limits (< 4K tokens total)
