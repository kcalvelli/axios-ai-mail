/**
 * DashboardPage - Main message list view
 */

import { Box, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { MessageList } from '../components/MessageList';

export function DashboardPage() {
  const [searchParams] = useSearchParams();
  const folder = searchParams.get('folder') || 'inbox';

  // Capitalize first letter for display
  const folderDisplay = folder.charAt(0).toUpperCase() + folder.slice(1);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        {folderDisplay}
      </Typography>
      <MessageList />
    </Box>
  );
}
