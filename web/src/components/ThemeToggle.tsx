/**
 * ThemeToggle - Button to cycle through light/dark/system themes
 */

import { IconButton, Tooltip } from '@mui/material';
import { LightMode, DarkMode, SettingsBrightness } from '@mui/icons-material';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';

// Icon and tooltip for each mode
const modeConfig: Record<ThemeMode, { icon: React.ReactNode; tooltip: string; nextTooltip: string }> = {
  light: {
    icon: <LightMode />,
    tooltip: 'Light mode',
    nextTooltip: 'Switch to dark mode',
  },
  dark: {
    icon: <DarkMode />,
    tooltip: 'Dark mode',
    nextTooltip: 'Switch to system theme',
  },
  system: {
    icon: <SettingsBrightness />,
    tooltip: 'System theme',
    nextTooltip: 'Switch to light mode',
  },
};

export function ThemeToggle() {
  const { mode, toggleMode } = useTheme();
  const config = modeConfig[mode];

  return (
    <Tooltip title={config.nextTooltip}>
      <IconButton
        onClick={toggleMode}
        color="inherit"
        aria-label={config.tooltip}
        size="medium"
      >
        {config.icon}
      </IconButton>
    </Tooltip>
  );
}
