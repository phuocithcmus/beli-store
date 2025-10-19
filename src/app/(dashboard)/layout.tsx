'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth, useIsAuthenticated, useAuthLoading } from '@/hooks/use-auth';

// Loading component for authentication state
function AuthLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm text-muted-foreground">
          Checking authentication...
        </p>
      </div>
    </div>
  );
}

// Unauthenticated fallback component
function Unauthenticated() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="mb-2 text-lg font-semibold">Authentication Required</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Please log in to access the dashboard.
        </p>
        <a
          href="/login"
          className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { checkAuthStatus } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();

  // Check authentication status on mount
  useEffect(() => {
    console.log('Checking authentication status on dashboard layout mount');
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Redirect to login if not authenticated (backup to middleware)
  useEffect(() => {
    console.log(
      `Auth loading: ${isLoading}, Authenticated: ${isAuthenticated}`
    );
    if (!isLoading && !isAuthenticated) {
      router.push('/login?reason=unauthorized');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <AuthLoading />;
  }

  // Show unauthenticated state if not logged in
  if (!isAuthenticated) {
    return <Unauthenticated />;
  }

  // Render dashboard layout for authenticated users
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - handles both mobile and desktop */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Page content - with top padding on mobile for fixed header */}
        <main className="flex-1 overflow-auto bg-background pt-16 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
