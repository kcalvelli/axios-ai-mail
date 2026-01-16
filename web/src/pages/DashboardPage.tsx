/**
 * DashboardPage - Main message list view
 */

import { Box, Typography } from '@mui/material';
import { MessageList } from '../components/MessageList';

export function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Inbox
      </Typography>
      <MessageList />
    </Box>
  );
}
