/**
 * Sidebar component - Navigation and filters
 */

import {
  Drawer,
  Toolbar,
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
} from '@mui/material';
import {
  Inbox,
  BarChart,
  Settings,
  AccountCircle,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { TagChip } from './TagChip';
import { useTags } from '../hooks/useStats';
import { useAppStore } from '../store/appStore';

const DRAWER_WIDTH = 280;

interface SidebarProps {
  open: boolean;
}

export function Sidebar({ open }: SidebarProps) {
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

  const menuItems = [
    { text: 'Inbox', icon: <Inbox />, path: '/' },
    { text: 'Accounts', icon: <AccountCircle />, path: '/accounts' },
    { text: 'Statistics', icon: <BarChart />, path: '/stats' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />

      <Box sx={{ overflow: 'auto', p: 2 }}>
        {/* Navigation */}
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
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
                />
                <Typography variant="caption" color="text.secondary">
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
    </Drawer>
  );
}
