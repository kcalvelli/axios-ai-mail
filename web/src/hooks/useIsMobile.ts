/**
 * Responsive breakpoint hooks for mobile/tablet/desktop detection
 */

import { useMediaQuery, useTheme } from '@mui/material';

/**
 * Returns true if the screen is mobile-sized (< 900px)
 * This includes phones and tablets in portrait mode
 */
export function useIsMobile(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
}

/**
 * Returns true if the screen is tablet-sized (600px - 900px)
 */
export function useIsTablet(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.between('sm', 'md'));
}

/**
 * Returns true if the screen is desktop-sized (>= 900px)
 */
export function useIsDesktop(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up('md'));
}

/**
 * Returns true if the device has touch capability
 * Used to determine if swipe gestures should be enabled
 */
export function useIsTouchDevice(): boolean {
  // Check for coarse pointer (touch) vs fine pointer (mouse)
  return useMediaQuery('(pointer: coarse)');
}
