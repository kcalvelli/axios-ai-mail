# Implementation Tasks

## 1. Backend - Smart Reply Generation

- [ ] 1.1 Add reply generation method to AIClassifier
  - Create `generate_replies(message: Message) -> List[str]` method
  - Build prompt requesting 3-4 short, contextual replies
  - Parse JSON response with reply suggestions
  - Handle edge cases (empty response, invalid JSON)
  - Return list of reply strings

- [ ] 1.2 Create reply generation prompt
  - Include message subject, sender, snippet
  - Request professional but friendly tone
  - Ask for variety (casual, neutral, formal if applicable)
  - Limit to 1-2 sentences each
  - Specify JSON output format

- [ ] 1.3 Add smart replies API endpoint
  - Create `GET /api/messages/{id}/smart-replies` endpoint
  - Return `{"replies": [{"id": "1", "text": "..."}], "generated_at": "..."}`
  - Check message exists (404 if not)
  - Check message is not from sent folder (return empty array)
  - Check message tags (skip generation for newsletter/junk)

- [ ] 1.4 Add response models
  - Create `SmartReplyResponse` Pydantic model
  - Create `SmartReply` model with id and text fields
  - Add to API models

## 2. Frontend - Smart Replies Component

- [ ] 2.1 Create SmartReplies component
  - Create `web/src/components/SmartReplies.tsx`
  - Accept `messageId` and `onSelectReply` props
  - Display replies as MUI Chips
  - Show loading skeleton while fetching
  - Hide on error (graceful degradation)

- [ ] 2.2 Add smart replies hook
  - Create `useSmartReplies(messageId)` hook in `useMessages.ts`
  - Fetch from `/api/messages/{id}/smart-replies`
  - Handle loading, error, and data states
  - Configure appropriate staleTime (5 minutes)

- [ ] 2.3 Integrate into MessageDetailPage
  - Import SmartReplies component
  - Add below message body, before metadata section
  - Only show for inbox messages (not sent/trash)
  - Pass handler to navigate to compose with reply

- [ ] 2.4 Update Compose page for body param
  - Read `body` query parameter
  - Pre-populate editor content with body value
  - Maintain existing quote behavior (append below body)
  - Handle URL decoding

## 3. Styling and UX

- [ ] 3.1 Style SmartReplies component
  - Use MUI Chip with outlined variant
  - Add hover effect and cursor pointer
  - Add "AI" icon or badge to indicate AI-generated
  - Responsive layout (wrap on small screens)

- [ ] 3.2 Add loading skeleton
  - Show 3 placeholder chips while loading
  - Use MUI Skeleton component
  - Match size/spacing of real chips

- [ ] 3.3 Add section header
  - Add "Quick Replies" or "Suggested Replies" label
  - Add subtle AI indicator
  - Optional: Add info tooltip explaining feature

## 4. Testing

- [ ] 4.1 Backend unit tests
  - Test reply generation with mock Ollama response
  - Test empty message handling
  - Test JSON parsing edge cases
  - Test API endpoint responses

- [ ] 4.2 Frontend unit tests
  - Test SmartReplies component rendering
  - Test loading state
  - Test chip click handling
  - Test error state (hidden)

- [ ] 4.3 Manual testing checklist
  - [ ] Smart replies appear for inbox messages
  - [ ] Smart replies hidden for sent messages
  - [ ] Smart replies hidden for newsletters
  - [ ] Clicking reply opens compose with text
  - [ ] Pre-filled text is editable
  - [ ] Quote appears below pre-filled reply
  - [ ] Loading skeleton shows during generation
  - [ ] Component hidden on AI error

## 5. Documentation

- [ ] 5.1 Update README
  - Add Smart Replies to features list
  - Document in Web UI Features section

- [ ] 5.2 Update API documentation (if exists)
  - Document new endpoint
  - Include request/response examples

## Dependency Order

```
1. Backend - Reply Generation (1.1-1.4)
   └── No dependencies, can start immediately

2. Frontend - Component (2.1-2.4)
   └── Depends on backend endpoint (1.3)

3. Styling (3.1-3.3)
   └── Depends on component (2.1)

4. Testing (4.1-4.3)
   └── Depends on implementation

5. Documentation (5.1-5.2)
   └── Depends on all above
```

## Parallelizable Work

- Backend (1.x) and Frontend structure (2.1, 2.4) can be developed in parallel
- Styling (3.x) can be done alongside integration (2.3)
- Tests (4.x) can be written as features are completed
