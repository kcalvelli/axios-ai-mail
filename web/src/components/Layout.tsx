/**
 * Layout component - Main application layout with AppBar and Drawer
 */

import { Box, Toolbar } from '@mui/material';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { useAppStore } from '../store/appStore';
import { Outlet } from 'react-router-dom';

const DRAWER_WIDTH = 280;

export function Layout() {
  const { drawerOpen, toggleDrawer } = useAppStore();

  return (
    <Box sx={{ display: 'flex' }}>
      <TopBar onMenuClick={toggleDrawer} />

      <Sidebar open={drawerOpen} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : 0}px)` },
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
