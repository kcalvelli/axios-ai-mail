# Spec Delta: AI Classification with Few-Shot Learning

## ADDED Requirements

### Requirement: Record classification feedback on user tag corrections

The system SHALL record classification feedback when a user manually edits message tags and the new tags differ from the AI-assigned tags.

#### Scenario: User corrects AI-assigned tags

**Given** a message with AI-assigned tags ["dev"]
**When** the user updates the tags to ["dev", "work"]
**Then** a feedback record is created with:
  - The original tags ["dev"]
  - The corrected tags ["dev", "work"]
  - The sender domain extracted from the email
  - A snippet of the email content

#### Scenario: User sets same tags as AI

**Given** a message with AI-assigned tags ["finance"]
**When** the user updates the tags to ["finance"]
**Then** no feedback record is created (tags unchanged)

---

### Requirement: Retrieve relevant feedback examples for classification

The system SHALL retrieve up to 5 relevant feedback examples from the user's correction history when classifying new emails, prioritizing domain matches and recency.

#### Scenario: Domain-matched examples prioritized

**Given** the user has 10 feedback entries, 3 from "github.com" and 7 from other domains
**When** classifying an email from "notifications@github.com"
**Then** the github.com examples are retrieved first, followed by recent examples from other domains

#### Scenario: Recency ordering within domain

**Given** the user has 5 feedback entries from "amazon.com" at different times
**When** classifying an email from "orders@amazon.com"
**Then** the most recent 3-5 examples are selected

#### Scenario: No feedback available

**Given** the user has no feedback entries
**When** classifying a new email
**Then** classification proceeds without few-shot examples (original behavior)

---

### Requirement: Augment classification prompt with few-shot examples

The system SHALL inject available feedback examples into the classification prompt as a "User Preference History" section when examples are available.

#### Scenario: Prompt includes user corrections

**Given** 3 relevant feedback examples are retrieved
**When** building the classification prompt
**Then** the prompt includes a section showing:
  - The sender and subject of each example
  - The original AI tags
  - The user's corrected tags
  - Instructions to follow user preferences

#### Scenario: Token budget respected

**Given** feedback examples would exceed token budget
**When** building the classification prompt
**Then** examples are truncated to stay within 4K total tokens

---

### Requirement: Feedback management API

The system SHALL provide API endpoints to view and manage classification feedback.

#### Scenario: List feedback entries

**Given** the user has 15 feedback entries
**When** GET /api/feedback is called
**Then** all feedback entries are returned with sender, subject pattern, original and corrected tags

#### Scenario: View learning statistics

**Given** the user has feedback entries with usage counts
**When** GET /api/feedback/stats is called
**Then** statistics are returned including total corrections, most corrected domains, and usage counts

#### Scenario: Delete specific feedback

**Given** a feedback entry with ID "abc123"
**When** DELETE /api/feedback/abc123 is called
**Then** the feedback entry is removed and will not be used in future classifications

#### Scenario: Reset all learning

**Given** the user has 50 feedback entries
**When** DELETE /api/feedback is called
**Then** all feedback entries are removed and classification reverts to base behavior

---

### Requirement: Automatic feedback cleanup

The system SHALL automatically clean up old or excessive feedback entries to prevent unbounded growth.

#### Scenario: Age-based cleanup

**Given** feedback entries older than 90 days exist
**When** the maintenance cleanup runs
**Then** entries older than 90 days are removed

#### Scenario: Count-based cleanup

**Given** an account has 120 feedback entries
**When** a new feedback entry is created
**Then** the oldest entries are removed to stay at or below 100 entries

### Requirement: Classification uses dynamic context

The AI classifier SHALL use available context including user feedback examples to improve classification accuracy.

#### Scenario: Classification with learned preferences

**Given** the user previously corrected emails from "newsletter@medium.com" from ["junk"] to ["newsletter"]
**When** a new email arrives from "digest@medium.com"
**Then** the classifier receives the previous correction as context
**And** the new email is more likely to be tagged ["newsletter"]
