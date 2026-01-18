/**
 * ConfidenceBadge component - Shows AI classification confidence level
 */

import { Tooltip, Box } from '@mui/material';
import { Circle } from '@mui/icons-material';

interface ConfidenceBadgeProps {
  confidence: number | null | undefined;
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

interface ConfidenceConfig {
  color: string;
  label: string;
  tooltip: string;
}

const confidenceLevels: Record<ConfidenceLevel, ConfidenceConfig> = {
  high: {
    color: '#4caf50', // green
    label: 'High',
    tooltip: 'High confidence - The AI is confident in this classification',
  },
  medium: {
    color: '#ff9800', // orange/yellow
    label: 'Medium',
    tooltip: 'Medium confidence - The classification may need review',
  },
  low: {
    color: '#f44336', // red
    label: 'Low',
    tooltip: 'Low confidence - Consider reviewing this classification',
  },
  unknown: {
    color: '#9e9e9e', // gray
    label: 'Unknown',
    tooltip: 'No confidence score available',
  },
};

function getConfidenceLevel(confidence: number | null | undefined): ConfidenceLevel {
  if (confidence === null || confidence === undefined) {
    return 'unknown';
  }
  if (confidence >= 0.8) {
    return 'high';
  }
  if (confidence >= 0.5) {
    return 'medium';
  }
  return 'low';
}

export function ConfidenceBadge({ confidence, size = 'small', showLabel = false }: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(confidence);
  const config = confidenceLevels[level];

  // Don't show anything for unknown confidence (cleaner UI)
  if (level === 'unknown') {
    return null;
  }

  // Only show badge for medium and low confidence (high confidence is the norm)
  // This keeps the UI clean by only highlighting uncertain classifications
  if (level === 'high') {
    return null;
  }

  const iconSize = size === 'small' ? 10 : 14;
  const confidencePercent = confidence !== null && confidence !== undefined
    ? Math.round(confidence * 100)
    : null;

  const tooltipText = confidencePercent !== null
    ? `${config.tooltip} (${confidencePercent}%)`
    : config.tooltip;

  return (
    <Tooltip title={tooltipText} arrow placement="top">
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'help',
        }}
      >
        <Circle
          sx={{
            color: config.color,
            fontSize: iconSize,
          }}
        />
        {showLabel && (
          <Box
            component="span"
            sx={{
              fontSize: size === 'small' ? '0.75rem' : '0.875rem',
              color: config.color,
              fontWeight: 500,
            }}
          >
            {config.label}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}

// Export for use in detail pages where we want to show all confidence levels
export function ConfidenceBadgeAlways({ confidence, size = 'small', showLabel = false }: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(confidence);
  const config = confidenceLevels[level];

  if (level === 'unknown') {
    return null;
  }

  const iconSize = size === 'small' ? 10 : 14;
  const confidencePercent = confidence !== null && confidence !== undefined
    ? Math.round(confidence * 100)
    : null;

  const tooltipText = confidencePercent !== null
    ? `${config.tooltip} (${confidencePercent}%)`
    : config.tooltip;

  return (
    <Tooltip title={tooltipText} arrow placement="top">
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'help',
        }}
      >
        <Circle
          sx={{
            color: config.color,
            fontSize: iconSize,
          }}
        />
        {showLabel && (
          <Box
            component="span"
            sx={{
              fontSize: size === 'small' ? '0.75rem' : '0.875rem',
              color: config.color,
              fontWeight: 500,
            }}
          >
            {confidencePercent !== null ? `${confidencePercent}%` : config.label}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}
