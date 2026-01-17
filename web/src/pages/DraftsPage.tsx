/**
 * Drafts page - displays list of saved drafts
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
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
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Drafts
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {drafts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No drafts saved
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <List disablePadding>
            {drafts.map((draft, index) => (
              <ListItem
                key={draft.id}
                disablePadding
                divider={index < drafts.length - 1}
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      onClick={(e) => handleDeleteDraft(draft.id, e)}
                      sx={{ mr: 1 }}
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
                          {formatDate(draft.updated_at)}
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
    </Container>
  );
}
