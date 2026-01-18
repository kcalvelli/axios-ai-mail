/**
 * TopBar component - AppBar with search and sync button
 * Responsive: Adapts layout for mobile screens
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
  Close as CloseIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useTriggerSync, useSyncStatus } from '../hooks/useStats';
import { ThemeToggle } from './ThemeToggle';
import { useIsMobile } from '../hooks/useIsMobile';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useIsMobile();
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

  const handleSearchClose = () => {
    setSearchQuery('');
    setSearchOpen(false);
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
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        {/* Menu button - always visible for sidebar toggle */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: { xs: 1, sm: 2 }, minWidth: 44, minHeight: 44 }}
          aria-label="open drawer"
        >
          <MenuIcon />
        </IconButton>

        {/* Logo and Title - hide title on mobile when search is open */}
        {!(isMobile && searchOpen) && (
          <Box
            component="a"
            href="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              flexGrow: 1,
              minWidth: 0, // Allow shrinking
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="Axios AI Mail"
              sx={{
                height: { xs: 32, sm: 36 },
                width: { xs: 32, sm: 36 },
                mr: { xs: 1, sm: 1.5 },
                borderRadius: 1,
                flexShrink: 0,
              }}
            />
            {/* Hide title on mobile */}
            <Typography
              variant="h6"
              noWrap
              component="span"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              Axios AI Mail
            </Typography>
          </Box>
        )}

        {/* Search - expands to full width on mobile when open */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mr: { xs: 0.5, sm: 2 },
            flexGrow: isMobile && searchOpen ? 1 : 0,
          }}
        >
          {searchOpen ? (
            <TextField
              size="small"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (!searchQuery && !isMobile) {
                  setSearchOpen(false);
                }
              }}
              autoFocus
              fullWidth={isMobile}
              sx={{
                width: isMobile ? '100%' : 200,
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
              InputProps={{
                endAdornment: isMobile ? (
                  <IconButton
                    size="small"
                    onClick={handleSearchClose}
                    sx={{ color: 'inherit' }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                ) : null,
              }}
            />
          ) : (
            <Tooltip title="Search">
              <IconButton
                color="inherit"
                onClick={() => setSearchOpen(true)}
                sx={{ minWidth: 44, minHeight: 44 }}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Hide other buttons when search is expanded on mobile */}
        {!(isMobile && searchOpen) && (
          <>
            {/* Compose Button - icon only on mobile */}
            {isMobile ? (
              <Tooltip title="Compose">
                <IconButton
                  color="inherit"
                  onClick={handleCompose}
                  sx={{ minWidth: 44, minHeight: 44 }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<EditIcon />}
                onClick={handleCompose}
                sx={{ mr: 2 }}
              >
                Compose
              </Button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Sync Button */}
            <Tooltip title={isSyncing ? 'Syncing...' : 'Trigger sync'}>
              <span>
                <IconButton
                  color="inherit"
                  onClick={handleSync}
                  disabled={isSyncing}
                  sx={{ minWidth: 44, minHeight: 44 }}
                >
                  {isSyncing ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <SyncIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
