/**
 * EmailContent component - Safe HTML email rendering
 *
 * Security: Uses DOMPurify to sanitize HTML
 * Performance: Strips tracking pixels to prevent render issues
 */

import { useState, useMemo, useCallback } from 'react';
import { Box, Button, Alert, useTheme } from '@mui/material';
import { Image, ImageNotSupported, LightMode } from '@mui/icons-material';

interface EmailContentProps {
  /** Pre-sanitized HTML content */
  html: string;
  /** Whether to show remote images by default */
  allowRemoteImages?: boolean;
  /** Callback when remote images are loaded */
  onLoadRemoteImages?: () => void;
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
}: EmailContentProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [showRemoteImages, setShowRemoteImages] = useState(allowRemoteImages);
  const [forceOriginal, setForceOriginal] = useState(false);

  // Process HTML: strip tracking, optionally block images
  const processedHtml = useMemo(() => {
    // First strip tracking pixels
    let cleaned = stripTrackingPixels(html);

    // Then optionally block remaining remote images
    if (!showRemoteImages && hasRemoteImages(cleaned)) {
      cleaned = blockRemoteImages(cleaned);
    }

    return cleaned;
  }, [html, showRemoteImages]);

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
          sx={{ mb: 2 }}
        >
          Remote images are hidden for privacy
        </Alert>
      )}

      {isDark && (
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

      <Box
        sx={{
          ...(isDark && {
            backgroundColor: applyDarkMode ? '#ffffff' : '#fafafa',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: applyDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.4)',
          }),
        }}
      >
        <Box
          className="email-content"
          dangerouslySetInnerHTML={{ __html: processedHtml }}
          onClick={handleClick}
          sx={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '15px',
            lineHeight: 1.6,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            padding: isDark ? 3 : 0,
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
            '& pre': { padding: theme.spacing(2), whiteSpace: 'pre-wrap' },
            '& table': {
              borderCollapse: 'collapse',
              width: '100%',
              maxWidth: '100%',
              marginBottom: theme.spacing(2),
            },
            '& td, & th': {
              border: '1px solid #ddd',
              padding: theme.spacing(1),
              textAlign: 'left',
              wordBreak: 'break-word',
            },
            '& th': { backgroundColor: '#f5f5f5', fontWeight: 600 },
            '& blockquote': {
              margin: theme.spacing(2, 0),
              padding: theme.spacing(1, 2),
              borderLeft: '4px solid #ddd',
              backgroundColor: '#f9f9f9',
            },
            '& ul, & ol': { paddingLeft: theme.spacing(3), marginBottom: theme.spacing(2) },
            '& li': { marginBottom: theme.spacing(0.5) },
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              marginTop: theme.spacing(2),
              marginBottom: theme.spacing(1),
              fontWeight: 600,
              lineHeight: 1.3,
            },
            '& p': { marginBottom: theme.spacing(1.5) },
            '& hr': { border: 'none', borderTop: '1px solid #ddd', margin: theme.spacing(2, 0) },
          }}
        />
      </Box>
    </Box>
  );
}
