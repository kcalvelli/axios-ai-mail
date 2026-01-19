/**
 * Sanitize email snippet by stripping HTML tags and CSS
 *
 * Handles:
 * - Inline CSS styles (e.g., .customLink{font-size: 20px...})
 * - HTML tags (<p>, <div>, <span>, etc.)
 * - HTML entities (&nbsp;, &amp;, etc.)
 * - Extra whitespace
 */

/**
 * Strip HTML/CSS from email snippet to display only plain text
 */
export function sanitizeSnippet(snippet: string | null | undefined): string {
  if (!snippet) return '';

  let text = snippet;

  // Remove CSS blocks (e.g., .class{...} or @media{...})
  text = text.replace(/[.#@]?[\w-]+\s*\{[^}]*\}/g, '');

  // Remove style tags and their content
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove script tags and their content
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&hellip;/gi, '...')
    .replace(/&#(\d+);/gi, (_, code) => String.fromCharCode(parseInt(code, 10)));

  // Collapse multiple whitespace characters into single space
  text = text.replace(/\s+/g, ' ');

  // Trim leading/trailing whitespace
  return text.trim();
}
