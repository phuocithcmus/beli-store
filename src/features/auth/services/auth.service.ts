import { apiClient } from '@/lib/api-client';
import type { LoginCredentials, AuthResponse, User } from '@/types/auth';

/**
 * Authentication service for handling API calls
 * This service wraps the API client methods and provides
 * additional error handling and data transformation
 */
export class AuthService {
  /**
   * Authenticate user with username and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.auth.login(credentials);
      return response;
    } catch (error) {
      // Transform API errors into user-friendly messages
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Invalid username or password');
        }
        if (error.message.includes('404')) {
          throw new Error('User not found');
        }
        if (error.message.includes('429')) {
          throw new Error('Too many login attempts. Please try again later.');
        }
        if (error.message.includes('500')) {
          throw new Error('Server error. Please try again later.');
        }
      }
      throw error;
    }
  }

  /**
   * Register a new user account
   */
  static async register(data: {
    email: string;
    name: string;
    password: string;
    role?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await apiClient.auth.register(data);
      return response;
    } catch (error) {
      // Transform API errors into user-friendly messages
      if (error instanceof Error) {
        if (error.message.includes('User with this email already exists')) {
          throw new Error('An account with this email already exists');
        }
        if (error.message.includes('400')) {
          throw new Error(
            'Invalid registration data. Please check your inputs.'
          );
        }
        if (error.message.includes('429')) {
          throw new Error(
            'Too many registration attempts. Please try again later.'
          );
        }
        if (error.message.includes('500')) {
          throw new Error('Server error. Please try again later.');
        }
      }
      throw error;
    }
  }

  /**
   * Log out the current user
   */
  static async logout(): Promise<void> {
    try {
      await apiClient.auth.logout();
    } catch (error) {
      // Logout should succeed even if server call fails
      console.warn('Server logout failed:', error);
    }
  }

  /**
   * Refresh the authentication token
   */
  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.auth.refreshToken(refreshToken);
      return response;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Refresh token expired. Please log in again.');
        }
      }
      throw error;
    }
  }

  /**
   * Validate the current token
   */
  static async validateToken(): Promise<{ valid: boolean; user: User | null }> {
    try {
      const response = await apiClient.auth.validateToken();
      return { valid: response.valid, user: response.user };
    } catch (error) {
      return { valid: false, user: null };
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<User> {
    try {
      const response = await apiClient.auth.getProfile();
      return response;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Authentication required');
        }
      }
      throw error;
    }
  }

  /**
   * Seed default users (development only)
   */
  static async seedUsers(): Promise<{ message: string }> {
    try {
      const response = await apiClient.auth.seedUsers();
      return response;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          throw new Error('Not authorized to seed users');
        }
      }
      throw error;
    }
  }

  /**
   * Check if the authentication API is available
   */
  static async checkHealth(): Promise<boolean> {
    try {
      // Try to call a simple endpoint to check connectivity
      await apiClient.auth.validateToken();
      return true;
    } catch {
      return false;
    }
  }
}

// Export default instance for convenience
export default AuthService;
