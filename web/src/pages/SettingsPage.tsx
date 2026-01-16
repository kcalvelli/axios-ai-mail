/**
 * SettingsPage - Configuration and settings management
 */

import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  TextField,
  Stack,
  Chip,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { SmartToy, Sync, Label } from '@mui/icons-material';
import { useState } from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<SmartToy />} label="AI Configuration" />
          <Tab icon={<Sync />} label="Sync Settings" />
          <Tab icon={<Label />} label="Tag Taxonomy" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <AIConfigPanel />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <SyncSettingsPanel />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <TagTaxonomyPanel />
        </TabPanel>
      </Paper>
    </Box>
  );
}

function AIConfigPanel() {
  // These values are read-only in the web UI
  // Configuration is managed through Nix config
  const defaultConfig = {
    provider: 'ollama',
    model: 'mistral:latest',
    endpoint: 'http://localhost:11434',
    temperature: 0.7,
    max_tokens: 500,
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        AI configuration is managed through your Nix configuration file. Changes
        here are for reference only.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Provider"
            value={defaultConfig.provider}
            fullWidth
            disabled
            helperText="AI provider (ollama, openai, anthropic)"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Model"
            value={defaultConfig.model}
            fullWidth
            disabled
            helperText="Model name to use for classification"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Endpoint"
            value={defaultConfig.endpoint}
            fullWidth
            disabled
            helperText="API endpoint URL"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Temperature"
            value={defaultConfig.temperature}
            type="number"
            fullWidth
            disabled
            helperText="0.0 (deterministic) to 1.0 (creative)"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Max Tokens"
            value={defaultConfig.max_tokens}
            type="number"
            fullWidth
            disabled
            helperText="Maximum tokens for AI response"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Model Capabilities
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Feature</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Email Classification</TableCell>
              <TableCell>
                <Chip label="Enabled" color="success" size="small" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Priority Detection</TableCell>
              <TableCell>
                <Chip label="Enabled" color="success" size="small" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Smart Tagging</TableCell>
              <TableCell>
                <Chip label="Enabled" color="success" size="small" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Action Detection</TableCell>
              <TableCell>
                <Chip label="Enabled" color="success" size="small" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function SyncSettingsPanel() {
  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Sync settings are managed through your Nix configuration and systemd
        timers.
      </Alert>

      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Sync Frequency
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Email sync runs automatically via systemd timer. Default: every 5
            minutes.
          </Typography>
          <TextField
            label="Sync Interval"
            value="5 minutes"
            fullWidth
            disabled
            helperText="Configured in Nix: programs.axios-ai-mail.sync.frequency"
          />
        </Box>

        <Divider />

        <Box>
          <Typography variant="h6" gutterBottom>
            Sync Behavior
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Max Messages Per Sync"
                value="50"
                type="number"
                fullWidth
                disabled
                helperText="Maximum new messages to fetch per sync"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Classification Batch Size"
                value="10"
                type="number"
                fullWidth
                disabled
                helperText="Messages classified per AI request"
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h6" gutterBottom>
            Webhook Integration
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure webhooks to receive notifications about sync events.
          </Typography>
          <TextField
            label="Webhook URL"
            placeholder="https://example.com/webhook"
            fullWidth
            disabled
            helperText="Configured in Nix: programs.axios-ai-mail.webhook.url"
          />
        </Box>
      </Stack>
    </Box>
  );
}

function TagTaxonomyPanel() {
  // Default tag taxonomy from the codebase
  const tagGroups = [
    {
      name: 'Priority',
      tags: ['urgent', 'important', 'review'],
      color: 'error',
    },
    {
      name: 'Work',
      tags: ['work', 'project', 'meeting', 'deadline'],
      color: 'primary',
    },
    {
      name: 'Personal',
      tags: ['personal', 'family', 'friends', 'hobby'],
      color: 'secondary',
    },
    {
      name: 'Finance',
      tags: ['finance', 'invoice', 'payment', 'expense'],
      color: 'success',
    },
    {
      name: 'Travel',
      tags: ['travel', 'booking', 'itinerary', 'flight'],
      color: 'info',
    },
    {
      name: 'Marketing',
      tags: ['marketing', 'newsletter', 'promotion', 'announcement'],
      color: 'warning',
    },
    {
      name: 'Social',
      tags: ['social', 'notification', 'update', 'reminder'],
      color: 'default',
    },
  ];

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Tag taxonomy defines the categories and labels used by the AI for email
        classification. Configured in Nix.
      </Alert>

      <Stack spacing={3}>
        {tagGroups.map((group) => (
          <Box key={group.name}>
            <Typography variant="h6" gutterBottom>
              {group.name}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {group.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  color={group.color as any}
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Typography variant="h6" gutterBottom>
          Custom Tags
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          The AI can also generate custom tags based on email content. Custom
          tags are created dynamically during classification.
        </Typography>
        <Alert severity="success">
          <Typography variant="body2">
            <strong>Smart Tagging:</strong> The AI learns from your email
            patterns and can suggest new tags automatically.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
}
