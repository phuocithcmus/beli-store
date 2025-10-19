'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import type {
  AuthContextType,
  AuthState,
  LoginCredentials,
  RegisterData,
  User,
} from '@/types/auth';
import { apiClient } from '@/lib/api-client';
import {
  initializeSession,
  setStoredSession,
  clearStoredSession,
  setupCrossTabSync,
  hasValidSession,
} from '@/lib/token-storage';
import { SessionExpiryNotification } from '@/components/auth/session-expiry-notification';

// Initial auth state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true, // Start with loading true during initialization
  error: null,
};

// Auth action types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTHENTICATED'; payload: { user: User; token: string } }
  | { type: 'SET_UNAUTHENTICATED' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User };

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null,
      };

    case 'SET_UNAUTHENTICATED':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'UPDATE_USER':
      return { ...state, user: action.payload };

    default:
      return state;
  }
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Initialize authentication from stored session
  const initializeAuth = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Try to restore session from storage
      const storedSession = initializeSession();

      if (storedSession) {
        // Validate the session with the server
        try {
          const response = await apiClient.auth.validateToken();

          if (response.valid) {
            dispatch({
              type: 'SET_AUTHENTICATED',
              payload: {
                user: response.user,
                token: storedSession.token,
              },
            });
            return;
          }
        } catch (error) {
          console.warn('Session validation failed:', error);

          clearStoredSession();
        }
      }

      // No valid session found
      dispatch({ type: 'SET_UNAUTHENTICATED' });
    } catch (error) {
      console.error('Auth initialization failed:', error);
      dispatch({ type: 'SET_UNAUTHENTICATED' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await apiClient.auth.login(credentials);

      console.log('Login response:', response);

      // Store session data (no refresh token from this backend)
      setStoredSession(response.access_token, response.user);

      // Update state
      dispatch({
        type: 'SET_AUTHENTICATED',
        payload: {
          user: response.user,
          token: response.access_token,
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Login failed. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error; // Re-throw for component handling
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Register function
  const register = useCallback(async (data: RegisterData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await apiClient.auth.register(data);

      // Store session data (auto-login after registration)
      setStoredSession(response.access_token, response.user);

      // Update state
      dispatch({
        type: 'SET_AUTHENTICATED',
        payload: {
          user: response.user,
          token: response.access_token,
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error; // Re-throw for component handling
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate session on server
      if (state.isAuthenticated) {
        await apiClient.auth.logout();
      }
    } catch (error) {
      console.warn('Server logout failed:', error);
      // Continue with client logout even if server call fails
    } finally {
      // Clear local session
      clearStoredSession();
      dispatch({ type: 'SET_UNAUTHENTICATED' });

      // Redirect to login page
      router.push('/login');
    }
  }, [state.isAuthenticated, router]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      if (!state.token) {
        throw new Error('No token to refresh');
      }

      const response = await apiClient.auth.refreshToken(state.token);

      // Store new session data
      setStoredSession(response.access_token, response.user);

      // Update state
      dispatch({
        type: 'SET_AUTHENTICATED',
        payload: {
          user: response.user,
          token: response.access_token,
        },
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  }, [state.token, logout]);

  // Check auth status (useful for manual validation)
  const checkAuthStatus = useCallback(async () => {
    try {
      if (!hasValidSession()) {
        dispatch({ type: 'SET_UNAUTHENTICATED' });
        return;
      }

      const response = await apiClient.auth.validateToken();

      if (response.valid) {
        dispatch({
          type: 'UPDATE_USER',
          payload: response.user,
        });
      } else {
        await logout();
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      await logout();
    }
  }, [logout]);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Handle cross-tab authentication sync
  useEffect(() => {
    const handleLogin = (user: User, token: string) => {
      dispatch({
        type: 'SET_AUTHENTICATED',
        payload: { user, token },
      });
    };

    const handleLogout = () => {
      dispatch({ type: 'SET_UNAUTHENTICATED' });
    };

    const cleanup = setupCrossTabSync(handleLogin, handleLogout);

    return cleanup;
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Context value
  const contextValue: AuthContextType = {
    // State
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    refreshToken,
    clearError,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      {state.isAuthenticated && <SessionExpiryNotification />}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// Hook to get current user (with type safety)
export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

// Hook to check if user is authenticated
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

// Hook to check if auth is loading
export function useAuthLoading(): boolean {
  const { isLoading } = useAuth();
  return isLoading;
}

// Export the auth context for advanced usage
export { AuthContext };
