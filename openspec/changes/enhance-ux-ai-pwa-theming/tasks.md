# Implementation Tasks

## 0. Bug Fix - Custom Tags Not Loaded (HIGH PRIORITY)

- [ ] 0.1 Update ConfigLoader to read AI config
  - Read `ai` section from config.yaml
  - Extract `tags`, `model`, `endpoint`, `temperature`
  - Return as separate dict alongside accounts
  - Log loaded AI configuration

- [ ] 0.2 Update sync.py to use AI config from file
  - Call ConfigLoader.load_config() to get ai section
  - Pass `custom_tags` to AIConfig
  - Pass `model`, `endpoint`, `temperature` from config
  - Fall back to defaults if not in config

- [ ] 0.3 Update API sync route similarly
  - Read AI config on startup or per-request
  - Pass custom_tags to AIConfig
  - Ensure consistency with CLI

- [ ] 0.4 Test custom tags flow end-to-end
  - Add custom tag in Nix config
  - Rebuild and verify in config.yaml
  - Run sync and verify custom tag in prompt
  - Verify classification uses custom tag

## 1. Theme Infrastructure

- [ ] 1.1 Create ThemeContext for global theme state
  - Create `web/src/contexts/ThemeContext.tsx`
  - Support three modes: light, dark, system
  - Read initial value from localStorage
  - Detect system preference via `window.matchMedia`
  - Listen for system preference changes
  - Export useTheme hook

- [ ] 1.2 Configure MUI dark theme palette
  - Update `web/src/main.tsx`
  - Define light and dark palettes
  - Set primary, secondary, background colors
  - Ensure proper contrast ratios
  - Wrap app in ThemeContext provider

- [ ] 1.3 Create ThemeToggle component
  - Create `web/src/components/ThemeToggle.tsx`
  - Sun icon for light, Moon icon for dark, Auto icon for system
  - IconButton with tooltip
  - Cycle through modes on click
  - Save preference to localStorage

- [ ] 1.4 Persist theme preference
  - Store mode in localStorage key `axios-theme`
  - Restore on app load
  - Apply `color-scheme` CSS property
  - Set `<meta name="theme-color">` dynamically

## 2. PWA Configuration

- [ ] 2.1 Create logo assets
  - Create/obtain `axios-ai-mail.png` (192x192)
  - Create/obtain `axios-ai-mail-512.png` (512x512)
  - Place in `web/public/`
  - Ensure transparent background for dark mode
  - Consider maskable icon variant

- [ ] 2.2 Create manifest.json
  - Create `web/public/manifest.json`
  - Set name: "Axios AI Mail"
  - Set short_name: "Mail"
  - Set start_url: "/"
  - Set display: "standalone"
  - Set theme_color and background_color
  - Add icons array with both sizes

- [ ] 2.3 Install and configure vite-plugin-pwa
  - Add `vite-plugin-pwa` to devDependencies
  - Update `web/vite.config.ts`
  - Configure workbox caching strategy
  - Generate service worker
  - Add registerSW option

- [ ] 2.4 Update index.html for PWA
  - Add `<link rel="manifest" href="/manifest.json">`
  - Add `<meta name="theme-color">`
  - Add apple-touch-icon link
  - Add mobile-web-app-capable meta tags

- [ ] 2.5 Register service worker
  - Import virtual:pwa-register in main.tsx
  - Register service worker on load
  - Handle update prompts (optional)
  - Log registration success/failure

## 3. Offline Awareness

- [ ] 3.1 Create useOnlineStatus hook
  - Create `web/src/hooks/useOnlineStatus.ts`
  - Use navigator.onLine initial value
  - Listen for 'online' and 'offline' events
  - Return boolean isOnline status
  - Clean up event listeners on unmount

- [ ] 3.2 Create OfflineIndicator component
  - Create `web/src/components/OfflineIndicator.tsx`
  - Show banner/chip when offline
  - Position at top of screen or in topbar
  - Use warning color and offline icon
  - Smooth transition on state change

- [ ] 3.3 Integrate offline indicator in Layout
  - Import useOnlineStatus hook
  - Conditionally render OfflineIndicator
  - Consider disabling action buttons when offline
  - Add aria-live for accessibility

## 4. Branding

- [ ] 4.1 Add logo to topbar
  - Import logo image in Layout/AppBar
  - Add img element with alt text
  - Position on left side of topbar
  - Link to home page (/)
  - Size appropriately (32-40px height)

- [ ] 4.2 Unify sidebar and topbar colors
  - Identify current color values
  - Update Sidebar background to match topbar
  - Use theme palette colors
  - Ensure consistency in both light/dark modes
  - Test visual appearance

- [ ] 4.3 Add brand styling touches
  - Consider subtle brand accent colors
  - Consistent border radius
  - Unified spacing in navigation
  - Professional typography

## 5. AI Classification Improvements

- [ ] 5.1 Add confidence extraction to classifier
  - Update `_build_prompt()` to request confidence
  - Parse confidence from LLM JSON response
  - Add confidence field to Classification dataclass
  - Default to 0.8 if not returned
  - Normalize confidence to 0.0-1.0 range

- [ ] 5.2 Update prompt for confidence score
  - Add confidence instruction to prompt
  - Request confidence as 0.0-1.0 float
  - Explain what high/low confidence means
  - Example: "confidence": 0.85

- [ ] 5.3 Update API response to include confidence
  - Add confidence field to Message response model
  - Store confidence in database (optional)
  - Return in GET /api/messages/{id}
  - Return in GET /api/messages list

- [ ] 5.4 Display confidence in UI
  - Add confidence indicator to MessageListItem
  - Add confidence badge to MessageDetailPage
  - Use colors: green (high), yellow (medium), red (low)
  - Add tooltip explaining confidence meaning

- [ ] 5.5 Document model recommendations
  - Update README with model guidance
  - Add to Nix module comments
  - Include hardware requirements
  - Provide benchmark comparisons
  - Example configurations

## 6. Custom Tags Configuration

- [ ] 6.1 Add custom tags to Nix module
  - Add `ai.customTags` option
  - List of { name, description } objects
  - Merge with default tags
  - Pass to config.yaml

- [ ] 6.2 Update ConfigLoader to read custom tags
  - Parse customTags from config
  - Pass to AIConfig
  - Override or extend default tags

- [ ] 6.3 Update AI classifier to use custom tags
  - Accept custom_tags in AIConfig
  - Build prompt with merged tags
  - Validate against custom tags

## 7. Integration & Polish

- [ ] 7.1 Add theme toggle to topbar
  - Position in topbar (right side, near user actions)
  - Style consistently with other icons
  - Add tooltip for accessibility
  - Test keyboard navigation

- [ ] 7.2 Ensure theme persistence across tabs
  - Use storage event listener
  - Sync theme between browser tabs
  - Test multi-tab behavior

- [ ] 7.3 PWA installability testing
  - Test Chrome "Install" prompt
  - Test Safari "Add to Home Screen"
  - Verify standalone mode
  - Test on mobile devices

- [ ] 7.4 Update existing components for dark mode
  - Review all pages for dark mode issues
  - Fix contrast issues
  - Update hardcoded colors to theme colors
  - Test all UI states

## 8. Testing

- [ ] 8.1 Write unit tests for ThemeContext
  - Test mode toggle
  - Test localStorage persistence
  - Test system preference detection
  - Test SSR compatibility

- [ ] 8.2 Write tests for useOnlineStatus hook
  - Mock navigator.onLine
  - Test event listener setup/cleanup
  - Test state changes

- [ ] 8.3 Write tests for confidence parsing
  - Test valid confidence values
  - Test missing confidence
  - Test out-of-range values
  - Test normalization

- [ ] 8.4 Manual testing checklist
  - [ ] Theme toggle cycles through modes
  - [ ] Theme persists after refresh
  - [ ] System preference is detected
  - [ ] Logo displays in topbar
  - [ ] Sidebar and topbar have same color
  - [ ] PWA installs on Chrome desktop
  - [ ] PWA installs on mobile
  - [ ] Offline indicator shows when disconnected
  - [ ] Confidence scores display correctly
  - [ ] Dark mode looks correct on all pages
  - [ ] phi3:mini model works correctly
  - [ ] mistral:7b model works correctly

## 9. Documentation

- [ ] 9.1 Update README with new features
  - Document theme toggle
  - Document PWA installation
  - Document model recommendations
  - Add screenshots

- [ ] 9.2 Update Nix module documentation
  - Document ai.model options
  - Document ai.customTags
  - Provide example configurations
  - Hardware recommendations

- [ ] 9.3 Run openspec validate --strict
  - Create spec deltas if needed
  - Verify scenarios cover requirements
  - Fix validation errors

## Dependency Order

```
0. Bug Fix - Custom Tags (0.1-0.4)
   └── HIGH PRIORITY - Should be done first
   └── No dependencies

1. Theme Infrastructure (1.1-1.4)
   └── No dependencies
   
2. PWA Configuration (2.1-2.5)
   └── Depends on logo assets (2.1)
   
3. Offline Awareness (3.1-3.3)
   └── No dependencies
   
4. Branding (4.1-4.3)
   └── Depends on logo assets (2.1)
   └── Depends on theme infrastructure (1.x)
   
5. AI Classification - Confidence (5.1-5.5)
   └── Depends on bug fix (0.x)
   
6. Custom Tags UI (6.1-6.3)
   └── Depends on bug fix (0.x)
   
7. Integration (7.1-7.4)
   └── Depends on all above
   
8. Testing (8.1-8.4)
   └── Depends on implementation
   
9. Documentation (9.1-9.3)
   └── Depends on all above
```

## Parallelizable Work

The following can be done in parallel:
- Bug Fix (0.x) should be done FIRST
- Then: Theme (1.x) || PWA (2.x) || Offline (3.x) || AI Confidence (5.x)
- Logo assets (2.1) must be done before branding (4.x)
- All testing can be parallelized after implementation
