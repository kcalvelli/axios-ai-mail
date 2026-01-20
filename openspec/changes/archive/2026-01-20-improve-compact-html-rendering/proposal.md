# Change: Improve Email HTML Rendering

## Why

Email HTML rendering has several challenges that affect all views:

1. **Inline images broken** - `cid:` URLs referencing MIME inline attachments cause browser errors and don't display.

2. **Tracking pixels** - Hidden 1x1 images and tracking beacons can cause performance issues.

3. **Security concerns** - Remote images can leak privacy; need controlled loading.

Additionally, in the reading pane (compact/split view), HTML emails often render poorly:

1. **Wide layouts overflow** - Marketing emails with fixed-width tables (600-800px) don't fit in the narrow reading pane, causing horizontal scrolling or content cutoff.

2. **No responsive trigger** - Many emails have responsive CSS with media queries, but our rendering doesn't constrain width to trigger mobile styles.

3. **Wasted space** - Complex layouts designed for full-width viewing waste vertical space in compact mode, requiring excessive scrolling.

4. **Inconsistent experience** - The same email looks great in full-page view but broken in split view.

## What Changes

### General HTML Rendering (All Views)

#### Inline Image (cid:) Handling

Replace `cid:` URLs with placeholders to prevent browser errors:

```tsx
function replaceCidUrls(html: string): string {
  return html.replace(
    /<img([^>]*?)src=["'](cid:[^"']+)["']([^>]*)>/gi,
    (_match, before, _cid, after) => {
      return `<img${before}src="data:image/svg+xml,..." alt="Embedded image"${after}>`;
    }
  );
}
```

Future enhancement: Resolve `cid:` to actual image data URLs via API.

#### Tracking Pixel Removal

Strip known tracking domains and 1x1 pixel images to improve performance and privacy.

#### Remote Image Blocking

Block remote images by default with option to load, preventing privacy leaks.

### Compact Mode Specific

#### 1. Viewport-Constrained Container

Wrap email HTML in a container that simulates a narrow viewport:

```tsx
<Box
  sx={{
    maxWidth: compact ? 400 : '100%',
    overflow: 'hidden',
    // Trigger responsive media queries
    containerType: 'inline-size',
  }}
>
  <EmailContent html={html} compact={compact} />
</Box>
```

### 2. CSS Transform Scaling (Fallback)

For non-responsive emails with fixed-width tables, scale content to fit:

```tsx
// Detect if content overflows
const contentRef = useRef<HTMLDivElement>(null);
const [needsScaling, setNeedsScaling] = useState(false);

useEffect(() => {
  if (contentRef.current && compact) {
    const contentWidth = contentRef.current.scrollWidth;
    const containerWidth = contentRef.current.clientWidth;
    setNeedsScaling(contentWidth > containerWidth * 1.1);
  }
}, [html, compact]);

// Apply scaling
sx={{
  ...(needsScaling && {
    transform: `scale(${containerWidth / contentWidth})`,
    transformOrigin: 'top left',
  }),
}}
```

### 3. Plain Text Preference Option

Add user preference to show plain text in compact mode:

```tsx
// In settings or per-email toggle
const [preferPlainText, setPreferPlainText] = useState(false);

// Render logic
{compact && preferPlainText && body_text ? (
  <QuotedText text={body_text} />
) : (
  <EmailContent html={html} compact={compact} />
)}
```

### 4. Compact-Specific Styling

Add compact mode prop to EmailContent with optimized styles:

```tsx
interface EmailContentProps {
  html: string;
  compact?: boolean;  // NEW
  // ...
}

// In styles
sx={{
  fontSize: compact ? '14px' : '15px',
  '& table': {
    ...(compact && {
      display: 'block',
      width: '100% !important',
      maxWidth: '100% !important',
    }),
  },
  '& td, & th': {
    ...(compact && {
      display: 'block',
      width: '100% !important',
    }),
  },
}}
```

## Impact

- **Affected files:**
  - `web/src/components/EmailContent.tsx` - Add compact prop and responsive handling
  - `web/src/components/MessageDetail.tsx` - Pass compact prop to EmailContent
  - `web/src/components/ReadingPane.tsx` - Pass compact context
  - `web/src/store/appStore.ts` - Add preferPlainTextInCompact setting (optional)

- **No backend changes required**

- **No database changes**

## Benefits

1. **Better split view** - Emails fit naturally in reading pane
2. **Responsive triggers** - Modern emails show their mobile layouts
3. **User choice** - Option to prefer plain text for fast reading
4. **Consistent UX** - Predictable rendering across view modes

## Trade-offs

1. **Scaled content** - Some emails may appear smaller when scaled
2. **Layout changes** - Responsive emails may look different from original
3. **Complexity** - More rendering logic to maintain

## Related

- See `async-provider-sync` for backend async operations (separate concern)
