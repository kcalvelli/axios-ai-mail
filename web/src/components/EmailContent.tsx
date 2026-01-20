/**
 * EmailContent component - Enhanced HTML email rendering using iframe sandbox
 *
 * Features:
 * - Iframe-based rendering for isolation from React reconciliation
 * - Prevents infinite render loops from blocked tracking pixels
 * - Dark mode adaptation using CSS filter inversion (industry standard)
 * - Remote image blocking with prompt
 * - Safe link handling (open in new tab)
 * - Typography improvements
 * - Responsive tables
 *
 * Why iframe?
 * - Marketing emails have deeply nested tables that can overwhelm React's reconciler
 * - Blocked tracking pixels can trigger render loops with dangerouslySetInnerHTML
 * - Iframe isolates the HTML and sandboxes any scripts
 *
 * Dark mode approach:
 * - Uses filter: invert(1) hue-rotate(180deg) to invert colors while preserving hues
 * - Images are inverted back to display correctly
 * - This matches how Gmail, Outlook, and other major clients handle dark mode
 *
 * @see https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  const [iframeHeight, setIframeHeight] = useState(200);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  // Build the iframe srcdoc with embedded styles
  const iframeSrcDoc = useMemo(() => {
    const darkModeStyles = applyDarkMode ? `
      html {
        filter: invert(1) hue-rotate(180deg);
        background: #ffffff;
      }
      img, video {
        filter: invert(1) hue-rotate(180deg);
      }
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <base target="_blank">
        <style>
          * {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 15px;
            line-height: 1.6;
            word-break: break-word;
            overflow-wrap: break-word;
            background: ${applyDarkMode ? '#ffffff' : (isDark ? '#fafafa' : 'transparent')};
          }
          body {
            padding: ${isDark ? '16px' : '0'};
          }
          img {
            max-width: 100%;
            height: auto;
            display: block;
          }
          /* Suppress image load errors visually */
          img[src^="data:"] {
            opacity: 0.5;
          }
          a {
            color: #1976d2;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          pre, code {
            background-color: #f5f5f5;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.9em;
            overflow: auto;
          }
          pre {
            padding: 16px;
            white-space: pre-wrap;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            max-width: 100%;
            margin-bottom: 16px;
          }
          td, th {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            word-break: break-word;
          }
          th {
            background-color: #f5f5f5;
            font-weight: 600;
          }
          blockquote {
            margin: 16px 0;
            padding: 8px 16px;
            border-left: 4px solid #ddd;
            background-color: #f9f9f9;
          }
          ul, ol {
            padding-left: 24px;
            margin-bottom: 16px;
          }
          li {
            margin-bottom: 4px;
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 16px;
            margin-bottom: 8px;
            font-weight: 600;
            line-height: 1.3;
          }
          p {
            margin-bottom: 12px;
          }
          hr {
            border: none;
            border-top: 1px solid #ddd;
            margin: 16px 0;
          }
          ${darkModeStyles}
        </style>
      </head>
      <body>
        ${processedHtml}
        <script>
          // Report height to parent for auto-sizing
          function reportHeight() {
            const height = document.documentElement.scrollHeight;
            window.parent.postMessage({ type: 'email-iframe-height', height: height }, '*');
          }
          // Report on load and after images load
          window.addEventListener('load', reportHeight);
          window.addEventListener('resize', reportHeight);
          // Also report after a short delay for any delayed content
          setTimeout(reportHeight, 100);
          setTimeout(reportHeight, 500);
          // Handle images loading (or failing)
          document.querySelectorAll('img').forEach(img => {
            img.addEventListener('load', reportHeight);
            img.addEventListener('error', reportHeight);
          });
          // Initial report
          reportHeight();
        </script>
      </body>
      </html>
    `;
  }, [processedHtml, applyDarkMode, isDark]);

  // Listen for height messages from iframe
  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'email-iframe-height' && typeof event.data.height === 'number') {
      setIframeHeight(Math.max(100, event.data.height + 20)); // Add padding
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

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

      {/* Email content in sandboxed iframe */}
      <Box
        sx={{
          // Container styling for dark mode
          ...(isDark && {
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: applyDarkMode
              ? 'none'
              : '0 2px 8px rgba(0,0,0,0.4), 0 0 1px rgba(0,0,0,0.3)',
          }),
        }}
      >
        <iframe
          ref={iframeRef}
          srcDoc={iframeSrcDoc}
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          style={{
            width: '100%',
            height: iframeHeight,
            border: 'none',
            display: 'block',
            backgroundColor: isDark ? (applyDarkMode ? '#ffffff' : '#fafafa') : 'transparent',
          }}
          title="Email content"
        />
      </Box>
    </Box>
  );
}
