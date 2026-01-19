/**
 * Layout component - Main application layout with responsive AppBar and Drawer
 *
 * M3 AMOLED layout: Navigation drawer with stable content margins
 */

import { Box, Drawer, Toolbar, Fab, useTheme } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { OfflineIndicator } from './OfflineIndicator';
import { PullToRefresh } from './PullToRefresh';
import { useAppStore } from '../store/appStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

// M3 Navigation Drawer width (256dp standard)
const DRAWER_WIDTH = 256;
// M3 Content padding (24dp)
const CONTENT_PADDING = 24;

export function Layout() {
  const { drawerOpen, toggleDrawer, setDrawerOpen } = useAppStore();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Close drawer when navigating on mobile
  const handleNavigate = () => {
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  // Close drawer when clicking scrim on mobile
  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  // Handle compose navigation
  const handleCompose = () => {
    navigate('/compose');
  };

  // Hide FAB on compose page
  const showFab = isMobile && location.pathname !== '/compose';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar onMenuClick={toggleDrawer} />
      <OfflineIndicator />

      <Box sx={{ display: 'flex', flex: 1 }}>
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerClose}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
          ModalProps={{
            keepMounted: true,
          }}
        >
          <Toolbar />
          <Sidebar onNavigate={handleNavigate} />
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            // M3: Consistent 24dp padding - content NEVER shifts with drawer
            pt: `${CONTENT_PADDING}px`,
            pb: `${CONTENT_PADDING}px`,
            pl: `${CONTENT_PADDING}px`,
            pr: `${CONTENT_PADDING}px`,
            // M3 Stable Layout: Content stays fixed, drawer overlays
            // No margin shift on drawer toggle
            ml: 0,
            // Ensure content doesn't overflow
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <Toolbar />
          <PullToRefresh>
            <Outlet />
          </PullToRefresh>
        </Box>
      </Box>

      {/* M3 Extended FAB for Compose (mobile only) */}
      {showFab && (
        <Fab
          variant="extended"
          onClick={handleCompose}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            // M3: Primary Container color for FAB
            backgroundColor: isDark ? '#4F378B' : theme.palette.primary.main,
            color: isDark ? '#EADDFF' : '#ffffff',
            '&:hover': {
              backgroundColor: isDark ? '#5E4994' : theme.palette.primary.dark,
            },
            // M3 Extended FAB: 16px border-radius, 56px height
            borderRadius: '16px',
            height: 56,
            px: 2.5,
            // Elevated above content
            zIndex: theme.zIndex.fab,
            // No shadow in AMOLED dark mode
            boxShadow: isDark ? 'none' : undefined,
          }}
        >
          <EditIcon sx={{ mr: 1 }} />
          Compose
        </Fab>
      )}
    </Box>
  );
}
