import { z } from 'zod';

// Login form validation schema
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .refine(
      (value) => {
        // Allow email format or username format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
        return emailRegex.test(value) || usernameRegex.test(value);
      },
      {
        message:
          'Username must be a valid email or contain only letters, numbers, dots, hyphens, and underscores',
      }
    ),

  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),

  rememberMe: z.boolean().optional().default(false),
});

// Infer the TypeScript type from the schema
export type LoginFormData = z.infer<typeof loginSchema>;

// Password strength validation (for enhanced validation)
export const passwordStrengthSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^a-zA-Z0-9]/,
    'Password must contain at least one special character'
  );

// Enhanced login schema with real-time validation feedback
export const enhancedLoginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .refine(
      (value) => {
        // Allow email format or username format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
        return emailRegex.test(value) || usernameRegex.test(value);
      },
      {
        message:
          'Username must be a valid email or contain only letters, numbers, dots, hyphens, and underscores',
      }
    )
    .refine(
      (value) => {
        // Check for common invalid patterns
        return (
          !value.includes('..') &&
          !value.startsWith('.') &&
          !value.endsWith('.')
        );
      },
      {
        message:
          'Username cannot start or end with dots, or contain consecutive dots',
      }
    ),

  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
    .refine(
      (value) => {
        // Check for common weak passwords
        const commonPasswords = ['password', '123456', 'qwerty', 'abc123'];
        return !commonPasswords.includes(value.toLowerCase());
      },
      {
        message: 'Password is too common. Please choose a stronger password.',
      }
    ),

  rememberMe: z.boolean().optional().default(false),
});

// Password strength checker utility
export interface PasswordStrength {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  feedback: string[];
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumbers: boolean;
  hasSpecialChars: boolean;
  isLongEnough: boolean;
  isNotCommon: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);
  const isLongEnough = password.length >= 8;

  const commonPasswords = [
    'password',
    '123456',
    'qwerty',
    'abc123',
    'password123',
    '12345678',
  ];
  const isNotCommon = !commonPasswords.includes(password.toLowerCase());

  let score = 0;

  if (password.length >= 6) {
    score += 1;
  }
  if (isLongEnough) {
    score += 1;
  }
  if (hasLowercase && hasUppercase) {
    score += 1;
  }
  if (hasNumbers) {
    score += 1;
  }
  if (hasSpecialChars) {
    score += 1;
  }
  if (isNotCommon) {
    score = Math.max(score, 1);
  } else {
    score = Math.max(score - 1, 0);
  }

  // Generate feedback
  if (password.length === 0) {
    feedback.push('Password is required');
  } else {
    if (password.length < 6) {
      feedback.push('Too short (minimum 6 characters)');
    } else if (password.length < 8) {
      feedback.push('Consider using at least 8 characters');
    }

    if (!hasLowercase) {
      feedback.push('Add lowercase letters');
    }
    if (!hasUppercase) {
      feedback.push('Add uppercase letters');
    }
    if (!hasNumbers) {
      feedback.push('Add numbers');
    }
    if (!hasSpecialChars) {
      feedback.push('Add special characters (!@#$%^&*)');
    }
    if (!isNotCommon) {
      feedback.push('Avoid common passwords');
    }

    if (score >= 4) {
      feedback.push('Strong password! 💪');
    } else if (score >= 3) {
      feedback.push('Good password! Consider adding more complexity');
    } else if (score >= 2) {
      feedback.push('Fair password. Could be stronger');
    } else if (score >= 1) {
      feedback.push('Weak password. Please strengthen it');
    } else {
      feedback.push('Very weak password');
    }
  }

  return {
    score: Math.min(score, 4),
    feedback,
    hasLowercase,
    hasUppercase,
    hasNumbers,
    hasSpecialChars,
    isLongEnough,
    isNotCommon,
  };
}

// Username validation utilities
export function validateUsernameFormat(username: string): {
  isValid: boolean;
  feedback: string[];
} {
  const feedback: string[] = [];

  if (username.length === 0) {
    feedback.push('Username is required');
    return { isValid: false, feedback };
  }

  if (username.length < 3) {
    feedback.push('Username too short (minimum 3 characters)');
  }

  if (username.length > 50) {
    feedback.push('Username too long (maximum 50 characters)');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRegex = /^[a-zA-Z0-9_.-]+$/;

  const isEmail = emailRegex.test(username);
  const isValidUsername = usernameRegex.test(username);

  if (!isEmail && !isValidUsername) {
    feedback.push(
      'Use email format or alphanumeric characters with dots, hyphens, underscores'
    );
  }

  if (username.includes('..')) {
    feedback.push('Cannot contain consecutive dots');
  }

  if (username.startsWith('.') || username.endsWith('.')) {
    feedback.push('Cannot start or end with dots');
  }

  if (isEmail) {
    feedback.push('✓ Valid email format');
  } else if (isValidUsername && feedback.length === 0) {
    feedback.push('✓ Valid username format');
  }

  return {
    isValid: feedback.filter((f) => !f.startsWith('✓')).length === 0,
    feedback,
  };
}

// Enhanced login schema with stronger password validation
export const strongPasswordLoginSchema = enhancedLoginSchema.extend({
  password: passwordStrengthSchema,
});

// Registration/user creation schema (for future use)
export const userRegistrationSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address')
      .max(100, 'Email must be less than 100 characters'),

    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),

    password: passwordStrengthSchema,

    confirmPassword: z.string().min(1, 'Please confirm your password'),

    role: z.enum(['user', 'admin']).default('user'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type UserRegistrationData = z.infer<typeof userRegistrationSchema>;

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

export type PasswordResetRequestData = z.infer<
  typeof passwordResetRequestSchema
>;

// Password reset schema
export const passwordResetSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordStrengthSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordResetData = z.infer<typeof passwordResetSchema>;

// Helper function to get all validation errors
export function getValidationErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Record<string, string> {
  try {
    schema.parse(data);
    return {};
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path[0] as string] = err.message;
        }
      });
      return errors;
    }
    return { general: 'Validation failed' };
  }
}
