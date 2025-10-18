/**
 * Responsive breakpoint constants for consistent responsive design
 * These values should match the Tailwind CSS configuration
 */

export const RESPONSIVE_BREAKPOINTS = {
  xs: 375,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type ResponsiveBreakpoint = keyof typeof RESPONSIVE_BREAKPOINTS;

/**
 * Mobile-first breakpoint definitions
 */
export const DEVICE_BREAKPOINTS = {
  // Small phones
  smallMobile: 320,
  // Standard phones
  mobile: 375,
  // Large phones / small tablets
  largeMobile: 414,
  // Tablets
  tablet: 768,
  // Small laptops
  laptop: 1024,
  // Desktop
  desktop: 1280,
  // Large desktop
  largeDesktop: 1536,
} as const;

/**
 * Touch target size constants (WCAG AA compliance)
 */
export const TOUCH_TARGETS = {
  // Minimum touch target size (44x44px)
  minimum: 44,
  // Recommended touch target size (48x48px)
  recommended: 48,
  // Large touch target for important actions (56x56px)
  large: 56,
} as const;

/**
 * Common responsive spacing values
 */
export const RESPONSIVE_SPACING = {
  // Container padding
  containerPadding: {
    mobile: 16, // 1rem
    tablet: 24, // 1.5rem
    desktop: 32, // 2rem
  },
  // Section spacing
  sectionSpacing: {
    mobile: 32, // 2rem
    tablet: 48, // 3rem
    desktop: 64, // 4rem
  },
  // Form field spacing
  formSpacing: {
    mobile: 16, // 1rem
    tablet: 20, // 1.25rem
    desktop: 24, // 1.5rem
  },
} as const;

/**
 * Z-index constants for layering
 */
export const Z_INDEX = {
  // Background elements
  background: -1,
  // Normal content
  base: 0,
  // Dropdowns and tooltips
  dropdown: 10,
  // Sticky headers
  sticky: 20,
  // Modals and overlays
  modal: 30,
  // Navigation overlays
  navigation: 40,
  // Toasts and notifications
  toast: 50,
} as const;

/**
 * Animation duration constants (in milliseconds)
 */
export const ANIMATION_DURATION = {
  // Quick interactions (button press, hover)
  fast: 150,
  // Standard transitions (page transitions, modal open/close)
  normal: 300,
  // Slow animations (complex transitions)
  slow: 500,
} as const;

/**
 * Media query strings for consistent responsive behavior
 */
export const MEDIA_QUERIES = {
  // Screen size queries
  mobile: `(max-width: ${RESPONSIVE_BREAKPOINTS.sm - 1}px)`,
  tablet: `(min-width: ${RESPONSIVE_BREAKPOINTS.sm}px) and (max-width: ${RESPONSIVE_BREAKPOINTS.lg - 1}px)`,
  desktop: `(min-width: ${RESPONSIVE_BREAKPOINTS.lg}px)`,

  // Touch and hover queries
  touch: '(hover: none) and (pointer: coarse)',
  hover: '(hover: hover) and (pointer: fine)',

  // Orientation queries
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',

  // High DPI displays
  retina: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',

  // Reduced motion preference
  reducedMotion: '(prefers-reduced-motion: reduce)',

  // Dark mode preference
  darkMode: '(prefers-color-scheme: dark)',
} as const;

/**
 * Helper function to check if a breakpoint is mobile
 */
export function isMobileBreakpoint(breakpoint: ResponsiveBreakpoint): boolean {
  return breakpoint === 'xs' || breakpoint === 'sm';
}

/**
 * Helper function to check if a breakpoint is tablet
 */
export function isTabletBreakpoint(breakpoint: ResponsiveBreakpoint): boolean {
  return breakpoint === 'md';
}

/**
 * Helper function to check if a breakpoint is desktop
 */
export function isDesktopBreakpoint(breakpoint: ResponsiveBreakpoint): boolean {
  return breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl';
}

/**
 * Get the next larger breakpoint
 */
export function getNextBreakpoint(
  current: ResponsiveBreakpoint
): ResponsiveBreakpoint | null {
  const breakpoints: ResponsiveBreakpoint[] = [
    'xs',
    'sm',
    'md',
    'lg',
    'xl',
    '2xl',
  ];
  const currentIndex = breakpoints.indexOf(current);

  if (currentIndex === -1 || currentIndex === breakpoints.length - 1) {
    return null;
  }

  return breakpoints[currentIndex + 1];
}

/**
 * Get the previous smaller breakpoint
 */
export function getPreviousBreakpoint(
  current: ResponsiveBreakpoint
): ResponsiveBreakpoint | null {
  const breakpoints: ResponsiveBreakpoint[] = [
    'xs',
    'sm',
    'md',
    'lg',
    'xl',
    '2xl',
  ];
  const currentIndex = breakpoints.indexOf(current);

  if (currentIndex <= 0) {
    return null;
  }

  return breakpoints[currentIndex - 1];
}
