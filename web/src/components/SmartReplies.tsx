/**
 * SmartReplies - AI-generated reply suggestions component
 */

import { Box, Chip, Typography, Skeleton, Stack } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { useSmartReplies } from '../hooks/useMessages';

interface SmartRepliesProps {
  messageId: string;
  onSelectReply: (text: string) => void;
  folder?: string;
  tags?: string[];
}

export function SmartReplies({ messageId, onSelectReply, folder, tags = [] }: SmartRepliesProps) {
  // Don't show for sent messages or newsletters/junk (checked frontend-side for faster UX)
  const skipTags = ['newsletter', 'junk'];
  const shouldSkip = folder === 'sent' || tags.some(tag => skipTags.includes(tag));

  const { data, isLoading, error, isFetching } = useSmartReplies(messageId, !shouldSkip);

  // Debug logging
  console.log('SmartReplies render:', {
    messageId,
    folder,
    tags,
    shouldSkip,
    isLoading,
    isFetching,
    error: error ? String(error) : null,
    dataReplies: data?.replies?.length ?? 'no data',
  });

  // Don't render anything if we should skip, have an error, or have no replies
  if (shouldSkip || error || (!isLoading && (!data || data.replies.length === 0))) {
    return null;
  }

  return (
    <Box mt={3}>
      {/* Section Header */}
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <AutoAwesome fontSize="small" sx={{ color: 'primary.main', opacity: 0.8 }} />
        <Typography variant="subtitle2" color="text.secondary">
          Quick Replies
        </Typography>
        <Typography
          variant="caption"
          sx={{
            backgroundColor: 'action.hover',
            px: 0.75,
            py: 0.25,
            borderRadius: 1,
            color: 'text.secondary',
            fontSize: '0.65rem',
          }}
        >
          AI
        </Typography>
      </Box>

      {/* Loading Skeleton */}
      {isLoading && (
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          <Skeleton variant="rounded" width={140} height={32} />
          <Skeleton variant="rounded" width={180} height={32} />
          <Skeleton variant="rounded" width={120} height={32} />
        </Stack>
      )}

      {/* Reply Chips */}
      {!isLoading && data && (
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          {data.replies.map((reply) => (
            <Chip
              key={reply.id}
              label={reply.text}
              variant="outlined"
              onClick={() => onSelectReply(reply.text)}
              sx={{
                cursor: 'pointer',
                maxWidth: '100%',
                height: 'auto',
                '& .MuiChip-label': {
                  whiteSpace: 'normal',
                  py: 0.75,
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'primary.main',
                },
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
