/**
 * EmailContent component - Safe HTML email rendering
 *
 * Security: Uses DOMPurify to sanitize HTML
 * Performance: Strips tracking pixels to prevent render issues
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Box, Button, Alert, useTheme } from '@mui/material';
import { Image, ImageNotSupported, LightMode, ZoomOutMap } from '@mui/icons-material';

interface InlineAttachment {
  content_id: string;
  data_url: string;
}

interface EmailContentProps {
  /** Pre-sanitized HTML content */
  html: string;
  /** Whether to show remote images by default */
  allowRemoteImages?: boolean;
  /** Callback when remote images are loaded */
  onLoadRemoteImages?: () => void;
  /** Compact mode for reading pane - constrains width, linearizes tables */
  compact?: boolean;
  /** Inline attachments for resolving cid: URLs */
  inlineAttachments?: InlineAttachment[];
}

// Known tracking domains to strip completely
const TRACKING_DOMAINS = [
  'cc.rs6.net',           // Constant Contact
  'r20.rs6.net',          // Constant Contact
  'open.spotify.com/track', // Spotify tracking
  'mailchimp.com/track',  // Mailchimp
  't.co/',                // Twitter tracking
  'click.',               // Generic click tracking
  'track.',               // Generic tracking
  'pixel.',               // Pixel tracking
  'beacon.',              // Beacon tracking
  '/track',               // Path-based tracking
  '/pixel',               // Path-based pixel
  '/open',                // Open tracking
  'trk.klclick',          // Klaviyo
];

/**
 * Check if URL is a tracking pixel
 */
function isTrackingUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return TRACKING_DOMAINS.some(domain => lowerUrl.includes(domain));
}

/**
 * Replace cid: URLs (inline MIME attachments) with actual image data or placeholder
 * cid: URLs reference Content-ID headers in multipart MIME emails
 * and cannot be loaded directly by the browser
 */
function replaceCidUrls(html: string, inlineAttachments?: InlineAttachment[]): string {
  // Build a map of content_id -> data_url for quick lookup
  const cidMap = new Map<string, string>();
  if (inlineAttachments) {
    for (const att of inlineAttachments) {
      cidMap.set(att.content_id, att.data_url);
    }
  }

  return html.replace(
    /<img([^>]*?)src=["'](cid:([^"']+))["']([^>]*)>/gi,
    (_match, before, _fullCid, contentId, after) => {
      // Try to find the inline attachment by content_id
      const dataUrl = cidMap.get(contentId);
      if (dataUrl) {
        // Replace cid: with actual image data URL
        return `<img${before}src="${dataUrl}"${after}>`;
      }
      // Fallback: create a placeholder for unresolved embedded images
      return `<img${before}src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='60'%3E%3Crect fill='%23e0e0e0' width='100' height='60' rx='4'/%3E%3Ctext fill='%23666' x='50' y='35' text-anchor='middle' font-size='10'%3EEmbedded%3C/text%3E%3C/svg%3E" alt="Embedded image"${after}>`;
    }
  );
}

/**
 * Strip tracking pixels and tiny images from HTML
 */
function stripTrackingPixels(html: string): string {
  // Remove img tags with tracking URLs
  let cleaned = html.replace(
    /<img[^>]*src=["']([^"']+)["'][^>]*>/gi,
    (match, src) => {
      if (isTrackingUrl(src)) {
        return ''; // Remove tracking pixels entirely
      }
      // Check for 1x1 pixels by width/height attributes
      if (/width=["']?1["']?/i.test(match) && /height=["']?1["']?/i.test(match)) {
        return ''; // Remove 1x1 tracking pixels
      }
      return match;
    }
  );

  // Remove empty img tags that might have been left
  cleaned = cleaned.replace(/<img[^>]*src=["']['"][^>]*>/gi, '');

  return cleaned;
}

/**
 * Check if HTML contains remote images (excluding tracking pixels)
 */
function hasRemoteImages(html: string): boolean {
  const pattern = /<img[^>]+src=["']https?:\/\//i;
  if (!pattern.test(html)) return false;

  // Check if any non-tracking remote images exist
  const imgMatches = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi) || [];
  return imgMatches.some(img => {
    const srcMatch = img.match(/src=["'](https?:\/\/[^"']+)["']/i);
    if (!srcMatch) return false;
    return !isTrackingUrl(srcMatch[1]);
  });
}

/**
 * Block remote images by replacing src with placeholder
 */
function blockRemoteImages(html: string): string {
  return html.replace(
    /<img([^>]*?)src=["'](https?:\/\/[^"']+)["']/gi,
    (match, attrs, src) => {
      // Don't block if already a data URL or if it's been stripped
      if (src.startsWith('data:')) return match;
      return `<img${attrs}data-blocked-src="${src}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23555' width='100' height='100'/%3E%3Ctext fill='%23999' x='50' y='55' text-anchor='middle' font-size='12'%3EImage%3C/text%3E%3C/svg%3E"`;
    }
  );
}

export function EmailContent({
  html,
  allowRemoteImages = false,
  onLoadRemoteImages,
  compact = false,
  inlineAttachments,
}: EmailContentProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [showRemoteImages, setShowRemoteImages] = useState(allowRemoteImages);
  const [forceOriginal, setForceOriginal] = useState(false);

  // Overflow detection for compact mode scaling
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [isScaled, setIsScaled] = useState(false);
  const [forceFullSize, setForceFullSize] = useState(false);

  // Measure content and apply scaling if needed in compact mode
  useEffect(() => {
    if (!compact || !contentRef.current || !containerRef.current) {
      setScaleFactor(1);
      setIsScaled(false);
      return;
    }

    // Wait for content to render
    const timer = setTimeout(() => {
      if (!contentRef.current || !containerRef.current) return;

      const contentWidth = contentRef.current.scrollWidth;
      const containerWidth = containerRef.current.clientWidth;

      // Scale if content overflows by more than 10%
      if (contentWidth > containerWidth * 1.1) {
        // Scale down slightly more (0.95x) to ensure content fits with some margin
        const scale = Math.max(0.5, (containerWidth / contentWidth) * 0.95);
        setScaleFactor(scale);
        setIsScaled(true);
      } else {
        setScaleFactor(1);
        setIsScaled(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [compact, html, showRemoteImages]);

  // Process HTML: strip tracking, optionally block images
  const processedHtml = useMemo(() => {
    // First replace cid: URLs (inline MIME attachments) with actual data or placeholders
    // to prevent browser errors from unresolvable cid: scheme
    let cleaned = replaceCidUrls(html, inlineAttachments);

    // Then strip tracking pixels
    cleaned = stripTrackingPixels(cleaned);

    // Then optionally block remaining remote images
    if (!showRemoteImages && hasRemoteImages(cleaned)) {
      cleaned = blockRemoteImages(cleaned);
    }

    return cleaned;
  }, [html, showRemoteImages, inlineAttachments]);

  // Check if there are blockable remote images
  const hasRemote = useMemo(() => hasRemoteImages(html), [html]);

  const handleLoadImages = useCallback(() => {
    setShowRemoteImages(true);
    onLoadRemoteImages?.();
  }, [onLoadRemoteImages]);

  const applyDarkMode = isDark && !forceOriginal;

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') {
      e.preventDefault();
      const href = target.getAttribute('href');
      if (href && !href.startsWith('mailto:')) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else if (href?.startsWith('mailto:')) {
        window.location.href = href;
      }
    }
  }, []);

  return (
    <Box>
      {hasRemote && !showRemoteImages && (
        <Alert
          severity="info"
          icon={<ImageNotSupported />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleLoadImages}
              startIcon={<Image />}
            >
              Load Images
            </Button>
          }
          sx={{ mb: compact ? 1 : 2 }}
        >
          Remote images are hidden for privacy
        </Alert>
      )}

      {/* Dark mode toggle - full version for non-compact, icon for compact */}
      {isDark && !compact && (
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            startIcon={<LightMode />}
            onClick={() => setForceOriginal(!forceOriginal)}
            sx={{ textTransform: 'none', fontSize: '0.75rem', color: 'text.secondary' }}
          >
            {forceOriginal ? 'Dark mode off · Turn on' : 'Dark mode on · Show original'}
          </Button>
        </Box>
      )}

      {/* Compact mode control bar: scale indicator + dark mode toggle */}
      {compact && (isScaled || isDark) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          {/* Left: Scale indicator (if scaled) */}
          {isScaled ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
              <ZoomOutMap sx={{ fontSize: 14 }} />
              <span>{forceFullSize ? 'Full size' : `${Math.round(scaleFactor * 100)}%`}</span>
            </Box>
          ) : (
            <Box /> // Spacer
          )}

          {/* Right: Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Scale toggle */}
            {isScaled && (
              <Button
                size="small"
                onClick={() => setForceFullSize(!forceFullSize)}
                sx={{ textTransform: 'none', fontSize: '0.75rem', color: 'text.secondary', minWidth: 'auto', p: 0.5 }}
              >
                {forceFullSize ? 'Fit' : 'Full'}
              </Button>
            )}
            {/* Dark mode toggle (icon only in compact) */}
            {isDark && (
              <Button
                size="small"
                onClick={() => setForceOriginal(!forceOriginal)}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  color: forceOriginal ? 'warning.main' : 'text.secondary',
                  minWidth: 'auto',
                  p: 0.5
                }}
                title={forceOriginal ? 'Original colors · Click for dark mode' : 'Dark mode · Click for original'}
              >
                <LightMode sx={{ fontSize: 16 }} />
              </Button>
            )}
          </Box>
        </Box>
      )}

      <Box
        ref={containerRef}
        sx={{
          ...(isDark && {
            backgroundColor: applyDarkMode ? '#ffffff' : '#fafafa',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: applyDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.4)',
          }),
          // Compact mode: constrain width, allow scroll when viewing full size
          ...(compact && {
            maxWidth: '100%',
            overflow: forceFullSize ? 'auto' : 'hidden',
          }),
        }}
      >
        <Box
          ref={contentRef}
          className="email-content"
          dangerouslySetInnerHTML={{ __html: processedHtml }}
          onClick={handleClick}
          sx={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: compact ? '14px' : '15px',
            lineHeight: compact ? 1.5 : 1.6,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            padding: isDark ? (compact ? 2 : 3) : 0,
            // Smooth transition for scale changes
            transition: 'transform 0.2s ease-out, width 0.2s ease-out',
            // Apply scaling transform for overflowing content in compact mode (unless user wants full size)
            ...(compact && isScaled && !forceFullSize && {
              transform: `scale(${scaleFactor})`,
              transformOrigin: 'top left',
              // Add 5% buffer to prevent right-edge clipping from measurement variations
              width: `${(100 / scaleFactor) * 1.05}%`,
            }),
            ...(applyDarkMode && {
              filter: 'invert(1) hue-rotate(180deg)',
              '& img': { filter: 'invert(1) hue-rotate(180deg)' },
              '& video, & iframe': { filter: 'invert(1) hue-rotate(180deg)' },
            }),
            '& img': { maxWidth: '100%', height: 'auto', display: 'block' },
            '& a': {
              color: applyDarkMode ? '#1976d2' : theme.palette.primary.main,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            },
            '& pre, & code': {
              backgroundColor: '#f5f5f5',
              padding: theme.spacing(0.5, 1),
              borderRadius: theme.shape.borderRadius,
              fontFamily: 'monospace',
              fontSize: '0.9em',
              overflow: 'auto',
            },
            '& pre': { padding: theme.spacing(compact ? 1 : 2), whiteSpace: 'pre-wrap' },
            '& table': {
              borderCollapse: 'collapse',
              marginBottom: theme.spacing(compact ? 1 : 2),
              // Don't force table width - let scaling handle overflow instead
              // This preserves layout tables used in marketing emails
            },
            '& td, & th': {
              // Don't add borders - marketing emails use borderless tables for layout
              padding: theme.spacing(compact ? 0.5 : 1),
              textAlign: 'left',
              // Don't force word-break - can cause character-level wrapping in narrow cells
            },
            '& th': { fontWeight: 600 },
            '& blockquote': {
              margin: theme.spacing(compact ? 1 : 2, 0),
              padding: theme.spacing(1, compact ? 1 : 2),
              borderLeft: '4px solid #ddd',
              backgroundColor: '#f9f9f9',
            },
            '& ul, & ol': { paddingLeft: theme.spacing(compact ? 2 : 3), marginBottom: theme.spacing(compact ? 1 : 2) },
            '& li': { marginBottom: theme.spacing(0.5) },
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              marginTop: theme.spacing(compact ? 1 : 2),
              marginBottom: theme.spacing(compact ? 0.5 : 1),
              fontWeight: 600,
              lineHeight: 1.3,
              // Compact mode: smaller headings
              ...(compact && {
                fontSize: '1em',
              }),
            },
            '& p': { marginBottom: theme.spacing(compact ? 1 : 1.5) },
            '& hr': { border: 'none', borderTop: '1px solid #ddd', margin: theme.spacing(compact ? 1 : 2, 0) },
          }}
        />
      </Box>
    </Box>
  );
}
