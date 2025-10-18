/**
 * Responsive hooks for detecting screen size, device type, and responsive behavior
 * Provides React hooks for responsive design patterns
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RESPONSIVE_BREAKPOINTS,
  type ResponsiveBreakpoint,
} from '@/lib/constants/breakpoints';

/**
 * Hook to get current window dimensions
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowSize;
}

/**
 * Hook to get current responsive breakpoint
 */
export function useBreakpoint(): ResponsiveBreakpoint {
  const { width } = useWindowSize();

  if (width >= RESPONSIVE_BREAKPOINTS['2xl']) {
    return '2xl';
  }
  if (width >= RESPONSIVE_BREAKPOINTS.xl) {
    return 'xl';
  }
  if (width >= RESPONSIVE_BREAKPOINTS.lg) {
    return 'lg';
  }
  if (width >= RESPONSIVE_BREAKPOINTS.md) {
    return 'md';
  }
  if (width >= RESPONSIVE_BREAKPOINTS.sm) {
    return 'sm';
  }
  return 'xs';
}

/**
 * Hook to check if current screen matches a specific breakpoint or larger
 */
export function useMediaQuery(breakpoint: ResponsiveBreakpoint): boolean {
  const { width } = useWindowSize();
  return width >= RESPONSIVE_BREAKPOINTS[breakpoint];
}

/**
 * Hook to detect if device is mobile (xs or sm breakpoint)
 */
export function useIsMobile(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'xs' || breakpoint === 'sm';
}

/**
 * Hook to detect if device is tablet (md breakpoint)
 */
export function useIsTablet(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'md';
}

/**
 * Hook to detect if device is desktop (lg, xl, or 2xl breakpoint)
 */
export function useIsDesktop(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl';
}

/**
 * Hook to detect touch device capabilities
 */
export function useTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      // Check for touch support
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      // Check media query for hover capability
      const hasHover = window.matchMedia(
        '(hover: hover) and (pointer: fine)'
      ).matches;

      setIsTouchDevice(hasTouch && !hasHover);
    };

    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);

    return () => {
      window.removeEventListener('resize', checkTouchDevice);
    };
  }, []);

  return isTouchDevice;
}

/**
 * Hook to detect device orientation
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const { width, height } = useWindowSize();
  return width > height ? 'landscape' : 'portrait';
}

/**
 * Hook for responsive values based on breakpoint
 */
export function useResponsiveValue<T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}): T | undefined {
  const breakpoint = useBreakpoint();

  // Find the most appropriate value for current breakpoint
  const breakpoints: ResponsiveBreakpoint[] = [
    '2xl',
    'xl',
    'lg',
    'md',
    'sm',
    'xs',
  ];
  const currentIndex = breakpoints.indexOf(breakpoint);

  // Look for value at current breakpoint or smaller
  for (let i = currentIndex; i < breakpoints.length; i++) {
    const bp = breakpoints[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }

  return undefined;
}

/**
 * Hook to track scroll position for sticky behaviors
 */
export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition({
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Set initial position

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return scrollPosition;
}

/**
 * Hook for responsive sidebar state management
 */
export function useResponsiveSidebar() {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when switching to mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    toggle,
    close,
    open,
    isMobile,
  };
}

/**
 * Hook for managing responsive modal behavior
 */
export function useResponsiveModal() {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);

    // Prevent body scroll on mobile
    if (isMobile) {
      document.body.style.overflow = 'hidden';
    }
  }, [isMobile]);

  const close = useCallback(() => {
    setIsOpen(false);

    // Restore body scroll
    document.body.style.overflow = '';
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return {
    isOpen,
    open,
    close,
    isMobile,
  };
}

/**
 * Hook for responsive grid columns
 */
export function useResponsiveColumns(options: {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  '2xl'?: number;
}): number {
  return useResponsiveValue(options) ?? 1;
}

/**
 * Hook to debounce resize events for performance
 */
export function useDebouncedWindowSize(delay: number = 150) {
  const [debouncedSize, setDebouncedSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDebouncedSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, delay);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [delay]);

  return debouncedSize;
}
