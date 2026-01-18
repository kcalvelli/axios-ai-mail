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
  useTheme,
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
  const theme = useTheme();
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
  const isDark = theme.palette.mode === 'dark';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: isDark ? '#000000' : '#ffffff',
        color: isDark ? '#ffffff' : theme.palette.primary.main,
        borderBottom: isDark
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(0, 0, 0, 0.12)',
      }}
    >
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
                  color: isDark ? 'white' : theme.palette.text.primary,
                  '& fieldset': {
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: isDark ? 'white' : theme.palette.primary.main,
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
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
