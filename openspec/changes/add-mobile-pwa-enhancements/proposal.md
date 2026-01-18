# Change: Phase 9 - Mobile PWA Enhancements

## Why

Axios AI Mail has PWA functionality from Phase 8 (manifest, service worker, offline awareness), but it's not optimized for mobile use as a primary email client. When installed as a PWA on a phone, users expect native-like interactions:

**Layout Pain Points (CRITICAL):**
- Current sidebar is 280px fixed width - leaves only ~100px for content on mobile
- Sidebar uses `variant="persistent"` which pushes content, not overlays
- No responsive breakpoints - layout is identical on all screen sizes
- Message cards don't adapt to narrow screens
- Compose page form is cramped on mobile

**Touch Interaction Pain Points:**
- No gesture-based actions for quick email triage
- Users must tap into each message, then tap action buttons
- On mobile, this is too many taps for common workflows (delete spam, reply)
- Competing email apps (Gmail, Outlook) all support swipe gestures

**Visibility Pain Points:**
- Unread count not visible in sidebar/navigation
- Users can't see at-a-glance how many new emails they have
- Drafts already have a badge - inconsistent to not show inbox unread count

**Android PWA Icon Limitations:**
- Current icons use static brand colors
- Android 13+ (Material You) supports themed icons that match system color palette
- Without monochrome icons, the app looks out of place on themed home screens
- This is increasingly expected for modern Android apps

**Business Impact:**
Without these enhancements, axios-ai-mail is literally unusable on mobile phones. The fixed sidebar consumes most of the screen, making the app a desktop-only experience despite PWA support.

## What Changes

### 1. Responsive Layout (Foundation)

**Breakpoint Strategy:**
- **Mobile**: < 600px (xs) - Phones
- **Tablet**: 600px - 900px (sm) - Small tablets, large phones
- **Desktop**: > 900px (md+) - Tablets landscape, desktops

**Sidebar Behavior:**

| Screen Size | Sidebar Type | Default State | On Navigation |
|-------------|--------------|---------------|---------------|
| Mobile (<600px) | Temporary (overlay) | Closed | Auto-close |
| Tablet (600-900px) | Temporary (overlay) | Closed | Auto-close |
| Desktop (>900px) | Persistent (push) | Open | Stay open |

**Implementation:**
- Change `Sidebar` from persistent to temporary drawer on mobile/tablet
- Use MUI's responsive breakpoints (`useMediaQuery`)
- Auto-close sidebar after folder/menu selection on mobile
- Full-width content area on mobile (no sidebar offset)
- Add swipe-from-edge gesture to open sidebar on mobile

**Message Card Adaptations:**
- Hide checkbox on mobile (use swipe for actions instead)
- Reduce padding for denser display
- Truncate subject/snippet more aggressively
- Stack tags vertically if needed

**TopBar Adaptations:**
- Hamburger menu always visible on mobile (to open sidebar)
- Reduce search bar size or move to collapsible
- Ensure touch targets are minimum 44x44px

**Compose Page Adaptations:**
- Full-width form fields
- Larger touch targets for buttons
- Sticky send button at bottom of screen

### 2. Touch Swipe Gestures on Message Cards

**Swipe Actions:**
- **Swipe Left → Delete**: Reveals red trash background, moves message to trash
- **Swipe Right → Reply**: Reveals blue reply background, navigates to compose with reply context

**Implementation:**
- Wrap `MessageCard` in swipeable container
- Use `react-swipeable-list` library (lightweight, MUI-compatible)
- Show action icons behind card during swipe (trash icon left, reply icon right)
- Trigger action when swipe threshold reached (40% of card width)
- Haptic feedback via `navigator.vibrate()` if available
- Only enable on touch devices (detected via media query)

**Visual Feedback:**
- Background color reveals during swipe (red for delete, blue for reply)
- Icon scales up as swipe approaches threshold
- Card snaps back if swipe cancelled
- Toast confirmation after action

### 3. Unread Count Badge in Inbox

**Display:**
- Show unread message count as badge on Inbox folder item in sidebar
- Mirror existing Drafts badge implementation
- Badge shows number (e.g., "5") or "99+" for large counts

**Data Source:**
- Add `/api/messages/unread-count` endpoint
- Fetch count on sidebar mount and periodically refresh (30 seconds, like drafts)
- Update count optimistically when marking messages read/unread

**Integration:**
- Update `folderItems` in Sidebar to include dynamic badge for inbox
- Use existing `Badge` component from MUI

### 4. Material You Dynamic Icon (Monochrome)

**Icon Requirements:**
- Create monochrome (single-color) version of the app icon
- White silhouette on transparent background
- Works at 192x192 and 512x512 sizes

**Manifest Changes:**
```json
{
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "icon-monochrome-192.png", "sizes": "192x192", "type": "image/png", "purpose": "monochrome" },
    { "src": "icon-monochrome-512.png", "sizes": "512x512", "type": "image/png", "purpose": "monochrome" }
  ]
}
```

**Android Behavior:**
- Android 13+ (API 33+) with themed icons enabled will use monochrome icon
- System applies wallpaper-derived color palette to icon
- Falls back to regular icon on older Android or if theming disabled

## Impact

### Affected Capabilities
- `pwa` (MODIFIED) - Monochrome icons for Material You
- `web-ui` (MODIFIED) - Responsive layout, swipe gestures, unread badge

### Affected Code

**New:**
- `web/src/components/SwipeableMessageCard.tsx` - Swipeable wrapper for MessageCard
- `web/src/hooks/useIsMobile.ts` - Breakpoint detection hook
- `web/public/icon-monochrome-192.png` - Monochrome icon (white silhouette)
- `web/public/icon-monochrome-512.png` - Monochrome icon large

**Modified:**
- `web/src/components/Layout.tsx` - Responsive drawer variant, breakpoint logic
- `web/src/components/Sidebar.tsx` - Temporary drawer on mobile, auto-close, unread badge
- `web/src/components/TopBar.tsx` - Mobile-optimized layout
- `web/src/components/MessageCard.tsx` - Mobile-compact variant
- `web/src/components/MessageList.tsx` - Use SwipeableMessageCard on mobile
- `web/src/pages/Compose.tsx` - Mobile-optimized form layout
- `web/vite.config.ts` - Add monochrome icons to manifest
- `src/axios_ai_mail/api/routes/messages.py` - Add unread count endpoint

### Dependencies

**New npm packages:**
- `react-swipeable-list` - Lightweight swipeable list component (~15KB gzipped)

No other new dependencies - MUI already includes `useMediaQuery` for responsive detection.

## Breaking Changes

**None** - All changes are additive or progressive enhancement:
- Desktop experience unchanged (sidebar persistent, same layout)
- Mobile gets improved experience
- Swipe gestures are additional (tap still works)
- Unread badge is visual enhancement only

## User-Facing Changes

### Before
- **Mobile**: Sidebar takes 280px, content cramped/unusable
- **Mobile**: Must tap message → tap action button for every action
- **All**: No unread count visible in sidebar
- **Android**: PWA icon uses static brand colors

### After
- **Mobile**: Full-screen content, sidebar as slide-out overlay
- **Mobile**: Swipe left to delete, swipe right to reply
- **Mobile**: Sidebar auto-closes after navigation
- **All**: Unread badge shows "5" on Inbox
- **Android**: Material You icon matches system theme

## Security Considerations

1. **Swipe Actions**: Trash is reversible (undo via toast), reply just opens compose
2. **No new data exposure**: Unread count is derived from existing message data
3. **Icon files**: Static assets, no security impact

## Performance Considerations

1. **Media Queries**: CSS-based, no JS overhead for basic responsive
2. **useMediaQuery Hook**: Single listener, shared across components
3. **Swipe library**: `react-swipeable-list` is lightweight (~15KB), tree-shakeable
4. **Unread count**: Cached, refreshed every 30s (not on every interaction)
5. **Monochrome icon**: Single additional asset, loaded only on Android

## Testing Strategy

### Manual Testing Checklist

**Responsive Layout:**
- [ ] Mobile (<600px): Sidebar is overlay, not pushing content
- [ ] Mobile: Full-width content when sidebar closed
- [ ] Mobile: Tap folder → sidebar auto-closes
- [ ] Mobile: Swipe from left edge → opens sidebar
- [ ] Tablet: Similar to mobile (overlay sidebar)
- [ ] Desktop: Sidebar persistent, pushes content (unchanged)
- [ ] Resize window → layout adapts smoothly

**Swipe Gestures:**
- [ ] Swipe left on message → delete action works
- [ ] Swipe right on message → navigate to compose/reply
- [ ] Swipe partially and release → card snaps back
- [ ] Desktop: Swipe disabled, click works

**Unread Badge:**
- [ ] Unread count shows in inbox badge
- [ ] Mark message read → badge count decreases
- [ ] Zero unread → no badge shown

**Material You:**
- [ ] Install PWA on Android 13+ with themed icons
- [ ] Icon adapts to system color palette

### Device Testing Matrix

| Device | Screen | Test Priority |
|--------|--------|---------------|
| iPhone SE | 375px | High (smallest common) |
| iPhone 14 | 390px | High |
| Pixel 7 | 412px | High (Android PWA) |
| iPad Mini | 768px | Medium (tablet) |
| iPad | 1024px | Medium |
| Desktop | 1440px+ | High (regression) |

## Out of Scope (Future)

- Bottom navigation bar (tabs at bottom like native apps)
- Pull-to-refresh gesture
- Adaptive layout differences between phone/tablet
- Push notifications for new mail
- Offline message queue
