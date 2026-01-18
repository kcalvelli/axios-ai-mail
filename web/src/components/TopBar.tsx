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
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Sync as SyncIcon,
  Search as SearchIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useTriggerSync, useSyncStatus } from '../hooks/useStats';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, syncStatus } = useAppStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const triggerSync = useTriggerSync();
  const { data: syncStatusData } = useSyncStatus();

  const handleSync = () => {
    triggerSync.mutate({});
  };

  const handleCompose = () => {
    navigate('/compose');
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

        {/* Logo and Title */}
        <Box
          component="a"
          href="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit',
            flexGrow: 1,
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Axios AI Mail"
            sx={{
              height: 36,
              width: 36,
              mr: 1.5,
              borderRadius: 1,
            }}
          />
          <Typography variant="h6" noWrap component="span">
            Axios AI Mail
          </Typography>
        </Box>

        {/* Compose Button */}
        <Button
          variant="contained"
          color="secondary"
          startIcon={<EditIcon />}
          onClick={handleCompose}
          sx={{ mr: 2 }}
        >
          Compose
        </Button>

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

        {/* Theme Toggle */}
        <ThemeToggle />

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
