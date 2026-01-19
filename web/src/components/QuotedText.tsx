/**
 * QuotedText component - Detect and collapse quoted text in email replies
 *
 * Detects common quote patterns:
 * - Lines starting with >
 * - "On ... wrote:" patterns
 * - "-----Original Message-----" patterns
 * - Outlook-style "From: ... Sent: ... To: ... Subject:" blocks
 */

import { useState, useMemo } from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

interface QuotedTextProps {
  /** The full email text content */
  text: string;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
}

// Patterns to detect the START of quoted text
const QUOTE_START_PATTERNS = [
  /^On .+wrote:$/m,                              // Gmail: "On Mon, Jan 1... wrote:"
  /^-{3,}\s*Original Message\s*-{3,}$/im,        // Outlook: "-----Original Message-----"
  /^From:.+\nSent:.+\nTo:.+/m,                   // Outlook headers
  /^>+\s*.+$/m,                                   // Traditional > quotes
  /^\*From:\*.+$/m,                              // Bold "From:"
  /^_{10,}$/m,                                    // Long underscore separator
];

// Detect where quoted text begins
const detectQuoteStart = (text: string): number => {
  let earliestIndex = -1;

  for (const pattern of QUOTE_START_PATTERNS) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      if (earliestIndex === -1 || match.index < earliestIndex) {
        earliestIndex = match.index;
      }
    }
  }

  return earliestIndex;
};

// Count lines in a string
const countLines = (text: string): number => {
  return text.split('\n').length;
};

export function QuotedText({ text, defaultCollapsed = true }: QuotedTextProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const { mainText, quotedText, quotedLineCount } = useMemo(() => {
    const quoteStart = detectQuoteStart(text);

    if (quoteStart === -1) {
      return { mainText: text, quotedText: '', quotedLineCount: 0 };
    }

    return {
      mainText: text.slice(0, quoteStart).trim(),
      quotedText: text.slice(quoteStart),
      quotedLineCount: countLines(text.slice(quoteStart)),
    };
  }, [text]);

  // No quoted text detected
  if (!quotedText) {
    return (
      <Typography
        variant="body1"
        component="pre"
        sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', m: 0 }}
      >
        {text}
      </Typography>
    );
  }

  return (
    <Box>
      {/* Main (non-quoted) text */}
      {mainText && (
        <Typography
          variant="body1"
          component="pre"
          sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', m: 0, mb: 2 }}
        >
          {mainText}
        </Typography>
      )}

      {/* Quoted text toggle */}
      <Button
        size="small"
        onClick={() => setCollapsed(!collapsed)}
        startIcon={collapsed ? <ExpandMore /> : <ExpandLess />}
        sx={{
          textTransform: 'none',
          color: 'text.secondary',
          fontSize: '0.75rem',
          mb: 1,
        }}
      >
        {collapsed
          ? `Show quoted text (${quotedLineCount} lines)`
          : 'Hide quoted text'}
      </Button>

      {/* Quoted text content */}
      {!collapsed && (
        <Box
          sx={{
            pl: 2,
            borderLeft: `3px solid ${isDark ? '#444' : '#ddd'}`,
            color: 'text.secondary',
            fontSize: '0.9em',
          }}
        >
          <Typography
            variant="body2"
            component="pre"
            sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', m: 0 }}
          >
            {quotedText}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

/**
 * Process HTML content to wrap quoted sections
 * This is for HTML emails - returns HTML with quoted sections wrapped
 */
export function processHtmlQuotes(html: string): { mainHtml: string; quotedHtml: string } {
  // Look for blockquote or gmail_quote class
  const blockquoteMatch = html.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i);
  const gmailQuoteMatch = html.match(/<div class="gmail_quote"[^>]*>([\s\S]*?)<\/div>\s*$/i);

  if (gmailQuoteMatch) {
    const quoteStart = html.indexOf(gmailQuoteMatch[0]);
    return {
      mainHtml: html.slice(0, quoteStart).trim(),
      quotedHtml: gmailQuoteMatch[0],
    };
  }

  if (blockquoteMatch) {
    const quoteStart = html.indexOf(blockquoteMatch[0]);
    return {
      mainHtml: html.slice(0, quoteStart).trim(),
      quotedHtml: blockquoteMatch[0],
    };
  }

  return { mainHtml: html, quotedHtml: '' };
}
