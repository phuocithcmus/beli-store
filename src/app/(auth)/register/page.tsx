'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

function RegisterPageContent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our clothing store community
          </p>
        </div>

        {/* Registration Form */}
        <RegisterForm />

        {/* Links */}
        <div className="space-y-2 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 transition-colors hover:text-blue-500 focus:underline focus:outline-none"
            >
              Sign in here
            </Link>
          </p>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{' '}
              <a
                href="#"
                className="text-blue-600 underline hover:text-blue-500"
                onClick={(e) => e.preventDefault()}
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="#"
                className="text-blue-600 underline hover:text-blue-500"
                onClick={(e) => e.preventDefault()}
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
