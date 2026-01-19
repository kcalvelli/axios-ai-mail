/**
 * Sidebar component - Navigation and filters
 */

import { useEffect, useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  CircularProgress,
  FormControlLabel,
  Switch,
  Badge,
} from '@mui/material';
import {
  Inbox,
  BarChart,
  Settings,
  AccountCircle,
  Send,
  Delete,
  Drafts,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { TagChip } from './TagChip';
import { useTags } from '../hooks/useStats';
import { useAppStore } from '../store/appStore';
import axios from 'axios';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: tagsData, isLoading } = useTags();
  const {
    selectedTags,
    toggleTag,
    clearTags,
    isUnreadOnly,
    setIsUnreadOnly,
  } = useAppStore();

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

    // Refresh count periodically and when navigating
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

    // Refresh count periodically
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Handle navigation with optional callback for mobile
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

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        py: 1,
        px: 1.5, // 12px padding - Material Design standard
        boxSizing: 'border-box',
        // Hide scrollbar while keeping scroll functionality
        scrollbarWidth: 'none', // Firefox
        '&::-webkit-scrollbar': { display: 'none' }, // Chrome/Safari
      }}
    >
      {/* Folders */}
      <List disablePadding>
        {folderItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={
                item.folder === null
                  ? location.pathname === item.path
                  : location.pathname === '/' && location.search === (item.folder === 'inbox' ? '' : `?folder=${item.folder}`)
              }
              onClick={() => handleNavigation(item.path)}
              sx={{ minHeight: 48, px: 1 }} // Touch-friendly height, tighter padding
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
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
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Navigation */}
      <List disablePadding>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{ minHeight: 48, px: 1 }} // Touch-friendly height, tighter padding
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Filters */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Filters
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={isUnreadOnly}
            onChange={(e) => setIsUnreadOnly(e.target.checked)}
            size="small"
          />
        }
        label="Unread only"
        sx={{ mb: 2 }}
      />

      <Divider sx={{ my: 2 }} />

      {/* Tags */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography variant="subtitle2" color="text.secondary">
          Tags
        </Typography>
        {selectedTags.length > 0 && (
          <Typography
            variant="caption"
            color="primary"
            sx={{ cursor: 'pointer' }}
            onClick={clearTags}
          >
            Clear
          </Typography>
        )}
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress size={24} />
        </Box>
      ) : tagsData && tagsData.tags.length > 0 ? (
        <Box display="flex" flexDirection="column" gap={1}>
          {tagsData.tags.map((tag) => (
            <Box
              key={tag.name}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <TagChip
                tag={tag.name}
                onClick={() => toggleTag(tag.name)}
                size="small"
                selected={selectedTags.includes(tag.name)}
                isAccountTag={tag.type === 'account'}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ flexShrink: 0 }}
              >
                {tag.count}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No tags yet
        </Typography>
      )}
    </Box>
  );
}
