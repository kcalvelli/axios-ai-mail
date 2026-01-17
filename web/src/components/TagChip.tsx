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
  selected?: boolean;
}

export function TagChip({ tag, onClick, onDelete, size = 'small', selected = false }: TagChipProps) {
  const color = tagColors[tag.toLowerCase()] || tagColors.newsletter;

  return (
    <Chip
      label={tag}
      size={size}
      onClick={onClick}
      onDelete={onDelete}
      variant={selected ? 'filled' : 'outlined'}
      sx={{
        backgroundColor: selected ? color : 'transparent',
        borderColor: color,
        borderWidth: 2,
        color: selected ? '#fff' : color,
        fontWeight: selected ? 600 : 500,
        '&:hover': {
          backgroundColor: selected ? color : `${color}22`,
          opacity: selected ? 0.9 : 1,
        },
        '& .MuiChip-deleteIcon': {
          color: selected ? 'rgba(255, 255, 255, 0.7)' : color,
          '&:hover': {
            color: selected ? '#fff' : color,
          },
        },
      }}
    />
  );
}
