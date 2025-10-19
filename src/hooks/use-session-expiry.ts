import { useEffect, useState } from 'react';
import { getStoredToken } from '../lib/token-storage';
import { useAuth } from '../contexts/auth-context';

interface UseSessionExpiryOptions {
  onSessionExpired?: () => void;
  checkInterval?: number; // in milliseconds
  warningThreshold?: number; // in minutes before expiry
}

interface SessionExpiryState {
  isExpired: boolean;
  isNearExpiry: boolean;
  timeUntilExpiry: number | null; // in minutes
}

export function useSessionExpiry(options: UseSessionExpiryOptions = {}) {
  const {
    onSessionExpired,
    checkInterval = 60000, // Check every minute
    warningThreshold = 5, // Warn 5 minutes before expiry
  } = options;

  const { logout } = useAuth();
  const [sessionState, setSessionState] = useState<SessionExpiryState>({
    isExpired: false,
    isNearExpiry: false,
    timeUntilExpiry: null,
  });

  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = getStoredToken();

      if (!token) {
        setSessionState({
          isExpired: true,
          isNearExpiry: false,
          timeUntilExpiry: null,
        });
        return;
      }

      try {
        // Decode JWT token to get expiry time
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = Math.floor(
          (expiryTime - currentTime) / (1000 * 60)
        ); // Minutes

        const isExpired = expiryTime <= currentTime;
        const isNearExpiry =
          timeUntilExpiry <= warningThreshold && timeUntilExpiry > 0;

        setSessionState({
          isExpired,
          isNearExpiry,
          timeUntilExpiry: isExpired ? 0 : timeUntilExpiry,
        });

        // Handle expired session
        if (isExpired) {
          onSessionExpired?.();
          logout();
        }
      } catch (error) {
        // Invalid token format
        setSessionState({
          isExpired: true,
          isNearExpiry: false,
          timeUntilExpiry: null,
        });
        onSessionExpired?.();
        logout();
      }
    };

    // Initial check
    checkTokenExpiry();

    // Set up interval for periodic checks
    const interval = setInterval(checkTokenExpiry, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval, warningThreshold]);

  return sessionState;
}
