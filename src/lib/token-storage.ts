import type { User, StoredSession, TokenPayload } from '@/types/auth';

// Storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const SESSION_KEY = 'auth_session';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

// Token expiration buffer (refresh token 1 minute before expiry)
const TOKEN_EXPIRY_BUFFER = 1 * 60 * 1000; // 1 minute in milliseconds

/**
 * Safely parse JSON with error handling
 */
function safeParse<T>(jsonString: string | null): T | null {
  if (!jsonString) {
    return null;
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Get cookie value by name
 */
export function getCookie(name: string): string | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get stored authentication token
 */
export function getStoredToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Get stored user data
 */
export function getStoredUser(): User | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const userString = localStorage.getItem(USER_KEY);
    return safeParse<User>(userString);
  } catch {
    return null;
  }
}

/**
 * Get stored session data
 */
export function getStoredSession(): StoredSession | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const sessionString = localStorage.getItem(SESSION_KEY);
    return safeParse<StoredSession>(sessionString);
  } catch {
    return null;
  }
}

/**
 * Get stored refresh token
 */
export function getStoredRefreshToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Set HTTP cookie for server-side access
 */
function setCookie(name: string, value: string, expiresAt?: number): void {
  if (!isBrowser()) {
    return;
  }

  try {
    let cookieString = `${name}=${value}; path=/; SameSite=Lax`;

    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      cookieString += `; expires=${expiryDate.toUTCString()}`;
    }

    // Set secure flag in production
    if (window.location.protocol === 'https:') {
      cookieString += '; Secure';
    }

    document.cookie = cookieString;
  } catch (error) {
    console.error('Failed to set cookie:', error);
  }
}

/**
 * Store authentication session data
 */
export function setStoredSession(
  token: string,
  user: User,
  refreshToken?: string
): void {
  if (!isBrowser()) {
    return;
  }

  try {
    // Parse token to get expiration
    const tokenPayload = parseJWTPayload(token);
    const expiresAt = tokenPayload?.exp
      ? tokenPayload.exp * 1000
      : Date.now() + 24 * 60 * 60 * 1000; // Default 24h

    // Store individual items in localStorage
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    // Store complete session in localStorage
    const session: StoredSession = {
      token,
      user,
      expiresAt,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // Also set HTTP cookies for middleware access
    setCookie(TOKEN_KEY, token, expiresAt);
    setCookie(USER_KEY, JSON.stringify(user), expiresAt);

    if (refreshToken) {
      setCookie(REFRESH_TOKEN_KEY, refreshToken, expiresAt);
    }

    // Trigger storage event for cross-tab sync
    window.dispatchEvent(
      new CustomEvent('auth:login', {
        detail: { user, token },
      })
    );
  } catch (error) {
    console.error('Failed to store session:', error);
  }
}

/**
 * Clear HTTP cookie
 */
function clearCookie(name: string): void {
  if (!isBrowser()) {
    return;
  }

  try {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  } catch (error) {
    console.error('Failed to clear cookie:', error);
  }
}

/**
 * Clear all stored authentication data
 */
export function clearStoredSession(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    // Clear HTTP cookies
    clearCookie(TOKEN_KEY);
    clearCookie(USER_KEY);
    clearCookie(REFRESH_TOKEN_KEY);

    // Trigger storage event for cross-tab sync
    window.dispatchEvent(
      new CustomEvent('auth:logout', {
        detail: { reason: 'manual_logout' },
      })
    );
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

/**
 * Check if the current token is expired or about to expire
 */
export function isTokenExpired(token?: string | null): boolean {
  if (!token) {
    return true;
  }

  try {
    const payload = parseJWTPayload(token);
    if (!payload?.exp) {
      return true;
    }

    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    // Consider token expired if it expires within the buffer time
    return currentTime >= expirationTime - TOKEN_EXPIRY_BUFFER;
  } catch {
    return true;
  }
}

/**
 * Parse JWT payload without verification (for client-side token inspection)
 */
export function parseJWTPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));

    return JSON.parse(decoded) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Get time until token expiration (in milliseconds)
 */
export function getTimeUntilExpiration(token?: string | null): number {
  if (!token) {
    return 0;
  }

  try {
    const payload = parseJWTPayload(token);
    if (!payload?.exp) {
      return 0;
    }

    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();

    return Math.max(0, expirationTime - currentTime);
  } catch {
    return 0;
  }
}

/**
 * Check if we have a valid stored session
 */
export function hasValidSession(): boolean {
  const token = getStoredToken();
  const user = getStoredUser();

  return Boolean(token && user && !isTokenExpired(token));
}

/**
 * Initialize session from stored data
 */
export function initializeSession(): { token: string; user: User } | null {
  if (!isBrowser()) {
    return null;
  }

  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) {
    clearStoredSession();
    return null;
  }

  if (isTokenExpired(token)) {
    clearStoredSession();
    return null;
  }

  return { token, user };
}

/**
 * Set up cross-tab session synchronization
 */
export function setupCrossTabSync(
  onLogin: (user: User, token: string) => void,
  onLogout: (reason?: string) => void
): () => void {
  if (!isBrowser()) {
    return () => {};
  }

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === SESSION_KEY) {
      if (event.newValue) {
        // Session was created/updated in another tab
        const session = safeParse<StoredSession>(event.newValue);
        if (session && !isTokenExpired(session.token)) {
          onLogin(session.user, session.token);
        }
      } else {
        // Session was cleared in another tab
        onLogout('cross_tab_logout');
      }
    }
  };

  const handleAuthEvents = (event: CustomEvent) => {
    switch (event.type) {
      case 'auth:login':
        if (event.detail?.user && event.detail?.token) {
          onLogin(event.detail.user, event.detail.token);
        }
        break;
      case 'auth:logout':
        onLogout(event.detail?.reason || 'unknown');
        break;
    }
  };

  // Listen for storage changes (cross-tab)
  window.addEventListener('storage', handleStorageChange);

  // Listen for custom auth events (same-tab)
  window.addEventListener('auth:login', handleAuthEvents as EventListener);
  window.addEventListener('auth:logout', handleAuthEvents as EventListener);

  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('auth:login', handleAuthEvents as EventListener);
    window.removeEventListener(
      'auth:logout',
      handleAuthEvents as EventListener
    );
  };
}
