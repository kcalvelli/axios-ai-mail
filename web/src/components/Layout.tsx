/**
 * Layout component - Main application layout with responsive AppBar and Drawer
 */

import { Box, Drawer, Toolbar } from '@mui/material';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { OfflineIndicator } from './OfflineIndicator';
import { useAppStore } from '../store/appStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { Outlet } from 'react-router-dom';

const DRAWER_WIDTH = 280;

export function Layout() {
  const { drawerOpen, toggleDrawer, setDrawerOpen } = useAppStore();
  const isMobile = useIsMobile();

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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar onMenuClick={toggleDrawer} />
      <OfflineIndicator />

      <Box sx={{ display: 'flex', flex: 1 }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={drawerOpen}
          onClose={handleDrawerClose}
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
          // Enable swipe to open on mobile
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
        >
          <Toolbar />
          <Sidebar onNavigate={handleNavigate} />
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1, sm: 2, md: 3 },
            // On mobile: always full width
            // On desktop: account for sidebar when open
            width: isMobile
              ? '100%'
              : `calc(100% - ${drawerOpen ? DRAWER_WIDTH : 0}px)`,
            ml: isMobile ? 0 : (drawerOpen ? `${DRAWER_WIDTH}px` : 0),
            transition: (theme) =>
              theme.transitions.create(['width', 'margin-left'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
          }}
        >
          <Toolbar />
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
