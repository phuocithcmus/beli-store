import type { User, AuthEvent } from '@/types/auth';
import { getStoredSession } from './token-storage';

/**
 * Cross-tab session synchronization utility
 * Handles authentication state synchronization across browser tabs
 */

// Custom event names for authentication events
const AUTH_EVENTS = {
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  TOKEN_REFRESH: 'auth:token_refresh',
  SESSION_EXPIRED: 'auth:session_expired',
} as const;

// Storage event key for session changes
const SESSION_STORAGE_KEY = 'auth_session';

/**
 * Session sync manager class
 */
export class SessionSyncManager {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private isInitialized = false;

  /**
   * Initialize session synchronization
   */
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    // Listen for storage events (cross-tab changes)
    window.addEventListener('storage', this.handleStorageEvent.bind(this));

    // Listen for custom auth events (same-tab changes)
    Object.values(AUTH_EVENTS).forEach((eventType) => {
      window.addEventListener(eventType, this.handleAuthEvent.bind(this));
    });

    this.isInitialized = true;
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    if (!this.isInitialized || typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('storage', this.handleStorageEvent.bind(this));

    Object.values(AUTH_EVENTS).forEach((eventType) => {
      window.removeEventListener(eventType, this.handleAuthEvent.bind(this));
    });

    this.listeners.clear();
    this.isInitialized = false;
  }

  /**
   * Subscribe to session sync events
   */
  subscribe(
    eventType: keyof typeof AUTH_EVENTS,
    callback: (data: AuthEvent) => void
  ): () => void {
    const eventName = AUTH_EVENTS[eventType];

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const wrappedCallback = (event: Event) => {
      if (event instanceof CustomEvent) {
        callback(event.detail);
      }
    };

    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.add(wrappedCallback);
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventName);
      if (listeners) {
        listeners.delete(wrappedCallback);
      }
    };
  }

  /**
   * Emit authentication event to all tabs
   */
  emit(
    eventType: keyof typeof AUTH_EVENTS,
    payload?: User | string | null
  ): void {
    if (typeof window === 'undefined') {
      return;
    }

    const event: AuthEvent = {
      type: eventType,
      payload,
      timestamp: Date.now(),
    };

    // Dispatch custom event for same-tab listeners
    window.dispatchEvent(
      new CustomEvent(AUTH_EVENTS[eventType], {
        detail: event,
      })
    );

    // For cross-tab sync, we rely on localStorage changes
    // which are already handled by the token-storage module
  }

  /**
   * Handle storage events from other tabs
   */
  private handleStorageEvent(event: StorageEvent): void {
    if (event.key !== SESSION_STORAGE_KEY) {
      return;
    }

    if (event.newValue) {
      // Session was created/updated in another tab
      const session = this.parseSessionData(event.newValue);
      if (session) {
        this.emit('LOGIN', session.user);
      }
    } else {
      // Session was cleared in another tab
      this.emit('LOGOUT', 'cross_tab_logout');
    }
  }

  /**
   * Handle custom auth events
   */
  private handleAuthEvent(event: Event): void {
    if (!(event instanceof CustomEvent)) {
      return;
    }

    // Notify subscribers
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((callback) => {
        callback(event);
      });
    }
  }

  /**
   * Parse session data safely
   */
  private parseSessionData(data: string): { user: User; token: string } | null {
    try {
      const parsed = JSON.parse(data);
      if (parsed.user && parsed.token) {
        return parsed;
      }
    } catch {
      // Invalid JSON
    }
    return null;
  }

  /**
   * Check if current session is in sync with stored session
   */
  isSessionInSync(
    currentUser: User | null,
    currentToken: string | null
  ): boolean {
    const storedSession = getStoredSession();

    if (!storedSession && !currentUser) {
      return true; // Both are null/empty
    }

    if (!storedSession || !currentUser) {
      return false; // One is null, other is not
    }

    return (
      storedSession.user.id === currentUser.id &&
      storedSession.token === currentToken
    );
  }

  /**
   * Force sync with stored session
   */
  syncWithStoredSession(): { user: User; token: string } | null {
    const storedSession = getStoredSession();

    if (!storedSession) {
      return null;
    }

    // Emit login event to sync all tabs
    this.emit('LOGIN', storedSession.user);

    return {
      user: storedSession.user,
      token: storedSession.token,
    };
  }
}

// Create singleton instance
const sessionSyncManager = new SessionSyncManager();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  sessionSyncManager.init();
}

/**
 * Hook-like API for easier integration
 */
export function useSessionSync() {
  return {
    /**
     * Subscribe to login events across tabs
     */
    onLogin: (callback: (user: User) => void) => {
      return sessionSyncManager.subscribe('LOGIN', (event) => {
        if (
          event.payload &&
          typeof event.payload === 'object' &&
          'id' in event.payload
        ) {
          callback(event.payload as User);
        }
      });
    },

    /**
     * Subscribe to logout events across tabs
     */
    onLogout: (callback: (reason?: string) => void) => {
      return sessionSyncManager.subscribe('LOGOUT', (event) => {
        const reason =
          typeof event.payload === 'string' ? event.payload : undefined;
        callback(reason);
      });
    },

    /**
     * Subscribe to token refresh events across tabs
     */
    onTokenRefresh: (callback: (user: User) => void) => {
      return sessionSyncManager.subscribe('TOKEN_REFRESH', (event) => {
        if (
          event.payload &&
          typeof event.payload === 'object' &&
          'id' in event.payload
        ) {
          callback(event.payload as User);
        }
      });
    },

    /**
     * Subscribe to session expired events across tabs
     */
    onSessionExpired: (callback: () => void) => {
      return sessionSyncManager.subscribe('SESSION_EXPIRED', () => {
        callback();
      });
    },

    /**
     * Trigger login event
     */
    triggerLogin: (user: User) => {
      sessionSyncManager.emit('LOGIN', user);
    },

    /**
     * Trigger logout event
     */
    triggerLogout: (reason?: string) => {
      sessionSyncManager.emit('LOGOUT', reason);
    },

    /**
     * Trigger token refresh event
     */
    triggerTokenRefresh: (user: User) => {
      sessionSyncManager.emit('TOKEN_REFRESH', user);
    },

    /**
     * Trigger session expired event
     */
    triggerSessionExpired: () => {
      sessionSyncManager.emit('SESSION_EXPIRED');
    },

    /**
     * Check if session is in sync
     */
    isInSync: (currentUser: User | null, currentToken: string | null) => {
      return sessionSyncManager.isSessionInSync(currentUser, currentToken);
    },

    /**
     * Force sync with stored session
     */
    forceSync: () => {
      return sessionSyncManager.syncWithStoredSession();
    },
  };
}

// Export the manager for advanced usage
export { sessionSyncManager };

// Export for cleanup (useful in tests or when unmounting)
export const cleanupSessionSync = () => {
  sessionSyncManager.destroy();
};

export default sessionSyncManager;
