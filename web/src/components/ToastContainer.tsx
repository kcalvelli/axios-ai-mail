/**
 * ToastContainer component - Displays toast notifications
 */

import { Snackbar, Alert, Button } from '@mui/material';
import { useToastStore } from '../hooks/useToast';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <>
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={true}
          autoHideDuration={toast.action ? null : 6000}
          onClose={() => removeToast(toast.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ bottom: { xs: 80 + index * 70, sm: 80 + index * 70 } }}
        >
          <Alert
            onClose={() => removeToast(toast.id)}
            severity={toast.severity}
            sx={{ width: '100%' }}
            action={
              toast.action ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    toast.action?.onClick();
                    removeToast(toast.id);
                  }}
                >
                  {toast.action.label}
                </Button>
              ) : undefined
            }
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}
