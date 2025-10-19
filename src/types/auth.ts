export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  lastLoginAt?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface AuthContextType {
  // State
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

export interface ValidationErrors {
  username?: string;
  password?: string;
  general?: string;
}

export interface LoginFormData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

// API Error types
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Session storage types
export interface StoredSession {
  token: string;
  user: User;
  expiresAt: number;
}

// Auth events for cross-tab communication
export interface AuthEvent {
  type: 'LOGIN' | 'LOGOUT' | 'TOKEN_REFRESH' | 'SESSION_EXPIRED';
  payload?: AuthResponse | User | string | null;
  timestamp: number;
}
