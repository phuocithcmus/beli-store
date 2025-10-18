/**
 * ResponsiveWrapper Component
 * Provides responsive layout foundation for mobile-first design
 * Handles container sizing, spacing, and responsive behavior
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { spacing, responsive } from '@/lib/utils/responsive';
import { useIsMobile } from '@/hooks/useResponsive';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  className?: string;
  variant?:
    | 'default'
    | 'container'
    | 'section'
    | 'form'
    | 'card'
    | 'full-width';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  center?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Responsive wrapper component with mobile-first design patterns
 */
export function ResponsiveWrapper({
  children,
  className,
  variant = 'default',
  spacing: spacingSize = 'md',
  maxWidth = 'full',
  padding = true,
  center = true,
  as: Component = 'div',
}: ResponsiveWrapperProps) {
  const isMobile = useIsMobile();

  // Generate responsive classes based on variant
  const getVariantClasses = () => {
    switch (variant) {
      case 'container':
        return responsive({
          DEFAULT: 'w-full',
          sm: 'max-w-screen-sm',
          md: 'max-w-screen-md',
          lg: 'max-w-screen-lg',
          xl: 'max-w-screen-xl',
          '2xl': 'max-w-screen-2xl',
        });

      case 'section':
        return cn('w-full', spacing.section, center && 'mx-auto');

      case 'form':
        return cn('w-full', 'max-w-md mx-auto', spacing.formGroup);

      case 'card':
        return cn(
          'w-full',
          'bg-card text-card-foreground',
          'border rounded-lg shadow-sm',
          padding && 'p-4 sm:p-6'
        );

      case 'full-width':
        return 'w-full min-h-full';

      default:
        return 'w-full';
    }
  };

  // Generate spacing classes
  const getSpacingClasses = () => {
    if (spacingSize === 'none') {
      return '';
    }

    const spacingMap = {
      sm: 'p-2 sm:p-3',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8',
      xl: 'p-8 sm:p-12',
    };

    return spacingMap[spacingSize] || spacingMap.md;
  };

  // Generate max-width classes
  const getMaxWidthClasses = () => {
    if (maxWidth === 'full') {
      return '';
    }

    const maxWidthMap = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
    };

    return maxWidthMap[maxWidth];
  };

  // Combine all classes
  const wrapperClasses = cn(
    // Base classes
    'relative',

    // Variant-specific classes
    getVariantClasses(),

    // Max width classes
    getMaxWidthClasses(),

    // Spacing classes (only if padding is true and not handled by variant)
    padding &&
      variant !== 'card' &&
      variant !== 'section' &&
      getSpacingClasses(),

    // Centering
    center && maxWidth !== 'full' && 'mx-auto',

    // Mobile-specific optimizations
    isMobile && 'touch-manipulation',

    // Custom classes
    className
  );

  return <Component className={wrapperClasses}>{children}</Component>;
}

/**
 * Pre-configured responsive container variants
 */

export function ResponsiveContainer({
  children,
  className,
  ...props
}: Omit<ResponsiveWrapperProps, 'variant'>) {
  return (
    <ResponsiveWrapper
      variant="container"
      className={cn(spacing.container, className)}
      {...props}
    >
      {children}
    </ResponsiveWrapper>
  );
}

export function ResponsiveSection({
  children,
  className,
  ...props
}: Omit<ResponsiveWrapperProps, 'variant'>) {
  return (
    <ResponsiveWrapper variant="section" className={className} {...props}>
      {children}
    </ResponsiveWrapper>
  );
}

export function ResponsiveCard({
  children,
  className,
  ...props
}: Omit<ResponsiveWrapperProps, 'variant'>) {
  return (
    <ResponsiveWrapper variant="card" className={className} {...props}>
      {children}
    </ResponsiveWrapper>
  );
}

export function ResponsiveForm({
  children,
  className,
  ...props
}: Omit<ResponsiveWrapperProps, 'variant'>) {
  return (
    <ResponsiveWrapper variant="form" className={className} {...props}>
      {children}
    </ResponsiveWrapper>
  );
}

/**
 * Responsive grid wrapper with auto-responsive columns
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  as?: keyof JSX.IntrinsicElements;
}

export function ResponsiveGrid({
  children,
  className,
  columns = { xs: 1, sm: 2, lg: 3, xl: 4 },
  gap = 'md',
  as: Component = 'div',
}: ResponsiveGridProps) {
  // Generate grid classes based on column configuration
  const getGridClasses = () => {
    const gridClasses: string[] = ['grid'];

    // Add column classes for each breakpoint
    Object.entries(columns).forEach(([breakpoint, cols]) => {
      if (breakpoint === 'xs') {
        gridClasses.push(`grid-cols-${cols}`);
      } else {
        gridClasses.push(`${breakpoint}:grid-cols-${cols}`);
      }
    });

    return gridClasses.join(' ');
  };

  // Generate gap classes
  const getGapClasses = () => {
    const gapMap = {
      sm: 'gap-2 sm:gap-3',
      md: 'gap-4 sm:gap-6',
      lg: 'gap-6 sm:gap-8',
      xl: 'gap-8 sm:gap-10',
    };

    return gapMap[gap];
  };

  return (
    <Component
      className={cn(getGridClasses(), getGapClasses(), 'w-full', className)}
    >
      {children}
    </Component>
  );
}

/**
 * Responsive stack component for vertical layouts
 */
interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  as?: keyof JSX.IntrinsicElements;
}

export function ResponsiveStack({
  children,
  className,
  spacing: stackSpacing = 'md',
  align = 'stretch',
  as: Component = 'div',
}: ResponsiveStackProps) {
  const getSpacingClasses = () => {
    const spacingMap = {
      sm: 'space-y-2 sm:space-y-3',
      md: 'space-y-4 sm:space-y-6',
      lg: 'space-y-6 sm:space-y-8',
      xl: 'space-y-8 sm:space-y-10',
    };

    return spacingMap[stackSpacing];
  };

  const getAlignClasses = () => {
    const alignMap = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    };

    return alignMap[align];
  };

  return (
    <Component
      className={cn(
        'flex flex-col',
        getSpacingClasses(),
        getAlignClasses(),
        'w-full',
        className
      )}
    >
      {children}
    </Component>
  );
}
