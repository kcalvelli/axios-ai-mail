# Design: Message Reading Improvements

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        InboxPage                             │
│  ┌──────────────────────┬──────────────────────────────────┐│
│  │    MessageList       │         ReadingPane              ││
│  │  ┌────────────────┐  │  ┌────────────────────────────┐  ││
│  │  │ ThreadCard     │  │  │ ThreadView                 │  ││
│  │  │  - Summary     │  │  │  ┌──────────────────────┐  │  ││
│  │  │  - Participants│◄─┼──┤  │ MessageBubble        │  │  ││
│  │  │  - Unread count│  │  │  │  - SenderAvatar      │  │  ││
│  │  └────────────────┘  │  │  │  - Header            │  │  ││
│  │  ┌────────────────┐  │  │  │  - Body              │  │  ││
│  │  │ MessageCard    │  │  │  │  - QuotedText        │  │  ││
│  │  │  (single msg)  │  │  │  │  - Attachments       │  │  ││
│  │  └────────────────┘  │  │  └──────────────────────┘  │  ││
│  └──────────────────────┘  │  ┌──────────────────────┐  │  ││
│                            │  │ MessageBubble (N)    │  │  ││
│                            │  └──────────────────────┘  │  ││
│                            └────────────────────────────┘  ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Reading Pane Architecture

**Decision**: Use CSS Grid with resizable panes, not separate routes

**Rationale**:
- Keeps URL simple (`/inbox` shows both list and detail)
- Selected message tracked in URL hash or query param (`/inbox?selected=abc123`)
- Enables keyboard navigation without route changes
- State preserved when switching between messages

**Implementation**:
```typescript
// Layout modes
type LayoutMode = 'list-only' | 'split' | 'detail-only';

// On desktop: default to 'split'
// On mobile: 'list-only' -> click -> 'detail-only' -> back -> 'list-only'
```

### 2. Thread Grouping Strategy

**Decision**: Group in frontend, not backend aggregation

**Rationale**:
- Backend already returns `thread_id` on messages
- Frontend groups by thread_id for display
- Avoids complex SQL GROUP BY with nested message data
- More flexible for different view modes

**API Addition**:
```
GET /api/threads/{thread_id}/messages
Returns all messages in a thread, ordered by date
```

**Frontend Grouping**:
```typescript
// Group messages by thread_id
const threads = useMemo(() => {
  const grouped = new Map<string, Message[]>();
  messages.forEach(msg => {
    const key = msg.thread_id || msg.id; // Fallback for orphan messages
    const thread = grouped.get(key) || [];
    thread.push(msg);
    grouped.set(key, thread);
  });
  return grouped;
}, [messages]);
```

### 3. Quote Detection Algorithm

**Decision**: Regex-based detection with configurable patterns

**Patterns to detect**:
```typescript
const QUOTE_PATTERNS = [
  /^>+\s?/gm,                           // > quoted lines
  /^On .+ wrote:$/m,                     // Gmail style
  /^-{3,}Original Message-{3,}$/m,       // Outlook style
  /^From:.+\nSent:.+\nTo:.+\nSubject:/m, // Outlook headers
  /^\*From:\*.+$/m,                      // Bold from
];
```

**Collapse Strategy**:
- Find first quote marker
- Everything after is collapsed by default
- "Show quoted text" expands inline

### 4. Keyboard Navigation

**Decision**: Global keyboard handler with context awareness

**Implementation**:
```typescript
// useKeyboardNavigation hook
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    // Ignore if typing in input/textarea
    if (e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement) return;

    switch(e.key) {
      case 'j': selectNext(); break;
      case 'k': selectPrev(); break;
      case 'r': reply(); break;
      // ...
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

### 5. Remote Image Blocking

**Decision**: Block by default, load on user action, remember per-sender

**Implementation**:
```typescript
// Sanitize HTML to replace remote images with placeholders
const processHtml = (html: string, loadImages: boolean) => {
  if (loadImages) return html;

  // Replace <img src="http..."> with placeholder
  return html.replace(
    /<img[^>]+src=["']https?:\/\/[^"']+["'][^>]*>/gi,
    '<span class="blocked-image">[Image blocked]</span>'
  );
};

// Store trusted senders in localStorage
const trustedSenders = new Set(JSON.parse(
  localStorage.getItem('trustedImageSenders') || '[]'
));
```

### 6. Dark Mode Email Adaptation

**Decision**: CSS filter inversion with smart color detection

**Rationale**:
- Full inversion (`filter: invert(1)`) breaks images
- Selective inversion of background/text colors
- Preserve image colors

**Implementation**:
```css
/* Dark mode email content wrapper */
.email-content-dark {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

.email-content-dark img {
  /* Don't invert images */
  filter: none;
}

.email-content-dark [style*="background"] {
  /* Invert inline background colors */
  filter: invert(1) hue-rotate(180deg);
}
```

### 7. Sender Avatar Strategy

**Decision**: Gravatar with fallback to initials

**Implementation**:
```typescript
const getAvatarUrl = (email: string) => {
  const hash = md5(email.toLowerCase().trim());
  // d=404 returns 404 if no gravatar, we catch and show initials
  return `https://www.gravatar.com/avatar/${hash}?d=404&s=40`;
};

const getInitials = (email: string, name?: string) => {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  }
  return email[0].toUpperCase();
};
```

### 8. Mobile Swipe Navigation

**Decision**: Swipe left/right on detail view for prev/next message

**Implementation**:
- Reuse `react-swipeable-list` already in project
- Swipe right = previous message
- Swipe left = next message
- Visual indicator showing swipe direction

## State Management

```typescript
// Reading pane state in appStore
interface ReadingPaneState {
  layoutMode: 'list-only' | 'split' | 'detail-only';
  selectedMessageId: string | null;
  selectedThreadId: string | null;
  paneWidth: number; // Percentage for split view
  showQuotedText: boolean; // Global preference
  loadRemoteImages: boolean; // Per-message override
  trustedSenders: Set<string>; // Always load images from these
}
```

## Performance Considerations

1. **Thread loading**: Lazy load thread messages only when thread is expanded
2. **Image loading**: Use `loading="lazy"` for inline images
3. **Quote detection**: Run once on message load, cache result
4. **Keyboard events**: Debounce rapid key presses
5. **Reading pane resize**: Throttle resize events

## Accessibility

1. **Keyboard navigation**: Full keyboard support (WCAG 2.1.1)
2. **Screen reader**: ARIA labels for thread expand/collapse
3. **Focus management**: Focus moves to message content when selected
4. **Skip links**: Skip to message content from header
