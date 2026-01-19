/**
 * DashboardPage - Main message list view
 * Folder name is shown in sidebar, no need to repeat here
 */

import { Box } from '@mui/material';
import { MessageList } from '../components/MessageList';

export function DashboardPage() {
  return (
    <Box>
      <MessageList />
    </Box>
  );
}
