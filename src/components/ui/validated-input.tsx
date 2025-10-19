'use client';

import { forwardRef, useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ValidationError,
  PasswordStrengthIndicator,
} from '@/features/auth/components/ValidationError';
import {
  checkPasswordStrength,
  validateUsernameFormat,
  type PasswordStrength,
} from '@/features/auth/validation/auth.schemas';

interface ValidatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  errors?: string[];
  showValidation?: boolean;
  realTimeValidation?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

// Base validated input component
export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    {
      label,
      error,
      errors = [],
      className,
      showValidation = true,
      realTimeValidation = false,
      onValidationChange,
      ...props
    },
    ref
  ) => {
    const [touched, setTouched] = useState(false);

    const hasError = error || errors.length > 0;
    const shouldShowError = touched || !realTimeValidation;

    useEffect(() => {
      if (onValidationChange) {
        onValidationChange(!hasError);
      }
    }, [hasError, onValidationChange]);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      props.onBlur?.(e);
    };

    return (
      <div className="space-y-1">
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
        <input
          ref={ref}
          {...props}
          onBlur={handleBlur}
          className={cn(
            'block w-full appearance-none rounded-md border px-3 py-2 shadow-sm',
            'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
            'text-sm transition-colors',
            hasError && shouldShowError
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            props.disabled && 'cursor-not-allowed bg-gray-50',
            className
          )}
        />
        {showValidation && shouldShowError && (
          <ValidationError message={error} messages={errors} />
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

// Username input with real-time validation
interface UsernameInputProps extends Omit<ValidatedInputProps, 'type'> {
  showFormatHelp?: boolean;
}

export const UsernameInput = forwardRef<HTMLInputElement, UsernameInputProps>(
  (
    {
      showFormatHelp = true,
      realTimeValidation = true,
      onValidationChange,
      ...props
    },
    ref
  ) => {
    const [feedback, setFeedback] = useState<string[]>([]);
    const [isValid, setIsValid] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (realTimeValidation && value) {
        const validation = validateUsernameFormat(value);
        setFeedback(validation.feedback);
        setIsValid(validation.isValid);
        onValidationChange?.(validation.isValid);
      } else {
        setFeedback([]);
        setIsValid(true);
        onValidationChange?.(true);
      }

      props.onChange?.(e);
    };

    return (
      <div className="space-y-1">
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700"
        >
          {props.label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={ref}
            {...props}
            type="text"
            onChange={handleChange}
            className={cn(
              'block w-full appearance-none rounded-md border py-2 pl-10 pr-3 shadow-sm',
              'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
              'text-sm transition-colors',
              props.error || (!isValid && feedback.length > 0)
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : isValid && feedback.some((f) => f.startsWith('✓'))
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
              props.disabled && 'cursor-not-allowed bg-gray-50',
              props.className
            )}
          />
        </div>

        {props.showValidation && props.error && (
          <ValidationError message={props.error} />
        )}

        {realTimeValidation && feedback.length > 0 && (
          <div className="space-y-1">
            {feedback.map((message, index) => (
              <ValidationError
                key={index}
                message={message}
                type={message.startsWith('✓') ? 'success' : 'error'}
                showIcon={false}
              />
            ))}
          </div>
        )}

        {showFormatHelp && !props.value && (
          <p className="text-xs text-gray-500">
            Use your email address or a username with letters, numbers, dots,
            hyphens, and underscores
          </p>
        )}
      </div>
    );
  }
);

UsernameInput.displayName = 'UsernameInput';

// Password input with strength indicator
interface PasswordInputProps extends Omit<ValidatedInputProps, 'type'> {
  showStrengthIndicator?: boolean;
  showToggle?: boolean;
  strengthMode?: 'login' | 'registration';
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      showStrengthIndicator = false,
      showToggle = true,
      strengthMode = 'login',
      realTimeValidation = true,
      onValidationChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [strength, setStrength] = useState<PasswordStrength | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (
        realTimeValidation &&
        value &&
        (showStrengthIndicator || strengthMode === 'registration')
      ) {
        const passwordStrength = checkPasswordStrength(value);
        setStrength(passwordStrength);

        // For registration, require stronger passwords
        const isValid =
          strengthMode === 'registration'
            ? passwordStrength.score >= 3
            : passwordStrength.score >= 1;

        onValidationChange?.(isValid);
      } else {
        setStrength(null);
        onValidationChange?.(true);
      }

      props.onChange?.(e);
    };

    return (
      <div className="space-y-1">
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700"
        >
          {props.label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={ref}
            {...props}
            type={showPassword ? 'text' : 'password'}
            onChange={handleChange}
            className={cn(
              'block w-full appearance-none rounded-md border py-2 pl-10 pr-10 shadow-sm',
              'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
              'text-sm transition-colors',
              props.error ||
                (strength &&
                  strength.score < (strengthMode === 'registration' ? 3 : 1))
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : strength && strength.score >= 3
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
              props.disabled && 'cursor-not-allowed bg-gray-50',
              props.className
            )}
          />
          {showToggle && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setShowPassword(!showPassword)}
              disabled={props.disabled}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          )}
        </div>

        {props.showValidation && props.error && (
          <ValidationError message={props.error} />
        )}

        {showStrengthIndicator && strength && props.value && (
          <div className="space-y-2">
            <PasswordStrengthIndicator score={strength.score} />
            {strength.feedback.length > 0 && (
              <div className="space-y-1">
                {strength.feedback.map((message, index) => (
                  <ValidationError
                    key={index}
                    message={message}
                    type={
                      message.includes('💪') || message.startsWith('Strong')
                        ? 'success'
                        : message.startsWith('Good')
                          ? 'info'
                          : message.startsWith('Fair')
                            ? 'warning'
                            : 'error'
                    }
                    showIcon={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
