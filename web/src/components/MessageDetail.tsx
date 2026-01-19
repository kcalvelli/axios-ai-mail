/**
 * MessageDetail component - Reusable message detail view
 * Used in both the full-page MessageDetailPage and the ReadingPane split view
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  IconButton,
  CircularProgress,
  Alert,
  Autocomplete,
  TextField,
  Button,
  Divider,
  Tooltip,
  useTheme,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  Mail,
  MailOutline,
  Delete,
  Reply,
  Forward,
  AttachFile,
  Download,
  Print,
  ArrowBack,
  Close,
  Visibility,
  Image as ImageIcon,
} from '@mui/icons-material';
import DOMPurify from 'dompurify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { SenderAvatar, extractSenderName } from './SenderAvatar';
import { QuotedText, processHtmlQuotes } from './QuotedText';
import { TagChip } from './TagChip';
import { ConfidenceBadgeAlways } from './ConfidenceBadge';
import { SmartReplies } from './SmartReplies';
import { ThreadView } from './ThreadView';
import { EmailContent } from './EmailContent';
import {
  useMessage,
  useUpdateTags,
  useMarkRead,
  useMessageBody,
} from '../hooks/useMessages';
import { useTags } from '../hooks/useStats';
import { useIsMobile } from '../hooks/useIsMobile';

interface Attachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
}

interface MessageDetailProps {
  messageId: string;
  /** Compact mode for reading pane (less padding) */
  compact?: boolean;
  /** Show back button */
  showBackButton?: boolean;
  /** Custom back handler */
  onBack?: () => void;
  /** Delete handler (if not provided, uses default) */
  onDelete?: () => void;
}

export function MessageDetail({
  messageId,
  compact = false,
  showBackButton = true,
  onBack,
  onDelete,
}: MessageDetailProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useIsMobile();

  // Mobile touch target size (48px minimum for accessibility)
  const mobileButtonSize = isMobile ? 'medium' : 'small';

  const { data: message, isLoading, error } = useMessage(messageId);
  const { data: body, isLoading: bodyLoading } = useMessageBody(messageId);
  const { data: tagsData } = useTags();
  const updateTags = useUpdateTags();
  const markRead = useMarkRead();

  const [editingTags, setEditingTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [showQuotedHtml, setShowQuotedHtml] = useState(false);
  // Attachment preview state
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Auto-mark as read when message is opened
  useEffect(() => {
    if (message && message.is_unread) {
      markRead.mutate({
        id: message.id,
        data: { is_unread: false },
      });
    }
  }, [message?.id]);

  // Fetch attachments when message loads
  useEffect(() => {
    const fetchAttachments = async () => {
      if (!messageId || !message?.has_attachments) {
        setAttachments([]);
        return;
      }
      setAttachmentsLoading(true);
      try {
        const response = await axios.get(`/api/attachments/messages/${messageId}/attachments`);
        setAttachments(response.data);
      } catch (err) {
        console.error('Failed to fetch attachments:', err);
        setAttachments([]);
      } finally {
        setAttachmentsLoading(false);
      }
    };
    fetchAttachments();
  }, [messageId, message?.has_attachments]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      const response = await axios.get(
        `/api/attachments/${attachment.id}/download?message_id=${messageId}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download attachment:', err);
    }
  };

  // Check if attachment is previewable (images)
  const isPreviewable = (contentType: string): boolean => {
    const previewableTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
    ];
    return previewableTypes.includes(contentType.toLowerCase());
  };

  // Handle preview attachment
  const handlePreviewAttachment = async (attachment: Attachment) => {
    setPreviewAttachment(attachment);
    setPreviewLoading(true);

    try {
      const response = await axios.get(
        `/api/attachments/${attachment.id}/download?message_id=${messageId}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data], { type: attachment.content_type }));
      setPreviewUrl(url);
    } catch (err) {
      console.error('Failed to load attachment preview:', err);
      setPreviewAttachment(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Close preview and cleanup
  const handleClosePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewAttachment(null);
    setPreviewUrl(null);
  };

  const handleMarkRead = () => {
    if (message) {
      markRead.mutate({
        id: message.id,
        data: { is_unread: !message.is_unread },
      });
    }
  };

  const handleEditTags = () => {
    if (message) {
      setSelectedTags(message.tags);
      setEditingTags(true);
    }
  };

  const handleSaveTags = () => {
    if (message) {
      updateTags.mutate(
        { id: message.id, data: { tags: selectedTags } },
        { onSuccess: () => setEditingTags(false) }
      );
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (message) {
      updateTags.mutate({
        id: message.id,
        data: { tags: message.tags.filter((t) => t !== tagToRemove) },
      });
    }
  };

  const handleReply = () => {
    if (message) {
      const params = new URLSearchParams({
        reply_to: message.id,
        to: message.from_email,
        subject: message.subject.startsWith('Re: ') ? message.subject : `Re: ${message.subject}`,
        thread_id: message.thread_id || '',
        account_id: message.account_id,
        quote_from: message.from_email,
        quote_date: message.date,
      });
      navigate(`/compose?${params.toString()}`);
    }
  };

  const handleForward = () => {
    if (message) {
      const params = new URLSearchParams({
        subject: message.subject.startsWith('Fwd: ') ? message.subject : `Fwd: ${message.subject}`,
      });
      navigate(`/compose?${params.toString()}`);
    }
  };

  const handleSelectSmartReply = (replyText: string) => {
    if (message) {
      const params = new URLSearchParams({
        reply_to: message.id,
        to: message.from_email,
        subject: message.subject.startsWith('Re: ') ? message.subject : `Re: ${message.subject}`,
        thread_id: message.thread_id || '',
        account_id: message.account_id,
        quote_from: message.from_email,
        quote_date: message.date,
        body: replyText,
      });
      navigate(`/compose?${params.toString()}`);
    }
  };

  const handlePrint = () => {
    // Create a new window with just the email content for clean printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback if popup blocked
      window.print();
      return;
    }

    const { name: sName, email: sEmail } = extractSenderName(message?.from_email || '');
    const printDate = message ? new Date(message.date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }) : '';

    // Get the email content HTML
    const emailBody = body?.body_html
      ? DOMPurify.sanitize(body.body_html, {
          ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 'b', 'i', 's',
            'a', 'ul', 'ol', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'blockquote', 'div', 'span', 'pre', 'code',
            'table', 'tr', 'td', 'th', 'thead', 'tbody',
            'img',
          ],
          ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'src', 'alt', 'width', 'height'],
        })
      : body?.body_text
        ? `<pre style="white-space: pre-wrap; font-family: inherit;">${body.body_text}</pre>`
        : message?.snippet || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${message?.subject || 'Email'}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 12pt;
            line-height: 1.5;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #000;
          }
          .header {
            border-bottom: 1px solid #ddd;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .subject {
            font-size: 18pt;
            font-weight: 600;
            margin-bottom: 12px;
          }
          .meta {
            font-size: 10pt;
            color: #666;
            line-height: 1.8;
          }
          .meta strong {
            color: #333;
          }
          .content {
            margin-top: 16px;
          }
          .content img {
            max-width: 100%;
            height: auto;
          }
          .content a {
            color: #1976d2;
          }
          .content pre, .content code {
            background: #f5f5f5;
            padding: 8px;
            border-radius: 4px;
            font-size: 10pt;
          }
          .content blockquote {
            border-left: 3px solid #ddd;
            padding-left: 12px;
            margin-left: 0;
            color: #666;
          }
          @media print {
            body { padding: 0; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="subject">${message?.subject || ''}</div>
          <div class="meta">
            <div><strong>From:</strong> ${sName ? `${sName} <${sEmail}>` : sEmail}</div>
            <div><strong>To:</strong> ${message?.to_emails.join(', ') || ''}</div>
            <div><strong>Date:</strong> ${printDate}</div>
          </div>
        </div>
        <div class="content">
          ${emailBody}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };

    // Fallback if onload doesn't fire
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.print();
        printWindow.close();
      }
    }, 500);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !message) {
    return (
      <Box p={2}>
        <Alert severity="error">Failed to load message</Alert>
      </Box>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const allTags = tagsData?.tags.map((t) => t.name) || [];
  const { name: senderName, email: senderEmail } = extractSenderName(message.from_email);

  // Sanitize HTML content
  const sanitizedHtml = body?.body_html
    ? DOMPurify.sanitize(body.body_html, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'b', 'i', 's',
          'a', 'ul', 'ol', 'li',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'blockquote', 'div', 'span', 'pre', 'code',
          'table', 'tr', 'td', 'th', 'thead', 'tbody',
          'img',
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'src', 'alt', 'width', 'height'],
      })
    : null;

  // Process HTML for quote collapsing
  const { mainHtml, quotedHtml } = sanitizedHtml
    ? processHtmlQuotes(sanitizedHtml)
    : { mainHtml: '', quotedHtml: '' };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }} className="message-detail-print">
      {/* Header Actions - Sticky on mobile with larger touch targets */}
      <Box
        display="flex"
        alignItems="center"
        gap={isMobile ? 0.5 : 1}
        mb={2}
        sx={{
          position: 'sticky',
          top: 0,
          bgcolor: isDark ? '#121212' : 'background.default',
          zIndex: 10,
          py: isMobile ? 1.5 : 1,
          px: isMobile ? 1 : 0,
          mx: isMobile ? -2 : 0, // Extend to edges on mobile
          borderBottom: isMobile ? `1px solid ${isDark ? '#333' : '#e0e0e0'}` : 'none',
        }}
        className="no-print"
      >
        {showBackButton && (
          <Tooltip title="Back (Escape)">
            <IconButton
              onClick={handleBack}
              size={mobileButtonSize}
              sx={{ minWidth: isMobile ? 48 : 'auto' }}
            >
              <ArrowBack />
            </IconButton>
          </Tooltip>
        )}

        <Box flex={1} />

        <Tooltip title="Reply (r)">
          <IconButton onClick={handleReply} size={mobileButtonSize}>
            <Reply />
          </IconButton>
        </Tooltip>

        <Tooltip title="Forward (f)">
          <IconButton onClick={handleForward} size={mobileButtonSize}>
            <Forward />
          </IconButton>
        </Tooltip>

        <Tooltip title="Toggle read/unread (u)">
          <IconButton onClick={handleMarkRead} size={mobileButtonSize}>
            {message.is_unread ? <Mail color="primary" /> : <MailOutline />}
          </IconButton>
        </Tooltip>

        {/* Print button - hide on mobile (not practical) */}
        {!isMobile && (
          <Tooltip title="Print">
            <IconButton onClick={handlePrint} size={mobileButtonSize}>
              <Print />
            </IconButton>
          </Tooltip>
        )}

        {onDelete && (
          <Tooltip title="Delete (#)">
            <IconButton onClick={onDelete} size={mobileButtonSize} color="error">
              <Delete />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Message Content */}
      <Paper sx={{ p: compact ? 2 : 3, bgcolor: isDark ? '#1E1E1E' : 'background.paper' }}>
        {/* Sender with Avatar */}
        <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
          <SenderAvatar email={senderEmail} name={senderName} size={48} />
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle1" fontWeight={600}>
              {senderName || senderEmail}
            </Typography>
            {senderName && (
              <Typography variant="body2" color="text.secondary">
                {senderEmail}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {formatDate(message.date)}
            </Typography>
          </Box>
        </Box>

        {/* Subject */}
        <Typography variant="h6" gutterBottom>
          {message.subject}
        </Typography>

        {/* To */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>To:</strong> {message.to_emails.join(', ')}
        </Typography>

        {/* Tags Section */}
        <Box mt={2} mb={2}>
          {editingTags ? (
            <Box>
              <Autocomplete
                multiple
                options={allTags}
                value={selectedTags}
                onChange={(_, newValue) => setSelectedTags(newValue)}
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" placeholder="Select tags..." size="small" />
                )}
                sx={{ mb: 1 }}
              />
              <Stack direction="row" spacing={1}>
                <Chip label="Save" color="primary" onClick={handleSaveTags} size="small" />
                <Chip label="Cancel" variant="outlined" onClick={() => setEditingTags(false)} size="small" />
              </Stack>
            </Box>
          ) : (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} alignItems="center">
              {message.tags.map((tag) => (
                <TagChip key={tag} tag={tag} onDelete={() => handleRemoveTag(tag)} size="small" />
              ))}
              <Chip label="+ Edit" variant="outlined" size="small" onClick={handleEditTags} />
            </Stack>
          )}
        </Box>

        {/* Attachments */}
        {(attachments.length > 0 || attachmentsLoading) && (
          <Box mt={2} mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              <AttachFile fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Attachments ({attachments.length})
            </Typography>
            {attachmentsLoading ? (
              <CircularProgress size={20} />
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {attachments.map((att) => (
                  <Box key={att.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {/* Preview button for images */}
                    {isPreviewable(att.content_type) && (
                      <Tooltip title="Preview">
                        <IconButton
                          size="small"
                          onClick={() => handlePreviewAttachment(att)}
                          sx={{ p: 0.5 }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {/* Download chip */}
                    <Chip
                      label={`${att.filename} (${formatFileSize(att.size)})`}
                      icon={isPreviewable(att.content_type) ? <ImageIcon /> : <Download />}
                      onClick={() => handleDownloadAttachment(att)}
                      variant="outlined"
                      sx={{ cursor: 'pointer' }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {/* Image Preview Modal */}
        <Dialog
          open={!!previewAttachment}
          onClose={handleClosePreview}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" noWrap sx={{ flex: 1, mr: 2 }}>
              {previewAttachment?.filename}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Download">
                <IconButton
                  size="small"
                  onClick={() => previewAttachment && handleDownloadAttachment(previewAttachment)}
                >
                  <Download />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={handleClosePreview}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            {previewLoading ? (
              <CircularProgress />
            ) : previewUrl ? (
              <Box
                component="img"
                src={previewUrl}
                alt={previewAttachment?.filename}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <Typography color="text.secondary">Failed to load preview</Typography>
            )}
          </DialogContent>
        </Dialog>

        <Divider sx={{ my: 2 }} />

        {/* Message Body */}
        <Box mt={2}>
          {bodyLoading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : mainHtml ? (
            <>
              {/* Main HTML content with enhanced rendering */}
              <EmailContent html={mainHtml} />

              {/* Quoted HTML toggle */}
              {quotedHtml && (
                <Box mt={2}>
                  <Button
                    size="small"
                    onClick={() => setShowQuotedHtml(!showQuotedHtml)}
                    sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.75rem' }}
                  >
                    {showQuotedHtml ? '▼ Hide quoted text' : '▶ Show quoted text'}
                  </Button>
                  {showQuotedHtml && (
                    <Box
                      sx={{
                        pl: 2,
                        borderLeft: `3px solid ${isDark ? '#444' : '#ddd'}`,
                        mt: 1,
                        color: 'text.secondary',
                      }}
                    >
                      <EmailContent html={quotedHtml} />
                    </Box>
                  )}
                </Box>
              )}
            </>
          ) : body?.body_text ? (
            <QuotedText text={body.body_text} />
          ) : (
            <Typography variant="body1" color="text.secondary">
              {message.snippet}
            </Typography>
          )}
        </Box>

        {/* Smart Replies */}
        <SmartReplies
          messageId={message.id}
          onSelectReply={handleSelectSmartReply}
          folder={message.provider_labels.includes('SENT') ? 'sent' : undefined}
          tags={message.tags}
        />

        {/* Metadata */}
        {message.classified_at && (
          <Box mt={3} display="flex" alignItems="center" gap={1} className="no-print">
            <Typography variant="caption" color="text.secondary">
              Classified on {new Date(message.classified_at).toLocaleString()}
            </Typography>
            {message.confidence !== undefined && message.confidence !== null && (
              <>
                <Typography variant="caption" color="text.secondary">•</Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="caption" color="text.secondary">Confidence:</Typography>
                  <ConfidenceBadgeAlways confidence={message.confidence} size="small" showLabel />
                </Box>
              </>
            )}
          </Box>
        )}

        {/* Thread/Conversation View */}
        {message.thread_id && (
          <ThreadView threadId={message.thread_id} currentMessageId={message.id} />
        )}
      </Paper>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide non-printable elements */
          .no-print,
          header,
          nav,
          aside,
          .MuiDrawer-root,
          .MuiAppBar-root {
            display: none !important;
          }

          /* Reset container for print */
          .message-detail-print {
            overflow: visible !important;
            height: auto !important;
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Page settings */
          @page {
            margin: 1cm;
            size: A4;
          }

          /* Email content styling */
          .email-content {
            font-size: 12pt !important;
            line-height: 1.5 !important;
          }

          /* Ensure images don't break pages */
          img {
            max-width: 100% !important;
            page-break-inside: avoid;
          }

          /* Keep paragraphs together */
          p {
            orphans: 3;
            widows: 3;
          }

          /* Print headers */
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
          }

          /* Links - show URLs */
          a[href^="http"]:after {
            content: " (" attr(href) ")";
            font-size: 0.8em;
            color: #666;
          }

          /* Hide interactive elements */
          button, .MuiIconButton-root, .MuiChip-root[onclick] {
            display: none !important;
          }
        }
      `}</style>
    </Box>
  );
}
