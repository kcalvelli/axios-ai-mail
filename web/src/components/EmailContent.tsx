/**
 * EmailContent component - Enhanced HTML email rendering
 *
 * Features:
 * - Dark mode adaptation using CSS filter inversion (industry standard)
 * - Remote image blocking with prompt
 * - Safe link handling (open in new tab)
 * - Typography improvements
 * - Responsive tables
 *
 * Dark mode approach:
 * - Uses filter: invert(1) hue-rotate(180deg) to invert colors while preserving hues
 * - Images are inverted back to display correctly
 * - This matches how Gmail, Outlook, and other major clients handle dark mode
 *
 * @see https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers
 */

import { useState, useEffect, useMemo } from 'react';
import { Box, Button, Alert, useTheme } from '@mui/material';
import { Image, ImageNotSupported, LightMode } from '@mui/icons-material';

interface EmailContentProps {
  /** Sanitized HTML content */
  html: string;
  /** Whether to show remote images by default */
  allowRemoteImages?: boolean;
  /** Callback when remote images are loaded */
  onLoadRemoteImages?: () => void;
}

// Remote image patterns to detect
const REMOTE_SRC_PATTERN = /<img[^>]+src=["']https?:\/\//gi;

/**
 * Check if HTML contains remote images
 */
function hasRemoteImages(html: string): boolean {
  return REMOTE_SRC_PATTERN.test(html);
}

/**
 * Block remote images by replacing src with data attribute
 */
function blockRemoteImages(html: string): string {
  return html.replace(
    /<img([^>]*?)src=["'](https?:\/\/[^"']+)["']/gi,
    '<img$1data-blocked-src="$2" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23555\' width=\'100\' height=\'100\'/%3E%3Ctext fill=\'%23999\' x=\'50\' y=\'55\' text-anchor=\'middle\' font-size=\'12\'%3EImage%3C/text%3E%3C/svg%3E"'
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
  const [hasRemote, setHasRemote] = useState(false);
  const [forceOriginal, setForceOriginal] = useState(false);

  // Check for remote images
  useEffect(() => {
    setHasRemote(hasRemoteImages(html));
  }, [html]);

  // Process HTML
  const processedHtml = useMemo(() => {
    let processed = html;

    // Block remote images if not allowed
    if (!showRemoteImages && hasRemote) {
      processed = blockRemoteImages(processed);
    }

    return processed;
  }, [html, showRemoteImages, hasRemote]);

  const handleLoadImages = () => {
    setShowRemoteImages(true);
    onLoadRemoteImages?.();
  };

  // Should we apply dark mode inversion?
  const applyDarkMode = isDark && !forceOriginal;

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
          // - When inversion is ON: white bg inverts to dark
          // - When inversion is OFF (original): white bg shows original email colors properly
          ...(isDark && {
            backgroundColor: '#ffffff',
            borderRadius: 1,
            overflow: 'hidden',
            // When showing original (no inversion), add subtle border to show it's contained
            ...(!applyDarkMode && {
              border: '1px solid rgba(255,255,255,0.1)',
            }),
          }),
        }}
      >
        {/* Email content with dark mode inversion */}
        <Box
          className="email-content"
          sx={{
            // Base styles
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '15px',
            lineHeight: 1.6,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            // Padding when in dark mode (either inverted or original)
            padding: isDark ? 2 : 0,

            // Dark mode: CSS filter inversion (industry standard approach)
            // This inverts all colors, then hue-rotate restores original hues
            // Result: white becomes dark, black becomes light, colors stay similar
            ...(applyDarkMode && {
              filter: 'invert(1) hue-rotate(180deg)',
              // Invert images back so they display correctly
              '& img': {
                filter: 'invert(1) hue-rotate(180deg)',
              },
              // Invert videos back
              '& video, & iframe': {
                filter: 'invert(1) hue-rotate(180deg)',
              },
            }),

            // Images
            '& img': {
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              // Preserve the invert filter from above if applied
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
          dangerouslySetInnerHTML={{ __html: processedHtml }}
          // Handle link clicks to open in new tab
          onClick={(e) => {
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
          }}
        />
      </Box>
    </Box>
  );
}
