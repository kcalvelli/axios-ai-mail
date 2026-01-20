# Implementation Tasks

## 1. Database Schema

- [ ] 1.1 Add ClassificationFeedback model to db/models.py
- [ ] 1.2 Add indexes for account_id, sender_domain, created_at
- [ ] 1.3 Add helper functions to extract sender domain from email
- [ ] 1.4 Add subject normalization function (remove numbers, dates)

## 2. Feedback Capture

- [ ] 2.1 Add `record_feedback()` method to Database class
- [ ] 2.2 Add `get_original_classification()` lookup for comparison
- [ ] 2.3 Update PUT /api/messages/{id}/tags to capture corrections
- [ ] 2.4 Only record when tags actually changed from AI classification
- [ ] 2.5 Store context snippet (first 200 chars of body)

## 3. Example Retrieval

- [ ] 3.1 Add `get_relevant_feedback()` method to Database class
- [ ] 3.2 Implement domain-match priority (same domain first)
- [ ] 3.3 Implement recency ordering (newest first)
- [ ] 3.4 Add diversity logic (avoid all examples from same domain)
- [ ] 3.5 Limit to 5 examples maximum

## 4. Prompt Augmentation

- [ ] 4.1 Add `_build_few_shot_block()` method to AIClassifier
- [ ] 4.2 Format examples as "User Preference History" section
- [ ] 4.3 Include original vs corrected tags in each example
- [ ] 4.4 Add instruction to follow user's demonstrated preferences
- [ ] 4.5 Update `classify()` to accept database reference for feedback lookup
- [ ] 4.6 Integrate few-shot block into main prompt template

## 5. Sync Engine Integration

- [ ] 5.1 Pass database reference to AIClassifier during sync
- [ ] 5.2 Retrieve feedback examples before each classification
- [ ] 5.3 Log when few-shot examples are used (debug level)
- [ ] 5.4 Track which feedback entries are used (increment used_count)

## 6. Maintenance API

- [ ] 6.1 Add GET /api/feedback endpoint (list corrections)
- [ ] 6.2 Add GET /api/feedback/stats endpoint (learning statistics)
- [ ] 6.3 Add DELETE /api/feedback/{id} endpoint (remove correction)
- [ ] 6.4 Add DELETE /api/feedback endpoint (clear all, reset learning)

## 7. Cleanup & Limits

- [ ] 7.1 Add cleanup job for feedback older than 90 days
- [ ] 7.2 Enforce max 100 feedback entries per account
- [ ] 7.3 Add to maintenance cleanup routine

## 8. Testing

- [ ] 8.1 Test feedback capture on tag update
- [ ] 8.2 Test example retrieval with domain matching
- [ ] 8.3 Test prompt augmentation output
- [ ] 8.4 Test classification with few-shot examples
- [ ] 8.5 Verify classification latency stays under 2s
- [ ] 8.6 Test cleanup limits and age-based removal

## 9. Documentation

- [ ] 9.1 Update ARCHITECTURE.md with few-shot learning section
- [ ] 9.2 Document feedback API in API reference
- [ ] 9.3 Add "How Learning Works" section to USER_GUIDE.md

## Dependencies

- Tasks 1.x must complete before 2.x and 3.x
- Tasks 2.x and 3.x can run in parallel
- Task 4.x depends on 3.x
- Task 5.x depends on 4.x
- Task 6.x can run in parallel with 4.x and 5.x
- Task 7.x depends on 1.x

## Notes

- No UI changes required - learning happens automatically when users edit tags
- Frontend already sends tag updates; backend intercepts to record feedback
- Feedback is per-account - users don't share learned preferences
