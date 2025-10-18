'use client';

import {
  BadgeDollarSign,
  DollarSign,
  FileText,
  Home,
  Import,
  Menu,
  Package,
  SquareKanban,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useIsMobile, useResponsiveSidebar } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { touchOptimized } from '@/lib/utils/responsive';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Variants', href: '/variants', icon: SquareKanban },
  { name: 'Imports', href: '/imports', icon: Import },
  { name: 'Revenue', href: '/revenue', icon: DollarSign },
  { name: 'Sale Analysis', href: '/analytics/sales', icon: BadgeDollarSign },
  { name: 'Fees', href: '/fees', icon: DollarSign },
  { name: 'Reports', href: '/export', icon: FileText },
];

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export function Sidebar({ className, onClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { isOpen, toggle, close } = useResponsiveSidebar();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close mobile sidebar when route changes
  //   useEffect(() => {
  //     if (isMobile && isOpen) {
  //       close();
  //       onClose?.();
  //     }
  //   }, [pathname, isMobile, isOpen, close, onClose]);

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobile && isOpen) {
        close();
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobile, isOpen, close, onClose]);

  const handleToggleCollapse = () => {
    if (isMobile) {
      toggle();
      if (!isOpen) {
        onClose?.();
      }
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleLinkClick = () => {
    if (isMobile && isOpen) {
      close();
      onClose?.();
    }
  };

  // Mobile sidebar with header
  if (isMobile) {
    return (
      <>
        {/* Mobile header bar */}
        <div className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm">
          <h1 className="text-lg font-semibold">Clothing Store</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className={touchOptimized('', {
              touchClasses: 'min-h-[44px] min-w-[44px]',
            })}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Backdrop - only show when open */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              close();
              onClose?.();
            }}
            aria-hidden="true"
          />
        )}

        {/* Mobile sidebar */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out',
            'flex h-screen flex-col border-r bg-card shadow-xl',
            isOpen ? 'translate-x-0' : '-translate-x-full',
            className
          )}
        >
          <SidebarContent
            pathname={pathname}
            isCollapsed={false}
            isMobile={true}
            onToggle={handleToggleCollapse}
            onLinkClick={handleLinkClick}
          />
        </div>
      </>
    );
  }

  // Desktop sidebar
  if (isMobile) {
    return null; // Hidden on mobile when closed
  }

  return (
    <div
      className={cn(
        'flex h-screen flex-col border-r bg-card transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <SidebarContent
        pathname={pathname}
        isCollapsed={isCollapsed}
        isMobile={false}
        onToggle={handleToggleCollapse}
        onLinkClick={handleLinkClick}
      />
    </div>
  );
}

interface SidebarContentProps {
  pathname: string;
  isCollapsed: boolean;
  isMobile: boolean;
  onToggle: () => void;
  onLinkClick: () => void;
}

function SidebarContent({
  pathname,
  isCollapsed,
  isMobile,
  onToggle,
  onLinkClick,
}: SidebarContentProps) {
  return (
    <>
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            'mr-2',
            touchOptimized('', { touchClasses: 'min-h-[44px] min-w-[44px]' }),
            isMobile && 'p-3' // Larger touch target on mobile
          )}
          aria-label={
            isMobile
              ? 'Close sidebar'
              : isCollapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
          }
        >
          {isMobile ? <X className="h-5 w-5" /> : <Menu className="h-4 w-4" />}
        </Button>
        {!isCollapsed && (
          <h1 className={cn('font-semibold', isMobile ? 'text-xl' : 'text-lg')}>
            Clothing Store
          </h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center rounded-lg text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                touchOptimized('', { touchClasses: 'min-h-[44px]' }),
                isMobile
                  ? 'px-4 py-3 text-base' // Larger touch targets on mobile
                  : 'px-3 py-2',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon
                className={cn('shrink-0', isMobile ? 'h-5 w-5' : 'h-4 w-4')}
              />
              {!isCollapsed && (
                <span className="ml-3 truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        {!isCollapsed && (
          <div
            className={cn(
              'text-muted-foreground',
              isMobile ? 'text-sm' : 'text-xs'
            )}
          >
            <p>Clothing Store Dashboard</p>
            <p>v1.0.0</p>
          </div>
        )}
      </div>
    </>
  );
}
