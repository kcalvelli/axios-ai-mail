import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  TextField,
  Typography,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  FormatBold as BoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberedListIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import axios from 'axios';

interface Account {
  id: string;
  name: string;
  email: string;
}

interface Attachment {
  id: string;
  filename: string;
  size: number;
  content_type: string;
}

export default function Compose() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get query parameters for reply/forward context
  const replyTo = searchParams.get('reply_to');
  const threadId = searchParams.get('thread_id');
  const existingDraftId = searchParams.get('draft_id');
  const defaultSubject = searchParams.get('subject') || '';
  const defaultTo = searchParams.get('to') || '';
  const defaultAccountId = searchParams.get('account_id') || '';
  const quoteFrom = searchParams.get('quote_from') || '';
  const quoteDate = searchParams.get('quote_date') || '';
  const defaultBody = searchParams.get('body') || ''; // Pre-filled body (e.g., from smart replies)

  // Account state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Form state
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  // Draft and attachment state
  const [draftId, setDraftId] = useState<string | null>(existingDraftId);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(!!existingDraftId);

  // Auto-save and dirty tracking state
  const [savingDraft, setSavingDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const lastSavedContentRef = useRef<string>('');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rich text editor - declared early so it can be used in effects
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Compose your message...',
      }),
    ],
    content: '',
    autofocus: !existingDraftId, // Don't autofocus if loading a draft
  });

  // Fetch accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axios.get('/api/accounts');
        // API returns array directly, not { accounts: [...] }
        const accountList = Array.isArray(response.data) ? response.data : [];
        setAccounts(accountList);
        if (accountList.length > 0 && !selectedAccountId) {
          // Use the account from the original message if replying, otherwise first account
          if (defaultAccountId && accountList.some((a: Account) => a.id === defaultAccountId)) {
            setSelectedAccountId(defaultAccountId);
          } else {
            setSelectedAccountId(accountList[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
        setError('Failed to load accounts');
      }
    };
    fetchAccounts();
  }, []);

  // Load existing draft if draft_id is provided
  useEffect(() => {
    const loadDraft = async () => {
      if (!existingDraftId || !editor) return;

      try {
        setLoadingDraft(true);
        const response = await axios.get(`/api/drafts/${existingDraftId}`);
        const draft = response.data;

        setTo(draft.to_emails?.join(', ') || '');
        setCc(draft.cc_emails?.join(', ') || '');
        setBcc(draft.bcc_emails?.join(', ') || '');
        setSubject(draft.subject || '');
        setSelectedAccountId(draft.account_id);
        setShowCc(!!(draft.cc_emails && draft.cc_emails.length > 0));
        setShowBcc(!!(draft.bcc_emails && draft.bcc_emails.length > 0));

        // Set editor content
        if (draft.body_html) {
          editor.commands.setContent(draft.body_html);
        }

        // Load attachments
        try {
          const attachResponse = await axios.get(`/api/attachments/drafts/${existingDraftId}/attachments`);
          setAttachments(attachResponse.data);
        } catch {
          // No attachments or failed to load
        }
      } catch (err) {
        console.error('Failed to load draft:', err);
        setError('Failed to load draft');
      } finally {
        setLoadingDraft(false);
      }
    };

    loadDraft();
  }, [existingDraftId, editor]);

  // Load original message for reply quote
  useEffect(() => {
    const loadQuote = async () => {
      // Only load quote if replying (not editing a draft) and editor is ready
      if (!replyTo || existingDraftId || !editor || !quoteFrom) return;

      try {
        // Fetch the original message body
        const response = await axios.get(`/api/messages/${replyTo}/body`);
        const originalBody = response.data.body_html || response.data.body_text || '';

        // Format the quote date
        const formattedDate = quoteDate
          ? new Date(quoteDate).toLocaleString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
          : '';

        // Build quoted reply (reply above, quote below)
        const quoteHeader = `<p><br></p><p>On ${formattedDate}, ${quoteFrom} wrote:</p>`;
        const quotedContent = `<blockquote style="border-left: 2px solid #ccc; margin-left: 0; padding-left: 1em; color: #666;">${originalBody}</blockquote>`;

        // If there's a pre-filled body (e.g., from smart replies), include it above the quote
        const prefilledContent = defaultBody ? `<p>${defaultBody}</p>` : '<p><br></p>';

        editor.commands.setContent(`${prefilledContent}${quoteHeader}${quotedContent}`);
        // Move cursor to the end of the pre-filled content for editing
        editor.commands.focus('start');
      } catch (err) {
        console.error('Failed to load original message for quote:', err);
        // If quote fails but we have a pre-filled body, still set it
        if (defaultBody) {
          editor.commands.setContent(`<p>${defaultBody}</p>`);
          editor.commands.focus('end');
        }
      }
    };

    loadQuote();
  }, [replyTo, existingDraftId, editor, quoteFrom, quoteDate, defaultBody]);

  // Parse email addresses from comma-separated string
  const parseEmails = (emailString: string): string[] => {
    return emailString
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  };

  // Get current content hash for dirty checking
  const getCurrentContentHash = useCallback(() => {
    const htmlContent = editor?.getHTML() || '';
    return JSON.stringify({ to, cc, bcc, subject, body: htmlContent, accountId: selectedAccountId });
  }, [editor, to, cc, bcc, subject, selectedAccountId]);

  // Check if content has changed
  const checkDirty = useCallback(() => {
    const currentContent = getCurrentContentHash();
    const dirty = currentContent !== lastSavedContentRef.current;
    setIsDirty(dirty);
    return dirty;
  }, [getCurrentContentHash]);

  // Create or update draft
  const saveDraft = useCallback(async (showStatus = false): Promise<string | null> => {
    // Allow partial drafts - only require account
    if (!selectedAccountId) return null;

    const htmlContent = editor?.getHTML() || '';
    const textContent = editor?.getText() || '';

    // Don't save if content is completely empty
    if (!to && !subject && !textContent.trim()) return null;

    const draftData = {
      account_id: selectedAccountId,
      subject: subject || '',
      to_emails: parseEmails(to),
      cc_emails: showCc ? parseEmails(cc) : undefined,
      bcc_emails: showBcc ? parseEmails(bcc) : undefined,
      body_html: htmlContent,
      body_text: textContent,
      thread_id: threadId || undefined,
      in_reply_to: replyTo || undefined,
    };

    if (showStatus) setSavingDraft(true);

    try {
      let savedDraftId = draftId;

      if (draftId) {
        // Update existing draft
        await axios.patch(`/api/drafts/${draftId}`, draftData);
      } else {
        // Create new draft
        const response = await axios.post('/api/drafts', draftData);
        savedDraftId = response.data.id;
        setDraftId(savedDraftId);
      }

      // Update last saved state
      lastSavedContentRef.current = getCurrentContentHash();
      setLastSavedAt(new Date());
      setIsDirty(false);

      return savedDraftId;
    } catch (err) {
      console.error('Failed to save draft:', err);
      if (showStatus) setError('Failed to save draft');
      return null;
    } finally {
      if (showStatus) setSavingDraft(false);
    }
  }, [selectedAccountId, editor, to, subject, cc, bcc, showCc, showBcc, threadId, replyTo, draftId, getCurrentContentHash]);

  // Explicit save draft handler
  const handleSaveDraft = async () => {
    const saved = await saveDraft(true);
    if (saved) {
      // Show brief success state (clear error if any)
      setError(null);
    }
  };

  // Auto-save effect
  useEffect(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Only auto-save if there's content and changes
    if (!selectedAccountId || loadingDraft) return;

    const hasContent = to || subject || editor?.getText()?.trim();
    if (!hasContent) return;

    // Check for changes and schedule auto-save
    if (checkDirty()) {
      autoSaveTimerRef.current = setTimeout(() => {
        saveDraft(false);
      }, 30000); // 30 seconds
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [to, cc, bcc, subject, editor?.getHTML(), selectedAccountId, loadingDraft, checkDirty, saveDraft]);

  // Browser beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Ensure draft is created first
    if (!draftId) {
      await saveDraft();
      if (!draftId) {
        setError('Please fill in recipient and subject before adding attachments');
        return;
      }
    }

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(
          `/api/attachments/drafts/${draftId}/attachments`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        setAttachments(prev => [...prev, response.data]);
      }
    } catch (err) {
      console.error('Failed to upload attachment:', err);
      setError('Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  // Remove attachment
  const removeAttachment = async (attachmentId: string) => {
    try {
      await axios.delete(`/api/attachments/${attachmentId}`);
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
    } catch (err) {
      console.error('Failed to remove attachment:', err);
      setError('Failed to remove attachment');
    }
  };

  // Send message
  const handleSend = async () => {
    if (!to || !subject) {
      setError('Please fill in recipient and subject');
      return;
    }

    if (!selectedAccountId) {
      setError('Please select an account to send from');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Always save draft before sending to capture latest body content
      const currentDraftId = await saveDraft();

      if (!currentDraftId) {
        setError('Failed to create draft');
        setSending(false);
        return;
      }

      // Send the draft
      await axios.post('/api/send', { draft_id: currentDraftId });
      setSuccess(true);

      // Redirect to inbox after short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.response?.data?.detail || 'Failed to send message');
      setSending(false);
    }
  };

  // Handle close/discard - check for unsaved changes
  const handleCloseClick = () => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      navigate('/');
    }
  };

  // Discard draft and navigate away
  const handleDiscardConfirm = async () => {
    if (draftId) {
      try {
        await axios.delete(`/api/drafts/${draftId}`);
      } catch (err) {
        console.error('Failed to delete draft:', err);
      }
    }
    setShowDiscardDialog(false);
    navigate('/');
  };

  // Save and close
  const handleSaveAndClose = async () => {
    await saveDraft(true);
    setShowDiscardDialog(false);
    navigate('/');
  };

  // Format last saved time
  const formatLastSaved = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!editor || loadingDraft) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h5">
              {existingDraftId ? 'Edit Draft' : 'New Message'}
            </Typography>
            {/* Save status indicator */}
            {savingDraft && (
              <Typography variant="caption" color="text.secondary">
                Saving...
              </Typography>
            )}
            {!savingDraft && lastSavedAt && (
              <Typography variant="caption" color="text.secondary">
                Saved at {formatLastSaved(lastSavedAt)}
              </Typography>
            )}
            {isDirty && !savingDraft && (
              <Typography variant="caption" color="warning.main">
                Unsaved changes
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleCloseClick} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Message sent successfully!
          </Alert>
        )}

        {/* From (account selector) */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="from-account-label">From</InputLabel>
          <Select
            labelId="from-account-label"
            value={selectedAccountId}
            label="From"
            onChange={(e) => setSelectedAccountId(e.target.value)}
          >
            {accounts.map(account => (
              <MenuItem key={account.id} value={account.id}>
                {account.email}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* To field */}
        <TextField
          fullWidth
          label="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="recipient@example.com"
          sx={{ mb: 2 }}
          onBlur={() => saveDraft()}
        />

        {/* Cc/Bcc toggle */}
        {!showCc && !showBcc && (
          <Box sx={{ mb: 2 }}>
            <Button size="small" onClick={() => setShowCc(true)}>
              + Cc
            </Button>
            <Button size="small" onClick={() => setShowBcc(true)}>
              + Bcc
            </Button>
          </Box>
        )}

        {/* Cc field */}
        {showCc && (
          <TextField
            fullWidth
            label="Cc"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="cc@example.com"
            sx={{ mb: 2 }}
            onBlur={() => saveDraft()}
          />
        )}

        {/* Bcc field */}
        {showBcc && (
          <TextField
            fullWidth
            label="Bcc"
            value={bcc}
            onChange={(e) => setBcc(e.target.value)}
            placeholder="bcc@example.com"
            sx={{ mb: 2 }}
            onBlur={() => saveDraft()}
          />
        )}

        {/* Subject field */}
        <TextField
          fullWidth
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          sx={{ mb: 2 }}
          onBlur={() => saveDraft()}
        />

        {/* Rich text editor toolbar */}
        <Paper variant="outlined" sx={{ mb: 2 }}>
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
            <Tooltip title="Bold">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleBold().run()}
                color={editor.isActive('bold') ? 'primary' : 'default'}
              >
                <BoldIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                color={editor.isActive('italic') ? 'primary' : 'default'}
              >
                <FormatItalicIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Bullet List">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                color={editor.isActive('bulletList') ? 'primary' : 'default'}
              >
                <BulletListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Numbered List">
              <IconButton
                size="small"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                color={editor.isActive('orderedList') ? 'primary' : 'default'}
              >
                <NumberedListIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Editor content */}
          <Box
            sx={{
              minHeight: 300,
              cursor: 'text',
              '& .ProseMirror': {
                minHeight: 300,
                padding: 2,
                outline: 'none',
                '&:focus': {
                  outline: 'none',
                },
                '& p': {
                  margin: 0,
                  marginBottom: 1,
                },
                '& p.is-editor-empty:first-child::before': {
                  content: 'attr(data-placeholder)',
                  color: 'text.disabled',
                  float: 'left',
                  height: 0,
                  pointerEvents: 'none',
                },
              },
            }}
            onClick={() => editor?.chain().focus().run()}
          >
            <EditorContent editor={editor} />
          </Box>
        </Paper>

        {/* Attachments */}
        {attachments.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {attachments.map(att => (
              <Chip
                key={att.id}
                label={`${att.filename} (${formatFileSize(att.size)})`}
                onDelete={() => removeAttachment(att.id)}
                size="small"
              />
            ))}
          </Stack>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Button
              variant="contained"
              startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
              onClick={handleSend}
              disabled={sending || !to || !subject}
              sx={{ mr: 1 }}
            >
              {sending ? 'Sending...' : 'Send'}
            </Button>

            <Button
              variant="outlined"
              startIcon={savingDraft ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSaveDraft}
              disabled={savingDraft || !selectedAccountId}
              sx={{ mr: 1 }}
            >
              {savingDraft ? 'Saving...' : 'Save Draft'}
            </Button>

            <Button
              component="label"
              startIcon={uploading ? <CircularProgress size={20} /> : <AttachFileIcon />}
              disabled={uploading}
            >
              Attach
              <input
                type="file"
                hidden
                multiple
                onChange={handleFileUpload}
              />
            </Button>
          </Box>

          <Button variant="outlined" color="error" onClick={handleCloseClick}>
            Discard
          </Button>
        </Box>

        {/* Unsaved changes confirmation dialog */}
        <Dialog open={showDiscardDialog} onClose={() => setShowDiscardDialog(false)}>
          <DialogTitle>Unsaved Changes</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You have unsaved changes. Would you like to save your draft before closing?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDiscardDialog(false)}>Cancel</Button>
            <Button onClick={handleDiscardConfirm} color="error">
              Discard
            </Button>
            <Button onClick={handleSaveAndClose} variant="contained">
              Save Draft
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}
