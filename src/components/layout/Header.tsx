'use client';

import { User, Settings, Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile, useResponsiveSidebar } from '@/hooks/useResponsive';
import { touchOptimized, typography } from '@/lib/utils/responsive';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { LogoutDialog } from '@/features/auth/components/LogoutDialog';

interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
  showMenuButton?: boolean;
  className?: string;
}

export function Header({
  title,
  children,
  showMenuButton = true,
  className,
}: HeaderProps) {
  const isMobile = useIsMobile();
  const { toggle } = useResponsiveSidebar();
  const { isAuthenticated } = useAuth();

  return (
    <header className={cn('safe-top border-b bg-background', className)}>
      <div className="flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center space-x-2 sm:space-x-4">
          {/* Mobile menu button */}
          {isMobile && showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className={cn(
                'touch-target tap-highlight-none',
                touchOptimized('', {
                  touchClasses: 'active:scale-95',
                })
              )}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Title - responsive sizing */}
          {title && (
            <h1
              className={cn(
                typography.h2,
                'truncate text-foreground',
                isMobile ? 'text-lg' : 'text-xl sm:text-2xl'
              )}
            >
              {title}
            </h1>
          )}

          {/* Additional content */}
          <div className="min-w-0 flex-1">{children}</div>
        </div>

        {/* Action buttons - responsive sizing and spacing */}
        <div className="flex flex-shrink-0 items-center space-x-1 sm:space-x-2">
          <Button
            variant="ghost"
            size={isMobile ? 'sm' : 'icon'}
            className={cn(
              'touch-target tap-highlight-none',
              touchOptimized('', {
                touchClasses: 'active:scale-95',
              })
            )}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {!isMobile && <span className="sr-only">Notifications</span>}
          </Button>

          <Button
            variant="ghost"
            size={isMobile ? 'sm' : 'icon'}
            className={cn(
              'touch-target tap-highlight-none',
              touchOptimized('', {
                touchClasses: 'active:scale-95',
              })
            )}
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
            {!isMobile && <span className="sr-only">Settings</span>}
          </Button>

          <Button
            variant="ghost"
            size={isMobile ? 'sm' : 'icon'}
            className={cn(
              'touch-target tap-highlight-none',
              touchOptimized('', {
                touchClasses: 'active:scale-95',
              })
            )}
            aria-label="User profile"
          >
            <User className="h-4 w-4" />
            {!isMobile && <span className="sr-only">Profile</span>}
          </Button>

          {/* Logout button - only show when authenticated */}
          {isAuthenticated && (
            <LogoutDialog
              variant="ghost"
              size={isMobile ? 'sm' : 'icon'}
              className={cn(
                'touch-target tap-highlight-none text-red-600 hover:bg-red-50 hover:text-red-700',
                touchOptimized('', {
                  touchClasses: 'active:scale-95',
                })
              )}
            />
          )}
        </div>
      </div>
    </header>
  );
}
