/**
 * OfflineIndicator - Shows when the user is offline
 */

import { Alert, Collapse } from '@mui/material';
import { WifiOff } from '@mui/icons-material';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <Collapse in={!isOnline}>
      <Alert
        severity="warning"
        icon={<WifiOff />}
        sx={{
          borderRadius: 0,
          '& .MuiAlert-message': {
            width: '100%',
            textAlign: 'center',
          },
        }}
      >
        You're offline. Some features may be unavailable.
      </Alert>
    </Collapse>
  );
}
