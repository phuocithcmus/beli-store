/**
 * Currency Input Component
 * Specialized input component for Vietnamese Dong (VND) currency
 * Implements T035 - Currency input components with VND formatting
 */

'use client';

import React, { useState, useCallback, forwardRef } from 'react';
import { formatVND, parseVND } from '@/lib/currency';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  id?: string;
  name?: string;
  label?: string;
  value?: number;
  defaultValue?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onChange?: (value: number) => void;
  onBlur?: (value: number) => void;
  min?: number;
  max?: number;
  precision?: number;
  showSymbol?: boolean;
  error?: string;
  helperText?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      id,
      name,
      label,
      value,
      defaultValue,
      placeholder = '0',
      disabled = false,
      required = false,
      className,
      onChange,
      onBlur,
      min = 0,
      max,
      precision = 0,
      showSymbol = true,
      error,
      helperText,
      ...props
    },
    ref
  ) => {
    // Internal state for display value
    const [displayValue, setDisplayValue] = useState(() => {
      const initialValue = value ?? defaultValue ?? 0;
      return initialValue > 0
        ? formatVND(initialValue, { showSymbol: false, precision })
        : '';
    });

    const [isFocused, setIsFocused] = useState(false);

    // Update display value when value prop changes
    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(
          value > 0 ? formatVND(value, { showSymbol: false, precision }) : ''
        );
      }
    }, [value, precision]);

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Allow empty input
        if (inputValue === '') {
          setDisplayValue('');
          onChange?.(0);
          return;
        }

        // Remove any non-numeric characters except comma for thousands separator
        const cleanedValue = inputValue.replace(/[^0-9,]/g, '');

        // Parse the cleaned value
        const numericValue = parseVND(cleanedValue);

        // Apply min/max constraints
        let constrainedValue = numericValue;
        if (min !== undefined && constrainedValue < min) {
          constrainedValue = min;
        }
        if (max !== undefined && constrainedValue > max) {
          constrainedValue = max;
        }

        // Update display with formatting
        if (constrainedValue > 0) {
          setDisplayValue(
            formatVND(constrainedValue, { showSymbol: false, precision })
          );
        } else {
          setDisplayValue('');
        }

        onChange?.(constrainedValue);
      },
      [onChange, min, max, precision]
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        // Remove formatting on focus for easier editing
        const numericValue = parseVND(displayValue);
        if (numericValue > 0) {
          setDisplayValue(numericValue.toString());
        }
        e.target.select(); // Select all text on focus
      },
      [displayValue]
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        const numericValue = parseVND(e.target.value);

        // Apply constraints
        let constrainedValue = numericValue;
        if (min !== undefined && constrainedValue < min) {
          constrainedValue = min;
        }
        if (max !== undefined && constrainedValue > max) {
          constrainedValue = max;
        }

        // Format the display value
        if (constrainedValue > 0) {
          setDisplayValue(
            formatVND(constrainedValue, { showSymbol: false, precision })
          );
        } else {
          setDisplayValue('');
        }

        onBlur?.(constrainedValue);
      },
      [onBlur, min, max, precision]
    );

    const inputClasses = cn(
      'text-right', // Right-align currency values
      error && 'border-red-500 focus:border-red-500',
      className
    );

    return (
      <div className="space-y-2">
        {label && (
          <Label
            htmlFor={id}
            className={cn(
              required && "after:ml-0.5 after:text-red-500 after:content-['*']"
            )}
          >
            {label}
          </Label>
        )}

        <div className="relative">
          <Input
            {...props}
            ref={ref}
            id={id}
            name={name}
            type="text"
            inputMode="numeric"
            value={displayValue}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={inputClasses}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          {showSymbol && !isFocused && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-8">
              <span className="text-sm text-gray-500">VND</span>
            </div>
          )}
        </div>

        {/* Helper text or error message */}
        {(error || helperText) && (
          <div
            className={cn('text-sm', error ? 'text-red-600' : 'text-gray-600')}
          >
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

/**
 * Compact Currency Input - smaller version for tables/forms
 */
export const CompactCurrencyInput = forwardRef<
  HTMLInputElement,
  Omit<CurrencyInputProps, 'label' | 'helperText' | 'error'>
>(({ className, showSymbol = false, ...props }, ref) => {
  return (
    <CurrencyInput
      ref={ref}
      className={cn('h-8 text-sm', className)}
      showSymbol={showSymbol}
      {...props}
    />
  );
});

CompactCurrencyInput.displayName = 'CompactCurrencyInput';

/**
 * Currency Display - read-only formatted display
 */
interface CurrencyDisplayProps {
  value: number;
  className?: string;
  showSymbol?: boolean;
  precision?: number;
  placeholder?: string;
}

export function CurrencyDisplay({
  value,
  className,
  showSymbol = true,
  precision = 0,
  placeholder = '0 VND',
}: CurrencyDisplayProps) {
  const formattedValue =
    value > 0 ? formatVND(value, { showSymbol, precision }) : placeholder;

  return <span className={cn('font-mono', className)}>{formattedValue}</span>;
}

/**
 * Currency Range Input - for min/max values
 */
interface CurrencyRangeProps {
  minValue?: number;
  maxValue?: number;
  onMinChange?: (value: number) => void;
  onMaxChange?: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
  className?: string;
}

export function CurrencyRange({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minLabel = 'Minimum',
  maxLabel = 'Maximum',
  className,
}: CurrencyRangeProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      <CurrencyInput
        label={minLabel}
        value={minValue}
        onChange={onMinChange}
        max={maxValue}
      />
      <CurrencyInput
        label={maxLabel}
        value={maxValue}
        onChange={onMaxChange}
        min={minValue}
      />
    </div>
  );
}
