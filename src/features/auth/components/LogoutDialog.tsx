'use client';

import { useState } from 'react';
import { LogOut, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';

interface LogoutDialogProps {
  children?: React.ReactNode;
  onLogoutSuccess?: () => void;
  showIcon?: boolean;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function LogoutDialog({
  children,
  onLogoutSuccess,
  showIcon = true,
  variant = 'ghost',
  size = 'icon',
  className,
}: LogoutDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await logout();
      setOpen(false);
      onLogoutSuccess?.();
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, close dialog and let auth context handle state
      setOpen(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCancel = () => {
    if (!isLoggingOut) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant={variant}
            size={size}
            className={className}
            aria-label="Logout"
          >
            {showIcon && <LogOut className="h-4 w-4" />}
            {size !== 'icon' && <span>Logout</span>}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Confirm Logout
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {user?.name && `Goodbye, ${user.name}!`} Are you sure you want
                to logout?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">Logging out will:</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-current" />
                End your current session
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-current" />
                Clear your authentication tokens
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-current" />
                Redirect you to the login page
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoggingOut}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full sm:w-auto"
          >
            {isLoggingOut ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export a simplified logout button component for convenience
export function LogoutButton({
  showConfirmation = true,
  ...props
}: LogoutDialogProps & { showConfirmation?: boolean }) {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleDirectLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await logout();
      props.onLogoutSuccess?.();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!showConfirmation) {
    return (
      <Button
        variant={props.variant || 'ghost'}
        size={props.size || 'icon'}
        onClick={handleDirectLogout}
        disabled={isLoggingOut}
        className={props.className}
        aria-label="Logout"
      >
        {props.showIcon !== false && <LogOut className="h-4 w-4" />}
        {props.size !== 'icon' && (
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        )}
      </Button>
    );
  }

  return <LogoutDialog {...props} />;
}
