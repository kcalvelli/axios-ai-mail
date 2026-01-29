/**
 * TagChip component - Colored tag badge
 */

import { Chip } from '@mui/material';
import { Email, BoltOutlined } from '@mui/icons-material';
import { tagColors } from '../contexts/ThemeContext';

interface TagChipProps {
  tag: string;
  onClick?: (e: React.MouseEvent) => void;
  onDelete?: () => void;
  size?: 'small' | 'medium';
  selected?: boolean;
  isAccountTag?: boolean;
  isActionTag?: boolean;
}

export function TagChip({ tag, onClick, onDelete, size = 'small', selected = false, isAccountTag = false, isActionTag = false }: TagChipProps) {
  // Action tags use amber color, account tags use neutral gray
  const color = isActionTag
    ? tagColors.action
    : isAccountTag
      ? '#607d8b'
      : (tagColors[tag.toLowerCase()] || tagColors.newsletter);

  return (
    <Chip
      label={tag}
      size={size}
      onClick={onClick}
      onDelete={onDelete}
      icon={
        isActionTag ? <BoltOutlined sx={{ fontSize: 16 }} /> :
        isAccountTag ? <Email sx={{ fontSize: 16 }} /> :
        undefined
      }
      variant={selected ? 'filled' : 'outlined'}
      sx={{
        backgroundColor: selected ? color : (isActionTag ? `${color}15` : 'transparent'),
        borderColor: color,
        borderWidth: isActionTag ? 2 : 2,
        borderStyle: isActionTag ? 'dashed' : 'solid',
        color: selected ? '#fff' : color,
        fontWeight: selected ? 600 : 500,
        maxWidth: '100%',
        '& .MuiChip-label': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
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
        '& .MuiChip-icon': {
          color: selected ? '#fff' : color,
        },
      }}
    />
  );
}
