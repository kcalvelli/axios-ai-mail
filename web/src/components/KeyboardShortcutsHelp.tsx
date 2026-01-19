/**
 * KeyboardShortcutsHelp - Modal showing available keyboard shortcuts
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Chip,
  IconButton,
  useTheme,
} from '@mui/material';
import { Close, Keyboard } from '@mui/icons-material';
import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardNavigation';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: isDark ? '#1E1E1E' : 'background.paper',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Keyboard />
        Keyboard Shortcuts
        <Box flex={1} />
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {KEYBOARD_SHORTCUTS.map((category) => (
          <Box key={category.category} sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}
            >
              {category.category}
            </Typography>
            {category.shortcuts.map((shortcut) => (
              <Box
                key={shortcut.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 0.75,
                  borderBottom: `1px solid ${isDark ? '#333' : '#eee'}`,
                }}
              >
                <Typography variant="body2">{shortcut.description}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {shortcut.key.split(' / ').map((key) => (
                    <Chip
                      key={key}
                      label={key}
                      size="small"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        height: 24,
                        bgcolor: isDark ? '#333' : '#f0f0f0',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        ))}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Press <Chip label="?" size="small" sx={{ height: 20, fontSize: '0.7rem' }} /> anytime to
          toggle this help
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
