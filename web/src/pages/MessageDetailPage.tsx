/**
 * MessageDetailPage - Full message view with tag editing
 */

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  ArrowBack,
  Mail,
  MailOutline,
  Delete,
  Reply,
  Forward,
  AttachFile,
  Download,
  Print,
  Close,
  Visibility,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import axios from 'axios';
import DOMPurify from 'dompurify';

interface Attachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
}
import {
  useMessage,
  useMessages,
  useUpdateTags,
  useMarkRead,
  useMessageBody,
  useDeleteMessage,
} from '../hooks/useMessages';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useAppStore } from '../store/appStore';
import { useTags } from '../hooks/useStats';
import { TagChip } from '../components/TagChip';
import { ConfidenceBadgeAlways } from '../components/ConfidenceBadge';
import { SmartReplies } from '../components/SmartReplies';
import { SenderAvatar, extractSenderName } from '../components/SenderAvatar';
import { QuotedText, processHtmlQuotes } from '../components/QuotedText';
import { EmailContent } from '../components/EmailContent';
import { ThreadView } from '../components/ThreadView';

export function MessageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useIsMobile();
  const { data: message, isLoading, error } = useMessage(id!);
  const { data: body, isLoading: bodyLoading } = useMessageBody(id!);
  const { data: tagsData } = useTags();
  const updateTags = useUpdateTags();
  const markRead = useMarkRead();
  const deleteMessage = useDeleteMessage();

  // Get messages for keyboard navigation (same folder as current message)
  const { data: messagesData } = useMessages({
    folder: message?.folder || 'inbox',
    limit: 200,
  });
  const messageIds = messagesData?.messages.map((m) => m.id) || [];

  // Keyboard navigation callbacks
  const handleKeyboardReply = useCallback((messageId: string) => {
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
  }, [message, navigate]);

  const handleKeyboardDelete = useCallback((messageId: string) => {
    if (message) {
      deleteMessage.mutate(message.id, {
        onSuccess: () => {
          // Navigate to next message or back to list
          const currentIndex = messageIds.indexOf(message.id);
          const nextId = messageIds[currentIndex + 1] || messageIds[currentIndex - 1];
          if (nextId) {
            navigate(`/messages/${nextId}`, { replace: true });
          } else {
            navigate(-1);
          }
        },
      });
    }
  }, [message, messageIds, deleteMessage, navigate]);

  const handleKeyboardToggleRead = useCallback((messageId: string) => {
    if (message) {
      markRead.mutate({
        id: message.id,
        data: { is_unread: !message.is_unread },
      });
    }
  }, [message, markRead]);

  // Keyboard navigation hook (desktop only)
  const { selectedMessageId, setSelectedMessageId } = useAppStore();

  useKeyboardNavigation({
    messageIds,
    enabled: !isMobile,
    onReply: handleKeyboardReply,
    onDelete: handleKeyboardDelete,
    onToggleRead: handleKeyboardToggleRead,
  });

  // Sync current message with app store selection
  useEffect(() => {
    if (id && id !== selectedMessageId) {
      setSelectedMessageId(id);
    }
  }, [id, selectedMessageId, setSelectedMessageId]);

  // Navigate to selected message when j/k changes selection
  useEffect(() => {
    if (selectedMessageId && selectedMessageId !== id && messageIds.includes(selectedMessageId)) {
      navigate(`/messages/${selectedMessageId}`, { replace: true });
    }
  }, [selectedMessageId, id, messageIds, navigate]);

  const [editingTags, setEditingTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
  }, [message?.id]); // Only run when message ID changes

  // Fetch attachments when message loads (only if message has attachments)
  useEffect(() => {
    const fetchAttachments = async () => {
      if (!id || !message?.has_attachments) {
        setAttachments([]);
        return;
      }
      setAttachmentsLoading(true);
      try {
        const response = await axios.get(`/api/attachments/messages/${id}/attachments`);
        setAttachments(response.data);
      } catch (err) {
        console.error('Failed to fetch attachments:', err);
        setAttachments([]);
      } finally {
        setAttachmentsLoading(false);
      }
    };
    fetchAttachments();
  }, [id, message?.has_attachments]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Download attachment
  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      const response = await axios.get(
        `/api/attachments/${attachment.id}/download?message_id=${id}`,
        { responseType: 'blob' }
      );
      // Create download link
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
        `/api/attachments/${attachment.id}/download?message_id=${id}`,
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
        {
          id: message.id,
          data: { tags: selectedTags },
        },
        {
          onSuccess: () => setEditingTags(false),
        }
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

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (message) {
      deleteMessage.mutate(message.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          navigate(-1); // Go back to message list
        },
      });
    }
  };

  const handleReply = () => {
    if (message) {
      // Navigate to compose page with reply parameters
      // Use the account that received the message as the default "From"
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
      // Navigate to compose page with forward parameters
      const params = new URLSearchParams({
        subject: message.subject.startsWith('Fwd: ') ? message.subject : `Fwd: ${message.subject}`,
      });
      navigate(`/compose?${params.toString()}`);
    }
  };

  const handleSelectSmartReply = (replyText: string) => {
    if (message) {
      // Navigate to compose page with the smart reply pre-filled
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
    if (!message) return;

    // Create a new window with just the email content for clean printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const printDate = new Date(message.date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    // Get the email content
    const emailBody = body?.body_html
      ? DOMPurify.sanitize(body.body_html, {
          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'div', 'span', 'pre', 'code'],
          ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
        })
      : body?.body_text
        ? `<pre style="white-space: pre-wrap; font-family: inherit;">${body.body_text}</pre>`
        : message.snippet;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${message.subject}</title>
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
          .header { border-bottom: 1px solid #ddd; padding-bottom: 16px; margin-bottom: 16px; }
          .subject { font-size: 18pt; font-weight: 600; margin-bottom: 12px; }
          .meta { font-size: 10pt; color: #666; line-height: 1.8; }
          .meta strong { color: #333; }
          .content { margin-top: 16px; }
          .content img { max-width: 100%; height: auto; }
          .content a { color: #1976d2; }
          .content pre, .content code { background: #f5f5f5; padding: 8px; border-radius: 4px; }
          .content blockquote { border-left: 3px solid #ddd; padding-left: 12px; margin-left: 0; color: #666; }
          @media print { body { padding: 0; } @page { margin: 1cm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="subject">${message.subject}</div>
          <div class="meta">
            <div><strong>From:</strong> ${message.from_email}</div>
            <div><strong>To:</strong> ${message.to_emails.join(', ')}</div>
            <div><strong>Date:</strong> ${printDate}</div>
          </div>
        </div>
        <div class="content">${emailBody}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); printWindow.close(); };
    setTimeout(() => { if (!printWindow.closed) { printWindow.print(); printWindow.close(); } }, 500);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !message) {
    return (
      <Box p={3}>
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
          'p',
          'br',
          'strong',
          'em',
          'u',
          'b',
          'i',
          's',
          'a',
          'ul',
          'ol',
          'li',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'blockquote',
          'div',
          'span',
          'pre',
          'code',
          'table',
          'tr',
          'td',
          'th',
          'thead',
          'tbody',
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
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" flex={1}>
          Message
        </Typography>
        {isMobile ? (
          <>
            <Tooltip title="Reply">
              <IconButton onClick={handleReply} sx={{ mr: 0.5 }}>
                <Reply />
              </IconButton>
            </Tooltip>
            <Tooltip title="Forward">
              <IconButton onClick={handleForward} sx={{ mr: 1 }}>
                <Forward />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              startIcon={<Reply />}
              onClick={handleReply}
              sx={{ mr: 1 }}
            >
              Reply
            </Button>
            <Button
              variant="outlined"
              startIcon={<Forward />}
              onClick={handleForward}
              sx={{ mr: 2 }}
            >
              Forward
            </Button>
          </>
        )}
        <IconButton onClick={handleMarkRead} sx={{ mr: 1 }}>
          {message.is_unread ? (
            <Mail color="primary" />
          ) : (
            <MailOutline color="action" />
          )}
        </IconButton>
        {/* Print button - hide on mobile */}
        {!isMobile && (
          <Tooltip title="Print">
            <IconButton onClick={handlePrint} sx={{ mr: 1 }}>
              <Print />
            </IconButton>
          </Tooltip>
        )}
        <IconButton onClick={handleDeleteClick} color="error">
          <Delete />
        </IconButton>
      </Box>

      {/* Message Details */}
      <Paper sx={{ p: 3, bgcolor: isDark ? '#1E1E1E' : 'background.paper' }}>
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
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Tags
          </Typography>

          {editingTags ? (
            <Box>
              <Autocomplete
                multiple
                options={allTags}
                value={selectedTags}
                onChange={(_, newValue) => setSelectedTags(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder="Select tags..."
                  />
                )}
                sx={{ mb: 2 }}
              />
              <Stack direction="row" spacing={1}>
                <Chip label="Save" color="primary" onClick={handleSaveTags} />
                <Chip
                  label="Cancel"
                  variant="outlined"
                  onClick={() => setEditingTags(false)}
                />
              </Stack>
            </Box>
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {message.tags.map((tag) => (
                <TagChip
                  key={tag}
                  tag={tag}
                  onDelete={() => handleRemoveTag(tag)}
                />
              ))}
              <Chip
                label="+ Edit"
                variant="outlined"
                size="small"
                onClick={handleEditTags}
              />
            </Stack>
          )}
        </Box>

        {/* Attachments Section */}
        {(attachments.length > 0 || attachmentsLoading) && (
          <Box mt={3}>
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

        <Divider sx={{ my: 3 }} />

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

        {/* Smart Replies - AI-generated quick reply suggestions */}
        <SmartReplies
          messageId={message.id}
          onSelectReply={handleSelectSmartReply}
          folder={message.provider_labels.includes('SENT') ? 'sent' : undefined}
          tags={message.tags}
        />

        {/* Metadata */}
        {message.classified_at && (
          <Box mt={3} display="flex" alignItems="center" gap={1}>
            <Typography variant="caption" color="text.secondary">
              Classified on {new Date(message.classified_at).toLocaleString()}
            </Typography>
            {message.confidence !== undefined && message.confidence !== null && (
              <>
                <Typography variant="caption" color="text.secondary">
                  &bull;
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Confidence:
                  </Typography>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Move to Trash?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This message will be moved to Trash. You can restore it from there if needed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMessage.isPending}
          >
            {deleteMessage.isPending ? 'Moving...' : 'Move to Trash'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
