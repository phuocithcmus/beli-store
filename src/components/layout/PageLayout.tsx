'use client';

import { Header } from './Header';
import { MobileBottomNavigation } from './MobileNavigation';
import { ResponsiveWrapper } from './ResponsiveWrapper';
import { useIsMobile } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  title?: string;
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  className?: string;
  showBottomNav?: boolean;
  fullWidth?: boolean;
  variant?: 'default' | 'centered' | 'wide';
}

export function PageLayout({
  title,
  children,
  headerContent,
  className,
  showBottomNav = true,
  fullWidth = false,
  variant = 'default',
}: PageLayoutProps) {
  const isMobile = useIsMobile();

  const getMainClasses = () => {
    const baseClasses = 'flex-1 overflow-y-auto';

    // Mobile-specific padding with bottom nav consideration
    if (isMobile) {
      return cn(
        baseClasses,
        'px-4 py-4',
        showBottomNav && 'pb-20', // Extra padding for bottom nav
        'safe-area-inset-bottom'
      );
    }

    // Desktop padding
    return cn(baseClasses, 'p-6');
  };

  const getContainerClasses = () => {
    switch (variant) {
      case 'centered':
        return 'max-w-4xl mx-auto';
      case 'wide':
        return 'max-w-7xl mx-auto';
      default:
        return fullWidth ? 'w-full' : 'max-w-6xl mx-auto';
    }
  };

  return (
    <div className={cn('flex h-screen flex-col', className)}>
      <Header title={title}>{headerContent}</Header>

      <main className={getMainClasses()}>
        {fullWidth ? (
          children
        ) : (
          <ResponsiveWrapper
            className={cn(
              'h-full',
              getContainerClasses(),
              // Mobile optimizations
              isMobile && 'px-0' // Remove extra padding on mobile as main has padding
            )}
            variant="default"
            padding={false}
          >
            {children}
          </ResponsiveWrapper>
        )}
      </main>

      {/* Mobile bottom navigation */}
      {isMobile && showBottomNav && <MobileBottomNavigation />}
    </div>
  );
}

/**
 * Specialized page layout variants
 */

export function CenteredPageLayout(props: Omit<PageLayoutProps, 'variant'>) {
  return <PageLayout {...props} variant="centered" />;
}

export function WidePageLayout(props: Omit<PageLayoutProps, 'variant'>) {
  return <PageLayout {...props} variant="wide" />;
}

export function FullWidthPageLayout(
  props: Omit<PageLayoutProps, 'variant' | 'fullWidth'>
) {
  return <PageLayout {...props} fullWidth />;
}
