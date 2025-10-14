'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  step?: string;
}

export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  className,
  disabled = false,
  step,
}: FormFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string;

  return (
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor={name}
        className={
          required ? 'after:ml-0.5 after:text-red-500 after:content-["*"]' : ''
        }
      >
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name)}
        className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface FormSelectProps {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function FormSelect({
  name,
  label,
  options,
  placeholder = 'Select an option',
  required = false,
  className,
  disabled = false,
}: FormSelectProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string;

  return (
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor={name}
        className={
          required ? 'after:ml-0.5 after:text-red-500 after:content-["*"]' : ''
        }
      >
        {label}
      </Label>
      <select
        id={name}
        disabled={disabled}
        {...register(name)}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-red-500 focus-visible:ring-red-500' : '',
          className
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface FormTextareaProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  rows?: number;
}

export function FormTextarea({
  name,
  label,
  placeholder,
  required = false,
  className,
  disabled = false,
  rows = 3,
}: FormTextareaProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string;

  return (
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor={name}
        className={
          required ? 'after:ml-0.5 after:text-red-500 after:content-["*"]' : ''
        }
      >
        {label}
      </Label>
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name)}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-red-500 focus-visible:ring-red-500' : '',
          className
        )}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
