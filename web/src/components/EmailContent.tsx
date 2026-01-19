/**
 * EmailContent component - Enhanced HTML email rendering
 *
 * Features:
 * - Dark mode adaptation for email content
 * - Remote image blocking with prompt
 * - Safe link handling (open in new tab)
 * - Typography improvements
 * - Responsive tables
 */

import { useState, useEffect, useMemo } from 'react';
import { Box, Button, Alert, useTheme } from '@mui/material';
import { Image, ImageNotSupported } from '@mui/icons-material';

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
 * Transform HTML for dark mode
 */
function adaptForDarkMode(html: string): string {
  // Replace common light background colors with transparent
  let adapted = html
    // Replace white/light backgrounds
    .replace(/background(-color)?:\s*(#fff(fff)?|white|#f[0-9a-f]{5})/gi, 'background-color: transparent')
    // Replace black text on backgrounds we've made transparent
    .replace(/color:\s*(#000(000)?|black)/gi, 'color: inherit')
    // Handle inline styles with multiple properties
    .replace(/style="([^"]*?)background(-color)?:\s*(#fff(fff)?|white)([^"]*?)"/gi,
      (_, before, __, ___, ____, after) => `style="${before}background-color: transparent${after}"`)
    // Handle rgb(255,255,255) backgrounds
    .replace(/background(-color)?:\s*rgb\(255\s*,\s*255\s*,\s*255\)/gi, 'background-color: transparent');

  return adapted;
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

  // Check for remote images
  useEffect(() => {
    setHasRemote(hasRemoteImages(html));
  }, [html]);

  // Process HTML
  const processedHtml = useMemo(() => {
    let processed = html;

    // Apply dark mode adaptation
    if (isDark) {
      processed = adaptForDarkMode(processed);
    }

    // Block remote images if not allowed
    if (!showRemoteImages && hasRemote) {
      processed = blockRemoteImages(processed);
    }

    return processed;
  }, [html, isDark, showRemoteImages, hasRemote]);

  const handleLoadImages = () => {
    setShowRemoteImages(true);
    onLoadRemoteImages?.();
  };

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

      {/* Email content */}
      <Box
        className="email-content"
        sx={{
          // Typography
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '15px',
          lineHeight: 1.6,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',

          // Images
          '& img': {
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
          },

          // Links - open in new tab with security
          '& a': {
            color: theme.palette.primary.main,
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },

          // Preformatted text
          '& pre, & code': {
            backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
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
            border: `1px solid ${isDark ? '#444' : '#ddd'}`,
            padding: theme.spacing(1),
            textAlign: 'left',
            wordBreak: 'break-word',
          },
          '& th': {
            backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
            fontWeight: 600,
          },

          // Blockquotes
          '& blockquote': {
            margin: theme.spacing(2, 0),
            padding: theme.spacing(1, 2),
            borderLeft: `4px solid ${isDark ? '#444' : '#ddd'}`,
            backgroundColor: isDark ? '#2a2a2a' : '#f9f9f9',
            color: theme.palette.text.secondary,
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
            borderTop: `1px solid ${isDark ? '#444' : '#ddd'}`,
            margin: theme.spacing(2, 0),
          },

          // Dark mode specific overrides
          ...(isDark && {
            // Override common white/light backgrounds
            '& [style*="background"]': {
              backgroundColor: 'transparent !important',
            },
            '& [style*="color: #000"], & [style*="color:#000"], & [style*="color: black"]': {
              color: 'inherit !important',
            },
            // Gmail-specific
            '& .gmail_quote': {
              borderLeft: `2px solid ${theme.palette.divider}`,
              paddingLeft: theme.spacing(1),
              color: theme.palette.text.secondary,
            },
          }),
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
  );
}
