/**
 * MiniSidebar component - Collapsed navigation rail with icons only
 * Gmail-style collapsed sidebar showing just icons
 */

import { useEffect, useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  Badge,
  Divider,
} from '@mui/material';
import {
  Inbox,
  BarChart,
  Settings,
  AccountCircle,
  Send,
  Delete,
  Drafts,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Rail width for collapsed state (Gmail uses ~68px)
export const RAIL_WIDTH = 68;

interface MiniSidebarProps {
  onNavigate?: () => void;
}

export function MiniSidebar({ onNavigate }: MiniSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Draft count state
  const [draftCount, setDraftCount] = useState(0);

  // Unread count state
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch draft count
  useEffect(() => {
    const fetchDraftCount = async () => {
      try {
        const response = await axios.get('/api/drafts/count');
        setDraftCount(response.data.count);
      } catch (err) {
        console.error('Failed to fetch draft count:', err);
      }
    };

    fetchDraftCount();
    const interval = setInterval(fetchDraftCount, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get('/api/messages/unread-count');
        setUnreadCount(response.data.count);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleNavigation = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const folderItems = [
    { text: 'Inbox', icon: <Inbox />, path: '/', folder: 'inbox', badge: unreadCount },
    { text: 'Drafts', icon: <Drafts />, path: '/drafts', folder: null, badge: draftCount },
    { text: 'Sent', icon: <Send />, path: '/?folder=sent', folder: 'sent', badge: 0 },
    { text: 'Trash', icon: <Delete />, path: '/?folder=trash', folder: 'trash', badge: 0 },
  ];

  const menuItems = [
    { text: 'Accounts', icon: <AccountCircle />, path: '/accounts' },
    { text: 'Statistics', icon: <BarChart />, path: '/stats' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const isFolderSelected = (item: typeof folderItems[0]) => {
    return item.folder === null
      ? location.pathname === item.path
      : location.pathname === '/' && location.search === (item.folder === 'inbox' ? '' : `?folder=${item.folder}`);
  };

  const isMenuSelected = (item: typeof menuItems[0]) => {
    return location.pathname === item.path;
  };

  return (
    <Box
      sx={{
        width: RAIL_WIDTH,
        height: '100%',
        overflow: 'auto',
        py: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {/* Compose button */}
      <Tooltip title="Compose" placement="right">
        <ListItemButton
          onClick={() => handleNavigation('/compose')}
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            justifyContent: 'center',
            mb: 1,
          }}
        >
          <EditIcon />
        </ListItemButton>
      </Tooltip>

      {/* Folders */}
      <List disablePadding sx={{ width: '100%' }}>
        {folderItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ justifyContent: 'center' }}>
            <Tooltip title={item.text} placement="right">
              <ListItemButton
                selected={isFolderSelected(item)}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: 'center',
                  px: 0,
                  mx: 1,
                  borderRadius: 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: 'auto', justifyContent: 'center' }}>
                  {item.badge > 0 ? (
                    <Badge
                      badgeContent={item.badge > 99 ? '99+' : item.badge}
                      color="primary"
                      max={99}
                    >
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1, width: '80%' }} />

      {/* Menu items */}
      <List disablePadding sx={{ width: '100%' }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ justifyContent: 'center' }}>
            <Tooltip title={item.text} placement="right">
              <ListItemButton
                selected={isMenuSelected(item)}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: 'center',
                  px: 0,
                  mx: 1,
                  borderRadius: 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: 'auto', justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
