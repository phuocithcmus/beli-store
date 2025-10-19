'use client';

import { useEffect, useState } from 'react';
import { useSessionExpiry } from '../../hooks/use-session-expiry';
import { useAuth } from '../../contexts/auth-context';

interface SessionExpiryNotificationProps {
  onExtendSession?: () => void;
  className?: string;
}

export function SessionExpiryNotification({
  onExtendSession,
  className = '',
}: SessionExpiryNotificationProps) {
  const { refreshToken } = useAuth();
  const [showNotification, setShowNotification] = useState(false);

  const { isNearExpiry, timeUntilExpiry } = useSessionExpiry({
    warningThreshold: 5, // Show warning 5 minutes before expiry
    onSessionExpired: () => {
      setShowNotification(false);
    },
  });

  useEffect(() => {
    setShowNotification(isNearExpiry);
  }, [isNearExpiry]);

  const handleExtendSession = async () => {
    try {
      await refreshToken();
      onExtendSession?.();
      setShowNotification(false);
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification || !timeUntilExpiry) {
    return null;
  }

  return (
    <div className={`fixed right-4 top-4 z-50 ${className}`}>
      <div className="max-w-sm rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Session Expiring Soon
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Your session will expire in {timeUntilExpiry} minute
              {timeUntilExpiry !== 1 ? 's' : ''}. Would you like to extend it?
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleExtendSession}
                className="inline-flex items-center rounded border border-transparent bg-yellow-100 px-3 py-1.5 text-xs font-medium text-yellow-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Extend Session
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center rounded border border-transparent bg-transparent px-3 py-1.5 text-xs font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
