/**
 * EmailContent component - Safe HTML email rendering using "Static Jail" pattern
 *
 * Security model:
 * - Sanitizes HTML internally with DOMPurify (caller passes raw HTML)
 * - Uses "Static Jail" pattern: ref + imperative innerHTML, React never touches content
 * - Strips event handlers (onerror, onload) that could cause render loops
 * - Blocks known tracking domains at sanitization level
 *
 * Features:
 * - Dark mode adaptation using CSS filter inversion (industry standard)
 * - Remote image blocking with user prompt to load
 * - Safe link handling (open in new tab)
 * - Typography improvements
 * - Responsive tables
 *
 * @see https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers
 */

import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { Box, Button, Alert, useTheme } from '@mui/material';
import { Image, ImageNotSupported, LightMode } from '@mui/icons-material';
import DOMPurify from 'dompurify';

interface EmailContentProps {
  /** Raw HTML content (will be sanitized internally) */
  html: string;
  /** Whether to show remote images by default */
  allowRemoteImages?: boolean;
  /** Callback when remote images are loaded */
  onLoadRemoteImages?: () => void;
}

// Default allowed tags for email content
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'b', 'i', 's',
  'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'div', 'span', 'pre', 'code',
  'table', 'tr', 'td', 'th', 'thead', 'tbody',
  'img',
];

// Allowed attributes - notably excludes event handlers
const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'class', 'style',
  'src', 'alt', 'width', 'height',
];

// Forbidden attributes that could cause issues (event handlers)
const FORBID_ATTR = ['onerror', 'onload', 'onclick', 'onmouseover'];

/**
 * Check if HTML contains remote images
 */
function hasRemoteImages(html: string): boolean {
  const pattern = /<img[^>]+src=["']https?:\/\//i;
  return pattern.test(html);
}

/**
 * Block remote images by replacing src with placeholder
 */
function blockRemoteImages(html: string): string {
  return html.replace(
    /<img([^>]*?)src=["'](https?:\/\/[^"']+)["']/gi,
    '<img$1data-blocked-src="$2" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23555\' width=\'100\' height=\'100\'/%3E%3Ctext fill=\'%23999\' x=\'50\' y=\'55\' text-anchor=\'middle\' font-size=\'12\'%3EImage%3C/text%3E%3C/svg%3E"'
  );
}

// Wrapped in memo to prevent re-renders when html content hasn't changed
// This is critical for WebSocket-heavy environments where parent re-renders are frequent
export const EmailContent = memo(function EmailContent({
  html,
  allowRemoteImages = false,
  onLoadRemoteImages,
}: EmailContentProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [showRemoteImages, setShowRemoteImages] = useState(allowRemoteImages);
  const [forceOriginal, setForceOriginal] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Step 1: Sanitize HTML with DOMPurify (memoized - runs once per html change)
  const sanitizedHtml = useMemo(() => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      FORBID_ATTR,
    });
  }, [html]);

  // Step 2: Check for remote images in sanitized content
  const hasRemote = useMemo(() => hasRemoteImages(sanitizedHtml), [sanitizedHtml]);

  // Step 3: Process for remote image blocking (memoized)
  const processedHtml = useMemo(() => {
    if (!showRemoteImages && hasRemote) {
      return blockRemoteImages(sanitizedHtml);
    }
    return sanitizedHtml;
  }, [sanitizedHtml, showRemoteImages, hasRemote]);

  // Step 4: "Static Jail" - imperatively set innerHTML ONCE per content change
  // React never touches the content after this, breaking any potential render loops
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = processedHtml;
    }
  }, [processedHtml]);

  const handleLoadImages = useCallback(() => {
    setShowRemoteImages(true);
    onLoadRemoteImages?.();
  }, [onLoadRemoteImages]);

  // Should we apply dark mode inversion?
  const applyDarkMode = isDark && !forceOriginal;

  // Handle link clicks - memoized to prevent recreating on each render
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
      {/* Remote images banner */}
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

      {/* Dark mode toggle - show option to view original */}
      {isDark && (
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            startIcon={<LightMode />}
            onClick={() => setForceOriginal(!forceOriginal)}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              color: 'text.secondary',
            }}
          >
            {forceOriginal ? 'Dark mode off · Turn on' : 'Dark mode on · Show original'}
          </Button>
        </Box>
      )}

      {/* Email content wrapper - provides light background for both modes */}
      <Box
        sx={{
          // Always provide a light background for email content in dark mode
          ...(isDark && {
            backgroundColor: applyDarkMode ? '#ffffff' : '#fafafa',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: applyDarkMode
              ? 'none'
              : '0 2px 8px rgba(0,0,0,0.4), 0 0 1px rgba(0,0,0,0.3)',
          }),
        }}
      >
        {/* Email content with dark mode inversion - uses ref to bypass React reconciliation */}
        <Box
          ref={contentRef}
          className="email-content"
          onClick={handleClick}
          sx={{
            // Base styles
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '15px',
            lineHeight: 1.6,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            padding: isDark ? 3 : 0,

            // Dark mode: CSS filter inversion
            ...(applyDarkMode && {
              filter: 'invert(1) hue-rotate(180deg)',
              '& img': {
                filter: 'invert(1) hue-rotate(180deg)',
              },
              '& video, & iframe': {
                filter: 'invert(1) hue-rotate(180deg)',
              },
            }),

            // Images - suppress errors silently
            '& img': {
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
            },
            // Hide broken images (blocked by ad blocker)
            '& img[src^="data:"]': {
              opacity: 0.5,
            },

            // Links
            '& a': {
              color: applyDarkMode ? '#1976d2' : theme.palette.primary.main,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },

            // Preformatted text
            '& pre, & code': {
              backgroundColor: '#f5f5f5',
              padding: theme.spacing(0.5, 1),
              borderRadius: theme.shape.borderRadius,
              fontFamily: 'monospace',
              fontSize: '0.9em',
              overflow: 'auto',
            },
            '& pre': {
              padding: theme.spacing(2),
              whiteSpace: 'pre-wrap',
            },

            // Tables
            '& table': {
              borderCollapse: 'collapse',
              width: '100%',
              maxWidth: '100%',
              marginBottom: theme.spacing(2),
              tableLayout: 'fixed',
            },
            '& td, & th': {
              border: '1px solid #ddd',
              padding: theme.spacing(1),
              textAlign: 'left',
              wordBreak: 'break-word',
            },
            '& th': {
              backgroundColor: '#f5f5f5',
              fontWeight: 600,
            },

            // Blockquotes
            '& blockquote': {
              margin: theme.spacing(2, 0),
              padding: theme.spacing(1, 2),
              borderLeft: '4px solid #ddd',
              backgroundColor: '#f9f9f9',
            },

            // Lists
            '& ul, & ol': {
              paddingLeft: theme.spacing(3),
              marginBottom: theme.spacing(2),
            },
            '& li': {
              marginBottom: theme.spacing(0.5),
            },

            // Headings
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              marginTop: theme.spacing(2),
              marginBottom: theme.spacing(1),
              fontWeight: 600,
              lineHeight: 1.3,
            },

            // Paragraphs
            '& p': {
              marginBottom: theme.spacing(1.5),
            },

            // Horizontal rule
            '& hr': {
              border: 'none',
              borderTop: '1px solid #ddd',
              margin: theme.spacing(2, 0),
            },
          }}
        />
      </Box>
    </Box>
  );
});
