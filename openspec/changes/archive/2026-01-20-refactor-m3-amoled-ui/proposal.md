# Change: Refactor UI to Material Design 3 AMOLED Specification

## Why

The current web UI has several Material Design 3 compliance issues that affect visual hierarchy, AMOLED power efficiency, and overall user experience:

1. **Navigation Drawer lacks containment** - Sidebar appears as floating text without proper surface color distinction
2. **Email cards use borders instead of tonal surfaces** - M3 for AMOLED relies on tonal containment, not borders
3. **Missing active state indicators** - Selected sidebar items lack the M3 Active Indicator Pill
4. **Content layout shifts** - When sidebar toggles, content margin shifts awkwardly
5. **CSS/HTML leaking into snippets** - Email previews show raw CSS code instead of sanitized text
6. **Compose button placement** - Should be an Extended FAB per M3 guidelines

## What Changes

### Surface & Color System
- Set main content background to absolute black (`#000000`)
- Set navigation drawer background to Surface Container Low (`#121212`)
- Set email card backgrounds to Surface Container (`#1E1E1E`)

### Navigation Drawer
- Implement M3 Active Indicator Pill for selected items (Secondary Container color)
- Fixed drawer width of 256dp when open
- Consistent 24dp content margin regardless of sidebar state

### Email List
- Remove borders from email cards
- Use 12px rounded corners and 16px internal padding
- Absolute black (`#000000`) between cards for true AMOLED blacks

### Typography & Hierarchy
- Map Sender to Title Medium (Weight 500)
- Map Snippet to Body Small (Weight 400) with On-Surface Variant (`#CAC4D0`)
- Increase top padding below app bar to 24dp

### Components
- Transform Compose button into M3 Extended FAB with Primary Container color
- Position FAB at top of sidebar or floating bottom-right
- App bar background to absolute black

### Bug Fix
- **CRITICAL**: Sanitize email snippets to strip HTML/CSS tags (currently showing raw CSS)

## Impact

- Affected specs: `web-ui` (new capability spec)
- Affected code:
  - `web/src/components/Sidebar.tsx` - Drawer styling, active indicators
  - `web/src/components/MessageList.tsx` - Card styling, snippet sanitization
  - `web/src/components/Layout.tsx` - Content margins, drawer behavior
  - `web/src/components/TopBar.tsx` - FAB placement, app bar colors
  - `web/src/contexts/ThemeContext.tsx` - Color palette updates

## Notes on Feedback

The UX evaluation is largely correct. One clarification:
- The current drawer width is 220px (not causing the "gap" - that was a different issue we just fixed with the NixOS module refactor). The visual issues are primarily about color/surface hierarchy, not dimensions.
