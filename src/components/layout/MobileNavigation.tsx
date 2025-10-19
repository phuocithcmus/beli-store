/**
 * MobileNavigation Component
 * Provides mobile-optimized navigation with touch-friendly interactions
 * Includes hamburger menu, bottom navigation, and responsive behaviors
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  Home,
  Package,
  Import,
  Calculator,
  BarChart3,
  TrendingUp,
  Palette,
  Settings,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useResponsiveSidebar } from '@/hooks/useResponsive';
import { navigation, touchOptimized } from '@/lib/utils/responsive';

/**
 * Navigation items configuration
 */
interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isActive: (pathname: string) => boolean;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: Home,
    isActive: (pathname: string) => pathname === '/',
  },
  {
    label: 'Products',
    href: '/products',
    icon: Package,
    isActive: (pathname: string) => pathname.startsWith('/products'),
  },
  {
    label: 'Imports',
    href: '/imports',
    icon: Import,
    isActive: (pathname: string) => pathname.startsWith('/imports'),
  },
  {
    label: 'Fees',
    href: '/fees',
    icon: Calculator,
    isActive: (pathname: string) => pathname.startsWith('/fees'),
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    isActive: (pathname: string) => pathname.startsWith('/analytics'),
  },
  {
    label: 'Revenue',
    href: '/revenue',
    icon: TrendingUp,
    isActive: (pathname: string) => pathname.startsWith('/revenue'),
  },
  {
    label: 'Variants',
    href: '/variants',
    icon: Palette,
    isActive: (pathname: string) => pathname.startsWith('/variants'),
  },
] as const;

const SECONDARY_ITEMS = [
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
  },
] as const;

interface MobileNavigationProps {
  className?: string;
}

/**
 * Mobile navigation drawer component
 */
export function MobileNavigation({ className }: MobileNavigationProps) {
  const pathname = usePathname();
  const { isOpen, close, isMobile } = useResponsiveSidebar();

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className={cn(navigation.mobileMenu)}
          onClick={close}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              close();
            }
          }}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <nav
        className={cn(
          navigation.mobileMenuContent,
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold text-foreground">
            Clothing Store
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            className={touchOptimized('', {
              touchClasses: 'active:scale-95',
            })}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-4">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = item.isActive(pathname);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href as any}
                  onClick={close}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                    'touch-target tap-highlight-none',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    touchOptimized('', {
                      touchClasses: 'active:scale-95',
                    })
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 border-t" />

          {/* Secondary Items */}
          <div className="space-y-1 px-4">
            {SECONDARY_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href as any}
                  onClick={close}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                    'touch-target tap-highlight-none',
                    'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    touchOptimized('', {
                      touchClasses: 'active:scale-95',
                    })
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

/**
 * Bottom navigation component for mobile
 */
export function MobileBottomNavigation({ className }: MobileNavigationProps) {
  const pathname = usePathname();
  const { isMobile } = useResponsiveSidebar();

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  // Show only main navigation items in bottom nav
  const bottomNavItems = NAVIGATION_ITEMS.slice(0, 5);

  return (
    <nav
      className={cn(navigation.bottomNav, 'grid grid-cols-5 gap-1', className)}
      role="navigation"
      aria-label="Bottom navigation"
    >
      {bottomNavItems.map((item) => {
        const isActive = item.isActive(pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href as any}
            className={cn(
              navigation.bottomNavItem,
              'text-xs transition-colors',
              'tap-highlight-none',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
              touchOptimized('', {
                touchClasses: 'active:scale-95',
              })
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="mb-1 h-5 w-5" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Mobile navigation context provider
 */
interface MobileNavigationContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
}

const MobileNavigationContext =
  React.createContext<MobileNavigationContextValue | null>(null);

export function MobileNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarState = useResponsiveSidebar();

  return (
    <MobileNavigationContext.Provider value={sidebarState}>
      {children}
    </MobileNavigationContext.Provider>
  );
}

/**
 * Hook to use mobile navigation context
 */
export function useMobileNavigation() {
  const context = React.useContext(MobileNavigationContext);

  if (!context) {
    throw new Error(
      'useMobileNavigation must be used within MobileNavigationProvider'
    );
  }

  return context;
}
