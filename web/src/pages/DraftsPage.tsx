/**
 * Drafts page - displays list of saved drafts
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

interface Draft {
  id: string;
  account_id: string;
  subject: string;
  to_emails: string[];
  body_text: string | null;
  created_at: string;
  updated_at: string;
}

export default function DraftsPage() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/drafts');
      setDrafts(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch drafts:', err);
      setError('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDraft = (draft: Draft) => {
    // Navigate to compose with draft data
    const params = new URLSearchParams({
      draft_id: draft.id,
      to: draft.to_emails.join(', '),
      subject: draft.subject,
    });
    navigate(`/compose?${params.toString()}`);
  };

  const handleDeleteDraft = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/drafts/${draftId}`);
      setDrafts(prev => prev.filter(d => d.id !== draftId));
    } catch (err) {
      console.error('Failed to delete draft:', err);
      setError('Failed to delete draft');
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Sort drafts by updated_at descending (most recent first)
  const sortedDrafts = [...drafts].sort((a, b) =>
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  const getSnippet = (text: string | null) => {
    if (!text) return '(No content)';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Drafts
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {sortedDrafts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" gutterBottom>
            No drafts saved
          </Typography>
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer', mt: 1 }}
            onClick={() => navigate('/compose')}
          >
            Start composing a new message
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <List disablePadding>
            {sortedDrafts.map((draft, index) => (
              <ListItem
                key={draft.id}
                disablePadding
                divider={index < sortedDrafts.length - 1}
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      onClick={(e) => handleDeleteDraft(draft.id, e)}
                      sx={{ mr: 1 }}
                      title="Delete draft"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemButton onClick={() => handleEditDraft(draft)}>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" noWrap sx={{ maxWidth: '60%' }}>
                          {draft.subject || '(No subject)'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatRelativeTime(draft.updated_at)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          To: {draft.to_emails.join(', ') || '(No recipients)'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {getSnippet(draft.body_text)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
