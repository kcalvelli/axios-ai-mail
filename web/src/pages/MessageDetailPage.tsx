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
} from '@mui/material';
import { ArrowBack, Mail, MailOutline } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMessage, useUpdateTags, useMarkRead } from '../hooks/useMessages';
import { useTags } from '../hooks/useStats';
import { TagChip } from '../components/TagChip';

export function MessageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: message, isLoading, error } = useMessage(id!);
  const { data: tagsData } = useTags();
  const updateTags = useUpdateTags();
  const markRead = useMarkRead();

  const [editingTags, setEditingTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
        <IconButton onClick={handleMarkRead}>
          {message.is_unread ? (
            <Mail color="primary" />
          ) : (
            <MailOutline color="action" />
          )}
        </IconButton>
      </Box>

      {/* Message Details */}
      <Paper sx={{ p: 3 }}>
        {/* Subject */}
        <Typography variant="h6" gutterBottom>
          {message.subject}
        </Typography>

        {/* From */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>From:</strong> {message.from_email}
        </Typography>

        {/* To */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>To:</strong> {message.to_emails.join(', ')}
        </Typography>

        {/* Date */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>Date:</strong> {formatDate(message.date)}
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

        {/* Message Body (Snippet) */}
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Preview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {message.snippet}
          </Typography>
        </Box>

        {/* Metadata */}
        {message.classified_at && (
          <Box mt={3}>
            <Typography variant="caption" color="text.secondary">
              Classified on {new Date(message.classified_at).toLocaleString()}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
