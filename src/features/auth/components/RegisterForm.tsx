'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserPlus, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import {
  userRegistrationSchema,
  type UserRegistrationData,
  checkPasswordStrength,
} from '@/features/auth/validation/auth.schemas';
import { ValidationError } from '@/features/auth/components/ValidationError';

interface RegisterFormProps {
  redirectTo?: string;
  initialMessage?: string;
}

export function RegisterForm({
  redirectTo,
  initialMessage,
}: RegisterFormProps) {
  const searchParams = useSearchParams();
  const {
    register: registerUser,
    isLoading,
    error: authError,
    clearError,
  } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    clearErrors,
    reset,
    watch,
  } = useForm<UserRegistrationData>({
    resolver: zodResolver(userRegistrationSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
      role: 'user',
    },
  });

  const password = watch('password');
  const passwordStrength = password ? checkPasswordStrength(password) : null;

  // Clear auth errors when component mounts or when user starts typing
  useEffect(() => {
    clearError();
  }, [clearError]);

  const displayError = authError || errors.root?.message;
  const isDisabled = isLoading || isSubmitting;

  // Handle form submission
  const onSubmit = useCallback(
    async (data: UserRegistrationData) => {
      try {
        setIsSubmitting(true);
        clearErrors();
        clearError();

        // Attempt registration
        await registerUser({
          email: data.email,
          name: data.name,
          password: data.password,
          role: data.role,
        });

        // Success - redirect to dashboard or specified redirect URL
        const redirectUrl = redirectTo || searchParams.get('redirect') || '/';
        window.location.href = redirectUrl;
      } catch (error) {
        console.error('Registration error:', error);
        // Error is handled by the auth context
        // But we can add form-specific error handling here
        if (error instanceof Error) {
          if (error.message.includes('already exists')) {
            setError('email', {
              message: 'An account with this email already exists',
            });
          } else if (error.message.includes('Invalid registration data')) {
            setError('root', {
              message: 'Please check your registration information',
            });
          } else {
            setError('root', { message: error.message });
          }
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [registerUser, redirectTo, searchParams, clearErrors, clearError, setError]
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

      {/* Registration form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
        aria-label="Registration form"
      >
        {/* Email field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email Address
          </label>
          <div className="mt-1">
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              required
              disabled={isDisabled}
              className={`
                relative block w-full appearance-none rounded-md border px-3 py-2 
                text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 
                focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm
                ${
                  errors.email
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }
                ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
              `}
              placeholder="Enter your email address"
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
            />
          </div>
          {errors.email && (
            <ValidationError message={errors.email.message} className="mt-1" />
          )}
        </div>

        {/* Name field */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Full Name
          </label>
          <div className="mt-1">
            <input
              {...register('name')}
              id="name"
              type="text"
              autoComplete="name"
              required
              disabled={isDisabled}
              className={`
                relative block w-full appearance-none rounded-md border px-3 py-2 
                text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 
                focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm
                ${
                  errors.name
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }
                ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
              `}
              placeholder="Enter your full name"
              aria-describedby={errors.name ? 'name-error' : undefined}
              aria-invalid={!!errors.name}
            />
          </div>
          {errors.name && (
            <ValidationError message={errors.name.message} className="mt-1" />
          )}
        </div>

        {/* Password field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="mt-1">
            <input
              {...register('password')}
              id="password"
              type="password"
              autoComplete="new-password"
              required
              disabled={isDisabled}
              onFocus={() => setShowPasswordRequirements(true)}
              onBlur={() => setShowPasswordRequirements(false)}
              className={`
                relative block w-full appearance-none rounded-md border px-3 py-2 
                text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 
                focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm
                ${
                  errors.password
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }
                ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
              `}
              placeholder="Enter a strong password"
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
            />
          </div>

          {/* Password strength indicator */}
          {passwordStrength && password.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="h-2 flex-1 rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.score === 0
                        ? 'w-1/5 bg-red-500'
                        : passwordStrength.score === 1
                          ? 'w-2/5 bg-orange-500'
                          : passwordStrength.score === 2
                            ? 'w-3/5 bg-yellow-500'
                            : passwordStrength.score === 3
                              ? 'w-4/5 bg-blue-500'
                              : 'w-full bg-green-500'
                    }`}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">
                  {passwordStrength.score < 2
                    ? 'Weak'
                    : passwordStrength.score < 4
                      ? 'Good'
                      : 'Strong'}
                </span>
              </div>
            </div>
          )}

          {/* Password requirements */}
          {(showPasswordRequirements || errors.password) &&
            passwordStrength && (
              <div className="mt-2 space-y-1 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={`flex items-center ${passwordStrength.isLongEnough ? 'text-green-600' : 'text-gray-500'}`}
                  >
                    {passwordStrength.isLongEnough ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <X className="mr-1 h-3 w-3" />
                    )}
                    8+ characters
                  </div>
                  <div
                    className={`flex items-center ${passwordStrength.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}
                  >
                    {passwordStrength.hasLowercase ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <X className="mr-1 h-3 w-3" />
                    )}
                    Lowercase
                  </div>
                  <div
                    className={`flex items-center ${passwordStrength.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}
                  >
                    {passwordStrength.hasUppercase ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <X className="mr-1 h-3 w-3" />
                    )}
                    Uppercase
                  </div>
                  <div
                    className={`flex items-center ${passwordStrength.hasNumbers ? 'text-green-600' : 'text-gray-500'}`}
                  >
                    {passwordStrength.hasNumbers ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <X className="mr-1 h-3 w-3" />
                    )}
                    Numbers
                  </div>
                  <div
                    className={`flex items-center ${passwordStrength.hasSpecialChars ? 'text-green-600' : 'text-gray-500'}`}
                  >
                    {passwordStrength.hasSpecialChars ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <X className="mr-1 h-3 w-3" />
                    )}
                    Special chars
                  </div>
                  <div
                    className={`flex items-center ${passwordStrength.isNotCommon ? 'text-green-600' : 'text-gray-500'}`}
                  >
                    {passwordStrength.isNotCommon ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <X className="mr-1 h-3 w-3" />
                    )}
                    Not common
                  </div>
                </div>
              </div>
            )}

          {errors.password && (
            <ValidationError
              message={errors.password.message}
              className="mt-1"
            />
          )}
        </div>

        {/* Confirm Password field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm Password
          </label>
          <div className="mt-1">
            <input
              {...register('confirmPassword')}
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              disabled={isDisabled}
              className={`
                relative block w-full appearance-none rounded-md border px-3 py-2 
                text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 
                focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm
                ${
                  errors.confirmPassword
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }
                ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
              `}
              placeholder="Confirm your password"
              aria-describedby={
                errors.confirmPassword ? 'confirmPassword-error' : undefined
              }
              aria-invalid={!!errors.confirmPassword}
            />
          </div>
          {errors.confirmPassword && (
            <ValidationError
              message={errors.confirmPassword.message}
              className="mt-1"
            />
          )}
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
                <UserPlus className="h-5 w-5" />
              )}
            </span>
            {isSubmitting || isLoading ? (
              <span className="ml-3">
                {isSubmitting ? 'Creating account...' : 'Processing...'}
              </span>
            ) : (
              <span className="ml-3">Create Account</span>
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
    </div>
  );
}
