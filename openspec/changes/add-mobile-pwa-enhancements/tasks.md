# Implementation Tasks

## 1. Responsive Layout Foundation (HIGHEST PRIORITY)

- [ ] 1.1 Create useIsMobile hook
  - Create `web/src/hooks/useIsMobile.ts`
  - Use MUI's `useMediaQuery` with `theme.breakpoints.down('md')`
  - Export `useIsMobile()`, `useIsTablet()`, `useIsDesktop()`
  - Mobile threshold: < 900px

- [ ] 1.2 Update Layout.tsx for responsive sidebar
  - Import useIsMobile hook
  - Change Drawer variant: `temporary` on mobile, `persistent` on desktop
  - Add `onClose` handler for temporary drawer (click scrim to close)
  - Adjust content area width based on drawer state and screen size
  - Full-width content on mobile when sidebar closed

- [ ] 1.3 Update Sidebar.tsx with onNavigate callback
  - Add `onNavigate?: () => void` prop
  - Call `onNavigate()` after each navigation action
  - Pass from Layout: `onNavigate={isMobile ? closeDrawer : undefined}`
  - Sidebar auto-closes after folder/menu selection on mobile

- [ ] 1.4 Update TopBar.tsx for mobile
  - Ensure hamburger menu visible on all screen sizes (for sidebar toggle)
  - Make search bar collapsible on mobile (icon expands to field)
  - Ensure all touch targets are minimum 44x44px
  - Hide/stack less critical actions on mobile

- [ ] 1.5 Update MessageCard.tsx with compact mode
  - Add `compact?: boolean` prop
  - When compact: reduce padding (16px → 12px)
  - When compact: hide checkbox (swipe for actions instead)
  - When compact: reduce snippet to 1 line
  - When compact: hide read/unread icon button (border indicates status)

- [ ] 1.6 Update Compose.tsx for mobile
  - Full-width form fields on mobile
  - Larger touch targets for buttons
  - Consider sticky send button at bottom
  - Ensure proper keyboard handling

- [ ] 1.7 Test responsive layout
  - Test at 375px (iPhone SE)
  - Test at 390px (iPhone 14)
  - Test at 768px (iPad)
  - Test at 1024px (iPad landscape)
  - Test at 1440px (desktop)
  - Test window resize transitions

## 2. Unread Count Badge

- [ ] 2.1 Add unread count API endpoint
  - Add `get_unread_count()` method to database.py
  - Create `/api/messages/unread-count` endpoint in messages.py
  - Return `{ count: number }`
  - Filter by folder='inbox' and is_unread=true

- [ ] 2.2 Create useUnreadCount hook
  - Create `web/src/hooks/useUnreadCount.ts`
  - Use React Query with 30-second refetch interval
  - Refetch on window focus
  - Export count value

- [ ] 2.3 Update Sidebar with unread badge
  - Import useUnreadCount hook
  - Update Inbox folder item with dynamic badge
  - Show badge only when count > 0
  - Show "99+" for counts > 99

- [ ] 2.4 Add optimistic updates for read/unread
  - When marking message read: decrement count
  - When marking message unread: increment count
  - When bulk deleting: decrement by unread count in selection
  - Update query cache optimistically in mutations

## 3. Material You Monochrome Icon

- [ ] 3.1 Create monochrome icon artwork
  - Design white silhouette of mail icon with AI indicator
  - Export at 192x192 PNG with transparent background
  - Export at 512x512 PNG with transparent background
  - Ensure icon fits in 66% safe zone
  - Save to `web/public/icon-monochrome-192.png`
  - Save to `web/public/icon-monochrome-512.png`

- [ ] 3.2 Create/verify maskable icon variants
  - Ensure 192x192 maskable icon exists with proper padding
  - Ensure 512x512 maskable icon exists with proper padding
  - Save to `web/public/icon-maskable-192.png` if missing
  - Save to `web/public/icon-maskable-512.png` if missing

- [ ] 3.3 Update PWA manifest configuration
  - Update `web/vite.config.ts` VitePWA manifest
  - Add monochrome icons with `purpose: "monochrome"`
  - Add maskable icons with `purpose: "maskable"`
  - Keep existing icons with `purpose: "any"`

- [ ] 3.4 Test Material You theming
  - Build production PWA (`npm run build`)
  - Install on Android 13+ device
  - Enable themed icons in Android settings
  - Verify icon adapts to wallpaper colors
  - Test with multiple wallpapers/themes

## 4. Touch Swipe Gestures

- [ ] 4.1 Install swipe gesture library
  - Run `npm install react-swipeable-list`
  - Verify TypeScript types are included
  - Import CSS: `react-swipeable-list/dist/styles.css`

- [ ] 4.2 Create SwipeableMessageCard component
  - Create `web/src/components/SwipeableMessageCard.tsx`
  - Import SwipeableListItem, LeadingActions, TrailingActions
  - Define leading action (reply - blue, Reply icon)
  - Define trailing action (delete - red, Delete icon)
  - Wrap MessageCard with `compact={true}`
  - Pass through onClick handler

- [ ] 4.3 Implement swipe action handlers
  - onSwipeLeft (delete):
    - Call bulkDelete mutation with [messageId]
    - Show toast "Moved to trash" with Undo action
    - Add haptic feedback: `navigator.vibrate(10)`
  - onSwipeRight (reply):
    - Navigate to `/compose?reply={messageId}`
    - Add haptic feedback

- [ ] 4.4 Update MessageList to use swipeable cards
  - Import useIsMobile hook
  - Import SwipeableList wrapper
  - On mobile: wrap messages in SwipeableList
  - On mobile: render SwipeableMessageCard
  - On desktop: render regular MessageCard (no change)
  - Pass delete/reply handlers to swipeable cards

- [ ] 4.5 Style swipe action backgrounds
  - Red gradient for delete action
  - Blue gradient for reply action
  - Center icons vertically
  - Ensure sufficient contrast

- [ ] 4.6 Handle edge cases
  - Disable swipe when messages are selected (checkbox mode)
  - Handle swipe while offline (show warning, prevent action)
  - Handle rapid swipes
  - Test swipe on first/last message

## 5. Reply via Swipe Integration

- [ ] 5.1 Verify Compose page handles reply parameter
  - Check if `?reply={messageId}` query param is supported
  - If not: fetch original message when reply param present
  - Pre-fill To field with original sender
  - Pre-fill Subject with "Re: {original subject}"
  - Quote original message in body

- [ ] 5.2 Test reply flow end-to-end
  - Swipe right on message
  - Verify navigates to compose
  - Verify reply context is pre-filled
  - Verify send works correctly

## 6. Toast Integration for Swipe Actions

- [ ] 6.1 Verify undo toast for delete swipe
  - Ensure toast shows "Moved to trash"
  - Ensure Undo action button works
  - Ensure undo calls restore mutation
  - Toast duration: 5 seconds

- [ ] 6.2 Handle swipe while offline
  - Check online status before delete
  - If offline: show warning toast
  - Prevent action or queue for later

## 7. Testing

- [ ] 7.1 Manual testing - Responsive layout
  - [ ] Mobile: Sidebar is overlay (temporary)
  - [ ] Mobile: Content is full-width
  - [ ] Mobile: Tap folder → sidebar closes
  - [ ] Mobile: Hamburger menu opens sidebar
  - [ ] Desktop: Sidebar is persistent (no change)
  - [ ] Resize window → smooth transition

- [ ] 7.2 Manual testing - Swipe gestures
  - [ ] Swipe left to delete works
  - [ ] Swipe right to reply works
  - [ ] Partial swipe cancels
  - [ ] Desktop: no swipe (click only)
  - [ ] Haptic feedback on threshold

- [ ] 7.3 Manual testing - Unread badge
  - [ ] Badge shows correct count
  - [ ] Mark read → count decreases
  - [ ] Mark unread → count increases
  - [ ] Zero unread → no badge

- [ ] 7.4 Manual testing - Material You icon
  - [ ] Install PWA on Android 13+
  - [ ] Enable themed icons
  - [ ] Icon uses system colors

- [ ] 7.5 Write unit tests
  - [ ] Test useIsMobile hook
  - [ ] Test useUnreadCount hook
  - [ ] Test swipe action handlers

## 8. Documentation

- [ ] 8.1 Update README with mobile features
  - Document responsive layout
  - Document swipe gestures
  - Document Material You support
  - Add mobile installation instructions

- [ ] 8.2 Run openspec validate
  - Validate spec deltas
  - Ensure all scenarios pass

## Dependency Order

```
1. Responsive Layout (1.x) ← FOUNDATION - DO FIRST
   └── No dependencies
   └── Everything else depends on this for mobile testing

2. Unread Badge (2.x)
   └── Depends on Sidebar being responsive (1.3)

3. Material You Icon (3.x)
   └── No dependencies (can parallelize)

4. Swipe Gestures (4.x)
   └── Depends on Responsive Layout (1.x)
   └── Depends on MessageCard compact mode (1.5)

5. Reply Integration (5.x)
   └── Depends on Swipe Gestures (4.x)

6. Toast Integration (6.x)
   └── Depends on Swipe Gestures (4.x)

7. Testing (7.x)
   └── Depends on all implementation

8. Documentation (8.x)
   └── Depends on implementation complete
```

## Parallelizable Work

After Responsive Layout (1.x) is complete:
- Unread Badge (2.x) || Material You Icon (3.x) || Swipe Gestures (4.x)

After Swipe Gestures (4.x):
- Reply Integration (5.x) || Toast Integration (6.x)

Finally:
- Testing (7.x)
- Documentation (8.x)

## Estimated Time

| Task Group | Estimate |
|------------|----------|
| Responsive Layout | 4-6 hours |
| Unread Badge | 1-2 hours |
| Material You Icon | 1-2 hours |
| Swipe Gestures | 3-4 hours |
| Reply Integration | 1 hour |
| Toast Integration | 30 min |
| Testing | 2-3 hours |
| Documentation | 30 min |
| **Total** | **14-20 hours** |
