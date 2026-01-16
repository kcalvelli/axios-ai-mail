/**
 * TagChip component - Colored tag badge
 */

import { Chip } from '@mui/material';
import { tagColors } from '../theme';

interface TagChipProps {
  tag: string;
  onClick?: (e: React.MouseEvent) => void;
  onDelete?: () => void;
  size?: 'small' | 'medium';
}

export function TagChip({ tag, onClick, onDelete, size = 'small' }: TagChipProps) {
  const color = tagColors[tag.toLowerCase()] || tagColors.newsletter;

  return (
    <Chip
      label={tag}
      size={size}
      onClick={onClick}
      onDelete={onDelete}
      sx={{
        backgroundColor: color,
        color: '#fff',
        fontWeight: 500,
        '&:hover': {
          backgroundColor: color,
          opacity: 0.9,
        },
        '& .MuiChip-deleteIcon': {
          color: 'rgba(255, 255, 255, 0.7)',
          '&:hover': {
            color: '#fff',
          },
        },
      }}
    />
  );
}
