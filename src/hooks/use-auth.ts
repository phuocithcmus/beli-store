// Re-export the authentication hooks from the auth context
// This provides a cleaner API and allows for future hook composition

export {
  useAuth,
  useUser,
  useIsAuthenticated,
  useAuthLoading,
} from '@/contexts/auth-context';

// Additional convenience hooks can be added here in the future
// For example:
// - useRequireAuth (redirect if not authenticated)
// - usePermissions (check user permissions)
// - useAuthRedirect (handle post-login redirects)
