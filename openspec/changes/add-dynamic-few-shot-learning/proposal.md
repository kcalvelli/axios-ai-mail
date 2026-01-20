# Proposal: Dynamic Few-Shot Learning for AI Classifier (DFSL-001)

## What

Introduce a learning feedback loop for the AI classifier that uses user tag corrections as few-shot examples in subsequent classification requests, enabling real-time adaptation to user preferences without model fine-tuning.

## Why

The current classifier uses a static system prompt. While effective for general categories, it cannot adapt to nuanced user preferences (e.g., whether GitHub notifications should be tagged as "work" or "dev"). Retraining the model locally is computationally expensive, but injecting 3-5 "Gold Standard" examples into the prompt context efficiently aligns the LLM with user intent in real-time.

**Benefits:**
- Classification accuracy improves based on individual user preferences
- No model retraining or service restarts required
- Learning takes effect immediately after user correction
- Minimal computational overhead (just prompt augmentation)

## How

### 1. Capture Corrections

When a user manually changes tags on a message via the UI, record the correction event with context about the email (sender, subject pattern, snippet).

### 2. Retrieve Relevant Examples

During classification, query recent corrections to find relevant few-shot examples based on:
- Recency (most recent corrections first)
- Similarity (same sender domain, similar subject patterns)

### 3. Augment Prompts

Inject up to 5 relevant correction examples into the classification prompt as a "User Preference History" block, demonstrating how the user prefers similar emails to be tagged.

## Scope

**In Scope:**
- New `classification_feedback` database table
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
