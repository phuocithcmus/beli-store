'use client';

import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ValidationErrorType = 'error' | 'warning' | 'info' | 'success';

interface ValidationErrorProps {
  message?: string;
  messages?: string[];
  type?: ValidationErrorType;
  className?: string;
  showIcon?: boolean;
}

const iconMap = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const colorMap = {
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
  success: 'text-green-600',
};

export function ValidationError({
  message,
  messages = [],
  type = 'error',
  className,
  showIcon = true,
}: ValidationErrorProps) {
  const allMessages = message ? [message, ...messages] : messages;

  if (!allMessages.length) {
    return null;
  }

  const Icon = iconMap[type];

  return (
    <div className={cn('mt-1 flex items-start gap-2', className)}>
      {showIcon && (
        <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', colorMap[type])} />
      )}
      <div className="min-w-0 flex-1">
        {allMessages.length === 1 ? (
          <p className={cn('text-sm', colorMap[type])}>{allMessages[0]}</p>
        ) : (
          <ul className={cn('space-y-1 text-sm', colorMap[type])}>
            {allMessages.map((msg, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="mt-1.5 text-xs">•</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Specialized components for different types
export function FieldError({
  message,
  messages,
  className,
  showIcon = true,
}: Omit<ValidationErrorProps, 'type'>) {
  return (
    <ValidationError
      message={message}
      messages={messages}
      type="error"
      className={className}
      showIcon={showIcon}
    />
  );
}

export function FieldWarning({
  message,
  messages,
  className,
  showIcon = true,
}: Omit<ValidationErrorProps, 'type'>) {
  return (
    <ValidationError
      message={message}
      messages={messages}
      type="warning"
      className={className}
      showIcon={showIcon}
    />
  );
}

export function FieldInfo({
  message,
  messages,
  className,
  showIcon = true,
}: Omit<ValidationErrorProps, 'type'>) {
  return (
    <ValidationError
      message={message}
      messages={messages}
      type="info"
      className={className}
      showIcon={showIcon}
    />
  );
}

export function FieldSuccess({
  message,
  messages,
  className,
  showIcon = true,
}: Omit<ValidationErrorProps, 'type'>) {
  return (
    <ValidationError
      message={message}
      messages={messages}
      type="success"
      className={className}
      showIcon={showIcon}
    />
  );
}

// Password strength indicator component
interface PasswordStrengthIndicatorProps {
  score: number; // 0-4
  className?: string;
}

export function PasswordStrengthIndicator({
  score,
  className,
}: PasswordStrengthIndicatorProps) {
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-red-500',
    'bg-red-400',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
  ];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Password strength:</span>
        <span
          className={cn('text-sm font-medium', {
            'text-red-600': score <= 1,
            'text-yellow-600': score === 2,
            'text-blue-600': score === 3,
            'text-green-600': score >= 4,
          })}
        >
          {strengthLabels[score] || 'Unknown'}
        </span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors',
              level <= score ? strengthColors[score] : 'bg-gray-200'
            )}
          />
        ))}
      </div>
    </div>
  );
}
