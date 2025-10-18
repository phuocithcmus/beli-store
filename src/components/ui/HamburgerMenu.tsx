/**
 * HamburgerMenu Component
 * Animated hamburger menu icon with touch-friendly interactions
 * Provides visual feedback for mobile navigation state
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { touchOptimized } from '@/lib/utils/responsive';

interface HamburgerMenuProps {
  isOpen?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  animated?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
}

/**
 * Animated hamburger menu icon component
 */
export function HamburgerMenu({
  isOpen = false,
  onClick,
  className,
  size = 'md',
  color = 'currentColor',
  animated = true,
  disabled = false,
  'aria-label': ariaLabel = 'Toggle menu',
}: HamburgerMenuProps) {
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-5 h-5',
      line: 'h-0.5',
      spacing: 'space-y-1',
    },
    md: {
      container: 'w-6 h-6',
      line: 'h-0.5',
      spacing: 'space-y-1.5',
    },
    lg: {
      container: 'w-7 h-7',
      line: 'h-1',
      spacing: 'space-y-1.5',
    },
  };

  const config = sizeConfig[size];

  // Animation classes
  const getLineClasses = (lineIndex: number) => {
    const baseClasses = cn(
      'w-full rounded-full transition-all duration-300 ease-out',
      config.line,
      disabled ? 'opacity-50' : 'opacity-100'
    );

    if (!animated) {
      return cn(baseClasses, 'bg-current');
    }

    // Animated state classes
    switch (lineIndex) {
      case 0: // Top line
        return cn(
          baseClasses,
          'origin-center',
          isOpen
            ? 'rotate-45 translate-y-2 bg-current'
            : 'rotate-0 translate-y-0 bg-current'
        );
      case 1: // Middle line
        return cn(
          baseClasses,
          'origin-center',
          isOpen
            ? 'opacity-0 scale-0 bg-current'
            : 'opacity-100 scale-100 bg-current'
        );
      case 2: // Bottom line
        return cn(
          baseClasses,
          'origin-center',
          isOpen
            ? '-rotate-45 -translate-y-2 bg-current'
            : 'rotate-0 translate-y-0 bg-current'
        );
      default:
        return cn(baseClasses, 'bg-current');
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      className={cn(
        'inline-flex items-center justify-center',
        'touch-target tap-highlight-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        touchOptimized('', {
          touchClasses: 'active:scale-95',
        }),
        className
      )}
      style={{ color }}
    >
      <div
        className={cn(
          'flex flex-col justify-center',
          config.container,
          config.spacing
        )}
      >
        <div className={getLineClasses(0)} />
        <div className={getLineClasses(1)} />
        <div className={getLineClasses(2)} />
      </div>
    </button>
  );
}

/**
 * Alternative hamburger menu with different animation style (morphing to X)
 */
export function HamburgerMenuMorph({
  isOpen = false,
  onClick,
  className,
  size = 'md',
  color = 'currentColor',
  disabled = false,
  'aria-label': ariaLabel = 'Toggle menu',
}: HamburgerMenuProps) {
  const sizeMap = {
    sm: 20,
    md: 24,
    lg: 28,
  };

  const iconSize = sizeMap[size];
  const strokeWidth = size === 'sm' ? 2 : size === 'lg' ? 2.5 : 2;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      className={cn(
        'inline-flex items-center justify-center',
        'touch-target tap-highlight-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        touchOptimized('', {
          touchClasses: 'active:scale-95',
        }),
        className
      )}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-300"
      >
        {/* Top line */}
        <path
          d="M3 6h18"
          className={cn(
            'origin-center transition-all duration-300',
            isOpen ? 'translate-y-2 rotate-45' : 'translate-y-0 rotate-0'
          )}
        />
        {/* Middle line */}
        <path
          d="M3 12h18"
          className={cn(
            'transition-all duration-300',
            isOpen ? 'opacity-0' : 'opacity-100'
          )}
        />
        {/* Bottom line */}
        <path
          d="M3 18h18"
          className={cn(
            'origin-center transition-all duration-300',
            isOpen ? '-translate-y-2 -rotate-45' : 'translate-y-0 rotate-0'
          )}
        />
      </svg>
    </button>
  );
}

/**
 * Minimal hamburger menu (just three lines, no animation)
 */
export function HamburgerMenuSimple({
  onClick,
  className,
  size = 'md',
  color = 'currentColor',
  disabled = false,
  'aria-label': ariaLabel = 'Toggle menu',
}: Omit<HamburgerMenuProps, 'isOpen' | 'animated'>) {
  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const iconSize = sizeMap[size];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center',
        'touch-target tap-highlight-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        touchOptimized('', {
          touchClasses: 'active:scale-95',
        }),
        className
      )}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}

/**
 * Hamburger menu with custom styling options
 */
interface HamburgerMenuCustomProps extends HamburgerMenuProps {
  lineColor?: string;
  backgroundColor?: string;
  borderRadius?: string;
  padding?: string;
}

export function HamburgerMenuCustom({
  isOpen = false,
  onClick,
  className,
  size = 'md',
  lineColor = 'currentColor',
  backgroundColor,
  borderRadius,
  padding,
  animated = true,
  disabled = false,
  'aria-label': ariaLabel = 'Toggle menu',
}: HamburgerMenuCustomProps) {
  const sizeConfig = {
    sm: { width: 16, height: 12, lineHeight: 2 },
    md: { width: 20, height: 16, lineHeight: 2 },
    lg: { width: 24, height: 20, lineHeight: 3 },
  };

  const config = sizeConfig[size];

  const containerStyle = {
    backgroundColor,
    borderRadius,
    padding,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      className={cn(
        'inline-flex items-center justify-center',
        'touch-target tap-highlight-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        touchOptimized('', {
          touchClasses: 'active:scale-95',
        }),
        className
      )}
      style={containerStyle}
    >
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        fill="none"
      >
        {/* Top line */}
        <rect
          x="0"
          y="0"
          width={config.width}
          height={config.lineHeight}
          fill={lineColor}
          rx={config.lineHeight / 2}
          className={cn(
            animated && 'origin-center transition-all duration-300',
            isOpen && animated ? 'rotate-45' : 'rotate-0'
          )}
          style={{
            transformOrigin: `${config.width / 2}px ${config.height / 2}px`,
            transform:
              isOpen && animated
                ? `rotate(45deg) translate(0, ${(config.height - config.lineHeight) / 2}px)`
                : 'none',
          }}
        />
        {/* Middle line */}
        <rect
          x="0"
          y={(config.height - config.lineHeight) / 2}
          width={config.width}
          height={config.lineHeight}
          fill={lineColor}
          rx={config.lineHeight / 2}
          className={cn(
            animated && 'transition-all duration-300',
            isOpen && animated ? 'opacity-0' : 'opacity-100'
          )}
        />
        {/* Bottom line */}
        <rect
          x="0"
          y={config.height - config.lineHeight}
          width={config.width}
          height={config.lineHeight}
          fill={lineColor}
          rx={config.lineHeight / 2}
          className={cn(
            animated && 'origin-center transition-all duration-300'
          )}
          style={{
            transformOrigin: `${config.width / 2}px ${config.height / 2}px`,
            transform:
              isOpen && animated
                ? `rotate(-45deg) translate(0, -${(config.height - config.lineHeight) / 2}px)`
                : 'none',
          }}
        />
      </svg>
    </button>
  );
}
