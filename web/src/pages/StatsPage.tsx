/**
 * StatsPage - Analytics and statistics dashboard
 */

import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Stack,
  LinearProgress,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Email,
  CheckCircle,
  Label,
  TrendingUp,
  Schedule,
} from '@mui/icons-material';
import { useStats, useTags } from '../hooks/useStats';

export function StatsPage() {
  const { data: statsData, isLoading: statsLoading } = useStats();
  const { data: tagsData, isLoading: tagsLoading } = useTags();

  if (statsLoading || tagsLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!statsData || !tagsData) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load statistics</Alert>
      </Box>
    );
  }

  const { stats } = statsData;

  const classificationRate =
    stats.total_messages > 0
      ? Math.round((stats.classified_messages / stats.total_messages) * 100)
      : 0;

  const unreadPercentage =
    stats.total_messages > 0
      ? Math.round((stats.unread_messages / stats.total_messages) * 100)
      : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Statistics & Analytics
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} mt={1}>
        <Grid item xs={12} md={3}>
          <StatCard
            icon={<Email color="primary" />}
            title="Total Messages"
            value={stats.total_messages.toLocaleString()}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            icon={<Email color="warning" />}
            title="Unread"
            value={stats.unread_messages.toLocaleString()}
            subtitle={`${unreadPercentage}% of total`}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            icon={<CheckCircle color="success" />}
            title="Classified"
            value={stats.classified_messages.toLocaleString()}
            subtitle={`${classificationRate}% success rate`}
            color="success"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            icon={<Label color="secondary" />}
            title="Unique Tags"
            value={tagsData.tags.length.toLocaleString()}
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* Classification Progress */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Classification Progress
        </Typography>
        <Box mt={2}>
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Messages Classified
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {stats.classified_messages} / {stats.total_messages}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={classificationRate}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            {classificationRate}% complete
          </Typography>
        </Box>
      </Paper>

      {/* Tag Distribution */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tag Distribution
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Most frequently used tags across all emails
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tag</TableCell>
                <TableCell align="right">Count</TableCell>
                <TableCell align="right">Percentage</TableCell>
                <TableCell>Distribution</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tagsData.tags.slice(0, 10).map((tag) => {
                const percentage =
                  stats.total_messages > 0
                    ? (tag.count / stats.total_messages) * 100
                    : 0;

                return (
                  <TableRow key={tag.name}>
                    <TableCell>
                      <Chip label={tag.name} size="small" />
                    </TableCell>
                    <TableCell align="right">{tag.count}</TableCell>
                    <TableCell align="right">{percentage.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Box sx={{ width: '100%', maxWidth: 200 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(percentage, 100)}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {tagsData.tags.length === 0 && (
          <Box textAlign="center" py={4}>
            <Label sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No tags yet. Run a sync to classify your emails.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Account Breakdown */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Account Breakdown
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Messages per account
        </Typography>

        <Stack spacing={2}>
          {stats.accounts_breakdown &&
            Object.entries(stats.accounts_breakdown).map(([accountId, count]) => {
              const percentage =
                stats.total_messages > 0
                  ? ((count as number) / stats.total_messages) * 100
                  : 0;

              return (
                <Box key={accountId}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography variant="body2">{accountId}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {(count as number).toLocaleString()} ({percentage.toFixed(1)}%)
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              );
            })}
        </Stack>
      </Paper>

      {/* Activity Insights */}
      <Grid container spacing={3} mt={1}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Classification Time
                  </Typography>
                  <Typography variant="h5">~2.5s</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Per message
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Schedule color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Sync
                  </Typography>
                  <Typography variant="h5">
                    {stats.last_sync ? formatRelativeTime(stats.last_sync) : 'Never'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Automatic sync every 5 min
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Classification Rate
                  </Typography>
                  <Typography variant="h5">{classificationRate}%</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats.classified_messages} of {stats.total_messages} messages
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

function StatCard({ icon, title, value, subtitle, color }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1}>
          <Box>{icon}</Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" color={color ? `${color}.main` : 'inherit'}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffMins < 1440) {
    return `${Math.floor(diffMins / 60)}h ago`;
  } else {
    return `${Math.floor(diffMins / 1440)}d ago`;
  }
}
