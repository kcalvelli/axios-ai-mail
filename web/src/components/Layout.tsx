/**
 * Layout component - Main application layout with responsive AppBar and Drawer
 *
 * Desktop: Gmail-style persistent sidebar (expanded/collapsed rail)
 * Mobile: Temporary overlay drawer
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
const DRAWER_WIDTH_EXPANDED = 256;
const DRAWER_WIDTH_COLLAPSED = 68;
// M3 Content padding (24dp)
const CONTENT_PADDING = 24;
// Transition duration (match Sidebar)
const TRANSITION_DURATION = 225;

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

  // Show FAB on all pages except compose (both mobile and desktop)
  const showFab = location.pathname !== '/compose';

  // Desktop sidebar width based on expanded/collapsed state
  const desktopSidebarWidth = drawerOpen ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar onMenuClick={toggleDrawer} />
      <OfflineIndicator />

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Mobile: Temporary overlay drawer */}
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={drawerOpen}
            onClose={handleDrawerClose}
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH_EXPANDED,
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
        ) : (
          /* Desktop: Persistent sidebar with smooth collapse transition */
          <Box
            component="nav"
            sx={{
              width: desktopSidebarWidth,
              flexShrink: 0,
              transition: `width ${TRANSITION_DURATION}ms ease`,
            }}
          >
            <Drawer
              variant="permanent"
              open
              sx={{
                '& .MuiDrawer-paper': {
                  width: desktopSidebarWidth,
                  boxSizing: 'border-box',
                  transition: `width ${TRANSITION_DURATION}ms ease`,
                  overflowX: 'hidden',
                },
              }}
            >
              <Toolbar />
              <Sidebar onNavigate={handleNavigate} collapsed={!drawerOpen} />
            </Drawer>
          </Box>
        )}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            // M3: Consistent 24dp padding
            pt: `${CONTENT_PADDING}px`,
            pb: `${CONTENT_PADDING}px`,
            pl: `${CONTENT_PADDING}px`,
            pr: `${CONTENT_PADDING}px`,
            // Content naturally fills remaining space
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

      {/* M3 FAB for Compose - icon only pill shape */}
      {showFab && (
        <Fab
          onClick={handleCompose}
          aria-label="Compose new email"
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
            // M3 FAB: pill shape (fully rounded), 56px height
            borderRadius: '16px',
            width: 56,
            height: 56,
            // Elevated above content
            zIndex: theme.zIndex.fab,
            // No shadow in AMOLED dark mode
            boxShadow: isDark ? 'none' : undefined,
          }}
        >
          <EditIcon />
        </Fab>
      )}
    </Box>
  );
}
