import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Login | Clothing Store Dashboard',
  description: 'Sign in to your clothing store management dashboard',
};

interface LoginPageProps {
  searchParams: {
    reason?: string;
    redirect?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const { reason, redirect } = searchParams;

  // Determine message based on reason
  let message: string | undefined;
  switch (reason) {
    case 'session_expired':
      message = 'Your session has expired. Please log in again.';
      break;
    case 'unauthorized':
      message = 'Please log in to access this page.';
      break;
    case 'token_refresh_failed':
      message = 'Session could not be refreshed. Please log in again.';
      break;
    default:
      message = undefined;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Clothing Store</h1>
          <h2 className="mt-6 text-xl text-gray-600">
            Sign in to your account
          </h2>
          {message && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-800">{message}</p>
            </div>
          )}
        </div>

        {/* Login Form */}
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="space-y-4">
                <div className="h-10 animate-pulse rounded bg-gray-200" />
                <div className="h-10 animate-pulse rounded bg-gray-200" />
                <div className="h-10 animate-pulse rounded bg-gray-200" />
              </div>
            }
          >
            <LoginForm redirectTo={redirect} initialMessage={message} />
          </Suspense>
        </div>

        {/* Footer */}
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <a
              href="/register"
              className="font-medium text-blue-600 transition-colors hover:text-blue-500 focus:underline focus:outline-none"
            >
              Create account
            </a>
          </p>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600">
              Demo credentials available for testing
            </p>
            <div className="mt-2 space-y-1 text-xs text-gray-500">
              <div>Admin: admin@clothingstore.com / password123</div>
              <div>User: user@clothingstore.com / password123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
