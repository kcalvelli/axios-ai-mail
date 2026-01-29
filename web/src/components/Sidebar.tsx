/**
 * Sidebar component - Navigation and filters
 */

import { useEffect } from 'react';
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
  Tooltip,
  Collapse,
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
import { useTags, useUnreadCount, useDraftCount, useActionTagNames } from '../hooks/useStats';
import { useAppStore } from '../store/appStore';

interface SidebarProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export function Sidebar({ onNavigate, collapsed = false }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: tagsData, isLoading } = useTags();
  const { data: unreadCountData } = useUnreadCount();
  const { data: draftCountData } = useDraftCount();
  const actionTagNames = useActionTagNames();
  const {
    selectedTags,
    toggleTag,
    clearTags,
    removeInvalidTags,
    isUnreadOnly,
    setIsUnreadOnly,
  } = useAppStore();

  // Get counts from React Query data (with fallback to 0)
  const unreadCount = unreadCountData?.count ?? 0;
  const draftCount = draftCountData?.count ?? 0;

  // Auto-deselect tags that no longer exist (e.g., after all messages with that tag are deleted)
  useEffect(() => {
    if (tagsData && selectedTags.length > 0) {
      const availableTagNames = tagsData.tags.map((tag) => tag.name);
      removeInvalidTags(availableTagNames);
    }
  }, [tagsData, selectedTags.length, removeInvalidTags]);

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

  // Transition duration for smooth collapse
  const transitionDuration = 225;

  const renderIcon = (item: typeof folderItems[0]) => {
    const icon = item.badge && item.badge > 0 ? (
      <Badge
        badgeContent={item.badge > 99 ? '99+' : item.badge}
        color="primary"
        max={99}
      >
        {item.icon}
      </Badge>
    ) : (
      item.icon
    );

    return collapsed ? (
      <Tooltip title={item.text} placement="right">
        <ListItemIcon
          sx={{
            minWidth: collapsed ? 'auto' : 36,
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: `all ${transitionDuration}ms ease`,
          }}
        >
          {icon}
        </ListItemIcon>
      </Tooltip>
    ) : (
      <ListItemIcon
        sx={{
          minWidth: 36,
          transition: `all ${transitionDuration}ms ease`,
        }}
      >
        {icon}
      </ListItemIcon>
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        py: 1,
        px: collapsed ? 1 : 1.5,
        boxSizing: 'border-box',
        transition: `padding ${transitionDuration}ms ease`,
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
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
              sx={{
                minHeight: 48,
                px: 1,
                justifyContent: collapsed ? 'center' : 'flex-start',
                transition: `all ${transitionDuration}ms ease`,
              }}
            >
              {renderIcon(item)}
              <ListItemText
                primary={item.text}
                sx={{
                  opacity: collapsed ? 0 : 1,
                  width: collapsed ? 0 : 'auto',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  transition: `opacity ${transitionDuration}ms ease, width ${transitionDuration}ms ease`,
                }}
              />
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
              sx={{
                minHeight: 48,
                px: 1,
                justifyContent: collapsed ? 'center' : 'flex-start',
                transition: `all ${transitionDuration}ms ease`,
              }}
            >
              {collapsed ? (
                <Tooltip title={item.text} placement="right">
                  <ListItemIcon sx={{ minWidth: 'auto', justifyContent: 'center' }}>
                    {item.icon}
                  </ListItemIcon>
                </Tooltip>
              ) : (
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              )}
              <ListItemText
                primary={item.text}
                sx={{
                  opacity: collapsed ? 0 : 1,
                  width: collapsed ? 0 : 'auto',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  transition: `opacity ${transitionDuration}ms ease, width ${transitionDuration}ms ease`,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Collapsible sections - hidden when collapsed */}
      <Collapse in={!collapsed} timeout={transitionDuration}>
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
                  isActionTag={actionTagNames.has(tag.name)}
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
      </Collapse>
    </Box>
  );
}
