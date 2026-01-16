/**
 * TopBar component - AppBar with search and sync button
 */

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  TextField,
  Box,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Sync as SyncIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useTriggerSync, useSyncStatus } from '../hooks/useStats';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { searchQuery, setSearchQuery, syncStatus } = useAppStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const triggerSync = useTriggerSync();
  const { data: syncStatusData } = useSyncStatus();

  const handleSync = () => {
    triggerSync.mutate({});
  };

  const isSyncing = syncStatus === 'syncing' || syncStatusData?.is_syncing;

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          axios-ai-mail
        </Typography>

        {/* Search */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          {searchOpen ? (
            <TextField
              size="small"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (!searchQuery) {
                  setSearchOpen(false);
                }
              }}
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'white',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            />
          ) : (
            <Tooltip title="Search">
              <IconButton
                color="inherit"
                onClick={() => setSearchOpen(true)}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Sync Button */}
        <Tooltip title={isSyncing ? 'Syncing...' : 'Trigger sync'}>
          <span>
            <IconButton
              color="inherit"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <SyncIcon />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
