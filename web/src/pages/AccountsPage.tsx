/**
 * AccountsPage - Display all configured accounts with statistics
 */

import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Email, Inbox, CheckCircle, Schedule } from '@mui/icons-material';
import { useAccounts, useAccountStats } from '../hooks/useAccounts';

export function AccountsPage() {
  const { data: accountsData, isLoading, error } = useAccounts();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !accountsData) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load accounts</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Email Accounts
      </Typography>

      <Grid container spacing={3} mt={2}>
        {accountsData.map((account) => (
          <Grid item xs={12} md={6} key={account.id}>
            <AccountCard accountId={account.id} />
          </Grid>
        ))}
      </Grid>

      {accountsData.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <Email sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No accounts configured
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure your email accounts in your Nix configuration
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

interface AccountCardProps {
  accountId: string;
}

function AccountCard({ accountId }: AccountCardProps) {
  const { data: accountsData } = useAccounts();
  const { data: statsData, isLoading } = useAccountStats(accountId);

  const account = accountsData?.find((a) => a.id === accountId);

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!statsData || !account) {
    return null;
  }

  const stats = statsData;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const classificationRate =
    stats.total_messages > 0
      ? Math.round((stats.classified_messages / stats.total_messages) * 100)
      : 0;

  return (
    <Card>
      <CardContent>
        {/* Account Header */}
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Email color="primary" />
          <Box flex={1}>
            <Typography variant="h6">{account.email}</Typography>
            <Typography variant="body2" color="text.secondary">
              {account.provider}
            </Typography>
          </Box>
          <Chip
            label="Active"
            color="success"
            size="small"
          />
        </Stack>

        {/* Statistics */}
        <Grid container spacing={2} mt={1}>
          <Grid item xs={6}>
            <StatItem
              icon={<Inbox />}
              label="Total Messages"
              value={stats.total_messages.toLocaleString()}
            />
          </Grid>
          <Grid item xs={6}>
            <StatItem
              icon={<Email />}
              label="Unread"
              value={stats.unread_messages.toLocaleString()}
              color="primary"
            />
          </Grid>
          <Grid item xs={6}>
            <StatItem
              icon={<CheckCircle />}
              label="Classification Rate"
              value={`${classificationRate}%`}
              color={classificationRate > 80 ? 'success' : 'warning'}
            />
          </Grid>
          <Grid item xs={6}>
            <StatItem
              icon={<Schedule />}
              label="Last Sync"
              value={formatDate(account.last_sync || null)}
            />
          </Grid>
        </Grid>

        {/* Top Tags */}
        {(stats as any).top_tags && (stats as any).top_tags.length > 0 && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Top Tags
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mt={1}>
              {(stats as any).top_tags.slice(0, 5).map((tag: any) => (
                <Chip
                  key={tag.name}
                  label={`${tag.name} (${tag.count})`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

function StatItem({ icon, label, value, color }: StatItemProps) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ color: color ? `${color}.main` : 'text.secondary' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" color={color ? `${color}.main` : 'inherit'}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}
