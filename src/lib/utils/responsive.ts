/**
 * Responsive utility classes and functions for mobile-first design
 * Provides helpers for responsive behavior, breakpoint detection, and mobile optimization
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Responsive breakpoint constants
export const BREAKPOINTS = {
  xs: 375,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Utility function to combine responsive class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate responsive class names for different breakpoints
 */
export function responsive(
  classes: Partial<Record<Breakpoint | 'DEFAULT', string>>
) {
  const classNames: string[] = [];

  // Add default classes (mobile-first)
  if (classes.DEFAULT) {
    classNames.push(classes.DEFAULT);
  }

  // Add breakpoint-specific classes
  Object.entries(classes).forEach(([breakpoint, className]) => {
    if (breakpoint !== 'DEFAULT' && className) {
      classNames.push(`${breakpoint}:${className}`);
    }
  });

  return cn(...classNames);
}

/**
 * Generate touch-optimized class names
 */
export function touchOptimized(
  baseClasses: string,
  options?: {
    touchClasses?: string;
    hoverClasses?: string;
  }
) {
  return cn(
    baseClasses,
    options?.touchClasses && `touch:${options.touchClasses}`,
    options?.hoverClasses && `no-touch:${options.hoverClasses}`
  );
}

/**
 * Mobile-first spacing utilities
 */
export const spacing = {
  // Touch-friendly spacing
  touchTarget: 'min-h-[44px] min-w-[44px]', // WCAG AA minimum touch target
  touchPadding: 'p-3 sm:p-4',
  touchMargin: 'm-2 sm:m-3',

  // Responsive container spacing
  container: 'px-4 sm:px-6 lg:px-8',
  section: 'py-8 sm:py-12 lg:py-16',

  // Form spacing
  formField: 'mb-4 sm:mb-6',
  formGroup: 'space-y-4 sm:space-y-6',
} as const;

/**
 * Mobile-optimized typography utilities
 */
export const typography = {
  // Responsive headings
  h1: 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold',
  h2: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold',
  h3: 'text-lg sm:text-xl lg:text-2xl font-semibold',
  h4: 'text-base sm:text-lg lg:text-xl font-medium',

  // Body text
  body: 'text-sm sm:text-base leading-relaxed',
  bodyLarge: 'text-base sm:text-lg leading-relaxed',
  caption: 'text-xs sm:text-sm text-muted-foreground',

  // Mobile-optimized line heights
  tight: 'leading-tight sm:leading-normal',
  normal: 'leading-normal sm:leading-relaxed',
  relaxed: 'leading-relaxed sm:leading-loose',
} as const;

/**
 * Responsive grid utilities
 */
export const grid = {
  // Auto-responsive grids
  autoFit:
    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6',
  cards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
  dashboard: 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6',

  // Form grids
  form: 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6',
  formWide: 'grid grid-cols-1 gap-4 sm:gap-6',
} as const;

/**
 * Mobile navigation utilities
 */
export const navigation = {
  // Mobile menu
  mobileMenu: 'fixed inset-0 z-50 bg-background/95 backdrop-blur-sm',
  mobileMenuContent:
    'fixed inset-y-0 left-0 z-50 w-full max-w-sm bg-background border-r shadow-lg',

  // Tab navigation
  tabs: 'flex overflow-x-auto scrollbar-hide',
  tabItem: 'whitespace-nowrap px-4 py-2 min-w-[120px] text-center',

  // Bottom navigation
  bottomNav: 'fixed bottom-0 left-0 right-0 z-40 bg-background border-t',
  bottomNavItem:
    'flex-1 flex flex-col items-center justify-center py-2 min-h-[60px]',
} as const;

/**
 * Data table responsive utilities
 */
export const table = {
  // Mobile-first table container
  container: 'w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300',

  // Responsive table layouts
  stack: 'block sm:table w-full',
  stackRow: 'block sm:table-row border-b sm:border-b-0 mb-4 sm:mb-0',
  stackCell: 'block sm:table-cell py-2 sm:py-4 px-4 text-left',

  // Card-based table for mobile
  cardContainer: 'space-y-4 sm:hidden',
  card: 'bg-card p-4 rounded-lg border shadow-sm',
} as const;

/**
 * Chart and visualization responsive utilities
 */
export const chart = {
  // Responsive chart containers
  container: 'w-full h-64 sm:h-80 lg:h-96',
  small: 'w-full h-48 sm:h-64',
  large: 'w-full h-80 sm:h-96 lg:h-[500px]',

  // Mobile-optimized chart wrapper
  wrapper: 'overflow-hidden rounded-lg bg-card p-2 sm:p-4',

  // Legend positioning
  legend: 'mt-4 flex flex-wrap justify-center gap-2 sm:gap-4',
  legendItem: 'flex items-center gap-2 text-xs sm:text-sm',
} as const;

/**
 * Animation utilities for mobile
 */
export const animation = {
  // Touch feedback
  touchFeedback: 'active:scale-95 transition-transform duration-75',

  // Mobile-friendly transitions
  fade: 'transition-opacity duration-200 ease-in-out',
  slide: 'transition-transform duration-300 ease-out',
  scale: 'transition-transform duration-200 ease-out',

  // Loading states
  pulse: 'animate-pulse',
  spin: 'animate-spin',
} as const;

/**
 * Utility to detect if current screen matches a breakpoint
 * Note: This is for use in client-side code only
 */
export function matchesBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.innerWidth >= BREAKPOINTS[breakpoint];
}

/**
 * Get current breakpoint based on window width
 * Note: This is for use in client-side code only
 */
export function getCurrentBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') {
    return 'sm';
  }

  const width = window.innerWidth;

  if (width >= BREAKPOINTS['2xl']) {
    return '2xl';
  }
  if (width >= BREAKPOINTS.xl) {
    return 'xl';
  }
  if (width >= BREAKPOINTS.lg) {
    return 'lg';
  }
  if (width >= BREAKPOINTS.md) {
    return 'md';
  }
  if (width >= BREAKPOINTS.sm) {
    return 'sm';
  }
  return 'xs';
}

/**
 * Check if device supports hover (non-touch device)
 */
export function supportsHover(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/**
 * Check if device is touch-enabled
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}
