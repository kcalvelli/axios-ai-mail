# Design: Mobile PWA Enhancements

## Overview

This document details the technical architecture for implementing mobile-friendly PWA features: responsive layout, touch swipe gestures, unread count badge, and Material You dynamic theming.

## Architecture Decisions

### 1. Responsive Breakpoint Strategy

**Using MUI's Default Breakpoints:**
```typescript
// MUI default breakpoints
const breakpoints = {
  xs: 0,      // Extra small (phones)
  sm: 600,    // Small (tablets portrait)
  md: 900,    // Medium (tablets landscape)
  lg: 1200,   // Large (desktops)
  xl: 1536,   // Extra large (large desktops)
};
```

**Our Mobile Strategy:**
- **Mobile**: `< md` (< 900px) - Phones and tablets in portrait
- **Desktop**: `>= md` (>= 900px) - Tablets landscape and desktops

**Rationale:**
- Phones are typically 320-480px wide
- Tablets portrait are typically 600-800px wide
- At 900px, there's enough room for sidebar + content
- Matches MUI's built-in `useMediaQuery` patterns

### 2. Layout Architecture

**Current Layout (Desktop-Only):**
```
┌──────────────────────────────────────────────────┐
│ TopBar                                           │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│ Sidebar  │                                       │
│ 280px    │         Content Area                  │
│ (push)   │         (flex-grow)                   │
│          │                                       │
│          │                                       │
└──────────┴───────────────────────────────────────┘
```

**New Layout (Responsive):**

**Desktop (>=900px):**
```
┌──────────────────────────────────────────────────┐
│ TopBar                                           │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│ Sidebar  │                                       │
│ 280px    │         Content Area                  │
│ (persist)│         (100% - 280px)                │
│          │                                       │
└──────────┴───────────────────────────────────────┘
```

**Mobile (<900px) - Sidebar Closed:**
```
┌──────────────────────────────────────────────────┐
│ [☰] TopBar                                       │
├──────────────────────────────────────────────────┤
│                                                  │
│              Content Area                        │
│              (100% width)                        │
│                                                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Mobile (<900px) - Sidebar Open:**
```
┌──────────────────────────────────────────────────┐
│ [☰] TopBar                                       │
├────────────┬─────────────────────────────────────┤
│            │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│  Sidebar   │░░░░░░ Scrim (dismissible) ░░░░░░░░│
│  280px     │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│  (overlay) │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│            │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└────────────┴─────────────────────────────────────┘
```

### 3. useIsMobile Hook

**Implementation:**
```typescript
// web/src/hooks/useIsMobile.ts
import { useMediaQuery, useTheme } from '@mui/material';

export function useIsMobile() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
}

export function useIsTablet() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.between('sm', 'md'));
}

export function useIsDesktop() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up('md'));
}
```

**Usage:**
```typescript
function Layout() {
  const isMobile = useIsMobile();

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={drawerOpen}
      onClose={isMobile ? () => setDrawerOpen(false) : undefined}
    >
      <Sidebar onNavigate={isMobile ? () => setDrawerOpen(false) : undefined} />
    </Drawer>
  );
}
```

### 4. Sidebar Auto-Close Behavior

**Flow:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Sidebar    │────►│  User taps  │────►│  Sidebar    │
│  Open       │     │  "Inbox"    │     │  Closes     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Navigate   │
                    │  to inbox   │
                    └─────────────┘
```

**Implementation:**
```typescript
// Sidebar.tsx
interface SidebarProps {
  open: boolean;
  onNavigate?: () => void; // Called when navigation item clicked
}

function Sidebar({ open, onNavigate }: SidebarProps) {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    onNavigate?.(); // Close sidebar on mobile
  };

  return (
    <ListItemButton onClick={() => handleNavigation('/inbox')}>
      Inbox
    </ListItemButton>
  );
}
```

### 5. Swipe Gesture Library Selection

**Chosen: `react-swipeable-list`**

| Library | Bundle Size | MUI Compatible | Maintenance |
|---------|-------------|----------------|-------------|
| `react-swipeable-list` | ~15KB | Yes | Active |
| `@use-gesture/react` | ~30KB | Yes | Active |
| `react-swipeable` | ~10KB | Yes | Active |

**Rationale:**
- Purpose-built for swipeable list items
- Handles iOS/Android differences automatically
- Built-in leading/trailing actions

### 6. SwipeableMessageCard Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ SwipeableListItem                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Leading Actions (Reply)                                 │ │
│ │ ┌─────────────┐                                         │ │
│ │ │   Reply     │◄─── Blue background, revealed on swipe  │ │
│ │ │   Icon      │     right                               │ │
│ │ └─────────────┘                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ MessageCard (existing component)                        │ │
│ │ - Compact variant on mobile (less padding, no checkbox) │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Trailing Actions (Delete)                               │ │
│ │                                         ┌─────────────┐ │ │
│ │               Red background ──────────►│   Trash     │ │ │
│ │               revealed on swipe left    │   Icon      │ │ │
│ │                                         └─────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Component Structure:**
```typescript
// web/src/components/SwipeableMessageCard.tsx
import {
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
  LeadingActions,
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';

interface SwipeableMessageCardProps {
  message: Message;
  onClick?: () => void;
  onDelete?: () => void;
  onReply?: () => void;
}

export function SwipeableMessageCard({
  message,
  onClick,
  onDelete,
  onReply,
}: SwipeableMessageCardProps) {
  const leadingActions = () => (
    <LeadingActions>
      <SwipeAction onClick={onReply}>
        <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
          <Reply />
        </Box>
      </SwipeAction>
    </LeadingActions>
  );

  const trailingActions = () => (
    <TrailingActions>
      <SwipeAction destructive onClick={onDelete}>
        <Box sx={{ bgcolor: 'error.main', color: 'white', p: 2 }}>
          <Delete />
        </Box>
      </SwipeAction>
    </TrailingActions>
  );

  return (
    <SwipeableListItem
      leadingActions={leadingActions()}
      trailingActions={trailingActions()}
    >
      <MessageCard message={message} onClick={onClick} compact />
    </SwipeableListItem>
  );
}
```

### 7. MessageCard Compact Mode

**Regular vs Compact:**

| Property | Regular (Desktop) | Compact (Mobile) |
|----------|-------------------|------------------|
| Checkbox | Visible | Hidden |
| Padding | 16px | 12px |
| Subject lines | 1 | 1 |
| Snippet lines | 2 | 1 |
| Tags | Horizontal | Horizontal (truncate) |
| Read/Unread icon | Visible | Hidden (border only) |

**Implementation:**
```typescript
interface MessageCardProps {
  message: Message;
  onClick?: () => void;
  compact?: boolean; // New prop for mobile mode
}

export function MessageCard({ message, onClick, compact = false }: MessageCardProps) {
  return (
    <Card sx={{ p: compact ? 1.5 : 2 }}>
      {!compact && <Checkbox ... />}

      <Typography
        sx={{
          WebkitLineClamp: compact ? 1 : 2,
          ...
        }}
      >
        {message.snippet}
      </Typography>

      {!compact && <IconButton ... />}
    </Card>
  );
}
```

### 8. Unread Count Architecture

**Data Flow:**
```
┌────────────────┐     ┌─────────────┐     ┌──────────────┐
│   API Server   │────►│ useUnread   │────►│   Sidebar    │
│/unread-count   │     │   Count     │     │    Badge     │
└────────────────┘     └─────────────┘     └──────────────┘
        ▲                     │
        │                     │ Optimistic
        │                     │ Update
        │                     ▼
        │              ┌─────────────┐
        └──────────────│  markRead   │
                       │  mutation   │
                       └─────────────┘
```

**API Endpoint:**
```python
@router.get("/messages/unread-count")
async def get_unread_count(request: Request):
    """Get count of unread messages in inbox."""
    db = request.app.state.db
    count = db.get_unread_count(folder="inbox")
    return {"count": count}
```

**Hook:**
```typescript
// web/src/hooks/useUnreadCount.ts
export function useUnreadCount() {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const response = await axios.get('/api/messages/unread-count');
      return response.data.count as number;
    },
    refetchInterval: 30000, // 30 seconds
    staleTime: 10000, // 10 seconds
  });
}
```

### 9. Material You Monochrome Icon

**Icon Design Guidelines:**
- Single color (white #FFFFFF)
- Transparent background
- Simple silhouette of mail envelope
- Must fit in 66% safe zone for adaptive icons

**Asset Creation:**
```
icon-monochrome-192.png (192x192)
icon-monochrome-512.png (512x512)
├── White silhouette
├── Transparent background
└── Envelope + sparkle/AI indicator
```

**Manifest Configuration:**
```typescript
// vite.config.ts
VitePWA({
  manifest: {
    icons: [
      // Any purpose (default)
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Maskable (adaptive icon shapes)
      { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      // Monochrome (Material You theming)
      { src: 'icon-monochrome-192.png', sizes: '192x192', type: 'image/png', purpose: 'monochrome' },
      { src: 'icon-monochrome-512.png', sizes: '512x512', type: 'image/png', purpose: 'monochrome' },
    ],
  },
})
```

## Component Hierarchy Changes

**Before:**
```
App
└── Layout
    ├── TopBar
    ├── Sidebar (persistent drawer)
    └── Content
        └── MessageList
            └── MessageCard[]
```

**After:**
```
App
└── Layout
    ├── TopBar (responsive)
    ├── Sidebar (responsive: temporary on mobile, persistent on desktop)
    │   └── onNavigate callback for auto-close
    └── Content (full-width on mobile)
        └── MessageList
            └── SwipeableMessageCard[] (on mobile)
            └── MessageCard[] (on desktop)
```

## State Management Changes

**New Store State:**
```typescript
interface AppState {
  // Existing
  drawerOpen: boolean;

  // Responsive behavior will modify how drawerOpen works
  // - On mobile: drawer is temporary, closes on navigation
  // - On desktop: drawer is persistent, toggle controls visibility
}
```

## CSS-in-JS Patterns

**Responsive Styling with MUI:**
```typescript
// Using sx prop with breakpoints
<Box
  sx={{
    // Mobile first
    p: 1,
    // Tablet and up
    [theme.breakpoints.up('sm')]: {
      p: 2,
    },
    // Desktop and up
    [theme.breakpoints.up('md')]: {
      p: 3,
    },
  }}
/>

// Or using responsive object syntax
<Box sx={{ p: { xs: 1, sm: 2, md: 3 } }} />
```

## Touch Event Handling

**Swipe Threshold:**
```
0%  ────────────────────────────────── 100%
│         │           │               │
│  Idle   │  Reveal   │   Threshold   │  Full
│         │  Action   │   (Commit)    │  Swipe
│         │           │               │
0%       10%         40%            100%
```

**Haptic Feedback:**
```typescript
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};
```

## Testing Approach

**DevTools Device Emulation:**
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select various devices or enter custom dimensions
4. Test touch events with "touch" mode

**Physical Device Testing:**
- Use `npm run dev -- --host` to expose dev server
- Access from phone on same network
- Or deploy to staging environment
