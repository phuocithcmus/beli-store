'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Keyboard } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import {
  enhancedLoginSchema,
  type LoginFormData,
} from '@/features/auth/validation/auth.schemas';
import { UsernameInput, PasswordInput } from '@/components/ui/validated-input';
import { ValidationError } from '@/features/auth/components/ValidationError';

interface LoginFormProps {
  redirectTo?: string;
  initialMessage?: string;
}

export function LoginForm({ redirectTo, initialMessage }: LoginFormProps) {
  const searchParams = useSearchParams();
  const { login, isLoading, error: authError, clearError } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    clearErrors,
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(enhancedLoginSchema),
    mode: 'onChange',
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  // Clear auth errors when component mounts or when user starts typing
  useEffect(() => {
    clearError();
  }, [clearError]);

  const displayError = authError || errors.root?.message;
  const isDisabled = isLoading || isSubmitting;

  // Handle form submission
  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      try {
        setIsSubmitting(true);
        clearErrors();
        clearError();

        // Attempt login
        await login({
          username: data.username,
          password: data.password,
        });

        // Success - redirect after login
        const redirectUrl = redirectTo || searchParams.get('redirect') || '/';
        if (redirectUrl === '/') {
          window.location.href = '/';
        } else {
          window.location.href = redirectUrl;
        }
      } catch (error) {
        console.error('Login error:', error);
        // Error is handled by the auth context
        // But we can add form-specific error handling here
        if (error instanceof Error) {
          if (error.message.includes('Invalid credentials')) {
            setError('username', { message: 'Invalid username or password' });
            setError('password', { message: 'Invalid username or password' });
          } else if (error.message.includes('User not found')) {
            setError('username', { message: 'User not found' });
          } else {
            setError('root', { message: error.message });
          }
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [login, redirectTo, searchParams, clearErrors, clearError, setError]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit form
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isValid && !isDisabled) {
          handleSubmit(onSubmit)();
        }
      }

      // Escape to clear form
      if (e.key === 'Escape') {
        e.preventDefault();
        reset();
        clearErrors();
        clearError();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isValid,
    isDisabled,
    handleSubmit,
    onSubmit,
    reset,
    clearErrors,
    clearError,
  ]);

  // Handle demo login
  const handleDemoLogin = async (type: 'admin' | 'user') => {
    const credentials = {
      admin: { username: 'admin@clothingstore.com', password: 'password123' },
      user: { username: 'user@clothingstore.com', password: 'password123' },
    };

    reset(credentials[type]);

    // Auto-submit after a brief delay
    setTimeout(() => {
      handleSubmit(onSubmit)();
    }, 100);
  };

  return (
    <div className="w-full max-w-md">
      {/* Initial message */}
      {initialMessage && !displayError && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-800">{initialMessage}</p>
        </div>
      )}

      {/* Error message */}
      {displayError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{displayError}</p>
        </div>
      )}

      {/* Login form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
        aria-label="Login form"
      >
        {/* Username field */}
        <UsernameInput
          {...register('username')}
          id="username"
          label="Username or Email"
          placeholder="Enter your username or email"
          autoComplete="username"
          required
          disabled={isDisabled}
          error={errors.username?.message}
          realTimeValidation={true}
          showFormatHelp={true}
          aria-describedby={errors.username ? 'username-error' : undefined}
          aria-invalid={!!errors.username}
        />

        {/* Password field */}
        <PasswordInput
          {...register('password')}
          id="password"
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          disabled={isDisabled}
          error={errors.password?.message}
          showToggle={true}
          showStrengthIndicator={false}
          strengthMode="login"
          realTimeValidation={true}
          aria-describedby={errors.password ? 'password-error' : undefined}
          aria-invalid={!!errors.password}
        />

        {/* Remember me checkbox */}
        <div className="flex items-center">
          <input
            {...register('rememberMe')}
            id="rememberMe"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={isDisabled}
            aria-describedby="rememberMe-description"
          />
          <label
            htmlFor="rememberMe"
            className="ml-2 block text-sm text-gray-700"
          >
            Remember me
          </label>
          <span id="rememberMe-description" className="sr-only">
            Keep me signed in on this device
          </span>
        </div>

        {/* Submit button */}
        <div>
          <button
            type="submit"
            disabled={isDisabled}
            className={`
              group relative flex w-full justify-center rounded-md border border-transparent px-4 
              py-3 text-sm font-medium text-white transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${
                isDisabled
                  ? 'cursor-not-allowed bg-gray-400 opacity-50'
                  : 'bg-blue-600 shadow-sm hover:bg-blue-700 hover:shadow-md active:bg-blue-800'
              }
            `}
          >
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              {isSubmitting || isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Keyboard className="h-5 w-5" />
              )}
            </span>
            {isSubmitting || isLoading ? (
              <span className="ml-3">
                {isSubmitting ? 'Signing in...' : 'Validating...'}
              </span>
            ) : (
              <span className="ml-3">Sign in</span>
            )}
          </button>

          {/* Form validation status */}
          {!isValid && Object.keys(errors).length > 0 && (
            <ValidationError
              message="Please fix the errors above to continue"
              type="warning"
              className="mt-2"
            />
          )}

          {/* Keyboard shortcuts hint */}
          <div className="mt-2 text-center text-xs text-gray-500">
            <kbd className="rounded border bg-gray-100 px-1 py-0.5 text-xs">
              Ctrl
            </kbd>{' '}
            +
            <kbd className="ml-1 rounded border bg-gray-100 px-1 py-0.5 text-xs">
              Enter
            </kbd>{' '}
            to submit •
            <kbd className="ml-1 rounded border bg-gray-100 px-1 py-0.5 text-xs">
              Esc
            </kbd>{' '}
            to clear
          </div>
        </div>
      </form>

      {/* Demo login buttons */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-50 px-2 text-gray-500">
              Quick demo login
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleDemoLogin('admin')}
            disabled={isDisabled}
            className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Admin Demo
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin('user')}
            disabled={isDisabled}
            className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            User Demo
          </button>
        </div>
      </div>
    </div>
  );
}
