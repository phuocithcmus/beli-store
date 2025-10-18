/**
 * MobileSelect Component
 * Touch-optimized select component with mobile-friendly interactions
 * Provides native mobile select experience with custom styling
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { touchOptimized } from '@/lib/utils/responsive';
import { useIsMobile } from '@/hooks/useResponsive';

interface MobileSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MobileSelectProps {
  options: MobileSelectOption[];
  value?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  required?: boolean;
  'aria-describedby'?: string;
}

/**
 * Mobile-optimized select component with touch-friendly interactions
 */
export function MobileSelect({
  options,
  value,
  placeholder = 'Select an option...',
  onValueChange,
  disabled = false,
  className,
  label,
  error,
  required,
  'aria-describedby': ariaDescribedBy,
}: MobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const isMobile = useIsMobile();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          const option = options[focusedIndex];
          if (!option.disabled) {
            onValueChange?.(option.value);
            setIsOpen(false);
            setFocusedIndex(-1);
          }
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const nextIndex = Math.min(focusedIndex + 1, options.length - 1);
          setFocusedIndex(nextIndex);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          const prevIndex = Math.max(focusedIndex - 1, 0);
          setFocusedIndex(prevIndex);
        }
        break;
    }
  };

  const handleOptionClick = (option: MobileSelectOption) => {
    if (!option.disabled) {
      onValueChange?.(option.value);
      setIsOpen(false);
      setFocusedIndex(-1);
      triggerRef.current?.focus();
    }
  };

  // Mobile native select fallback
  if (isMobile) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}
        <select
          value={value || ''}
          onChange={(e) => onValueChange?.(e.target.value)}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg border border-input bg-background px-4 py-3 text-base',
            'touch-target tap-highlight-none',
            'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive',
            touchOptimized('', {
              touchClasses: 'active:scale-[0.99]',
            })
          )}
          aria-describedby={ariaDescribedBy}
          required={required}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Desktop custom select
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}
      <div className="relative">
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-left text-sm',
            'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive',
            isOpen && 'border-ring ring-2 ring-ring/20'
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-describedby={ariaDescribedBy}
        >
          <span className="flex items-center gap-2">
            {selectedOption?.icon && (
              <selectedOption.icon className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className={cn(
              'absolute left-0 top-full z-50 mt-1 w-full',
              'rounded-lg border border-input bg-popover shadow-lg',
              'animate-in fade-in-0 zoom-in-95'
            )}
            role="listbox"
          >
            <div className="max-h-60 overflow-auto p-1">
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isFocused = index === focusedIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionClick(option)}
                    disabled={option.disabled}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      isSelected && 'bg-accent text-accent-foreground',
                      isFocused && 'bg-accent text-accent-foreground'
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {option.icon && (
                      <option.icon className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="flex-1 truncate">{option.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Simplified mobile select for basic use cases
 */
interface SimpleMobileSelectProps {
  options: { value: string; label: string }[];
  value?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SimpleMobileSelect({
  options,
  value,
  placeholder = 'Select...',
  onValueChange,
  disabled = false,
  className,
}: SimpleMobileSelectProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <select
        value={value || ''}
        onChange={(e) => onValueChange?.(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg border border-input bg-background px-4 py-3 text-base',
          'touch-target tap-highlight-none',
          'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          touchOptimized('', {
            touchClasses: 'active:scale-[0.99]',
          }),
          className
        )}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  // Desktop fallback to regular select or implement custom dropdown
  return (
    <select
      value={value || ''}
      onChange={(e) => onValueChange?.(e.target.value)}
      disabled={disabled}
      className={cn(
        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
        'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {placeholder && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Mobile select with search functionality
 */
interface SearchableMobileSelectProps extends MobileSelectProps {
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function SearchableMobileSelect({
  options,
  value,
  placeholder = 'Select an option...',
  onValueChange,
  disabled = false,
  className,
  label,
  error,
  required,
  searchable = true,
  searchPlaceholder = 'Search options...',
  onSearch,
  loading = false,
  emptyMessage = 'No options found',
  'aria-describedby': ariaDescribedBy,
}: SearchableMobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredOptions = searchQuery
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (isOpen && searchable && !isMobile) {
      // Focus search input when dropdown opens on desktop
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [isOpen, searchable, isMobile]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  // Mobile native select (no search on mobile native)
  if (isMobile && !searchable) {
    return (
      <MobileSelect
        options={options}
        value={value}
        placeholder={placeholder}
        onValueChange={onValueChange}
        disabled={disabled}
        className={className}
        label={label}
        error={error}
        required={required}
        aria-describedby={ariaDescribedBy}
      />
    );
  }

  // Desktop or searchable mobile custom select
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}
      <div className="relative">
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-left text-sm',
            'touch-target tap-highlight-none',
            'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive',
            isOpen && 'border-ring ring-2 ring-ring/20',
            isMobile && 'py-3 text-base'
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-describedby={ariaDescribedBy}
        >
          <span className="flex items-center gap-2">
            {selectedOption?.icon && (
              <selectedOption.icon className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            className={cn(
              'absolute left-0 top-full z-50 mt-1 w-full',
              'rounded-lg border border-input bg-popover shadow-lg',
              'animate-in fade-in-0 zoom-in-95'
            )}
            role="listbox"
          >
            {/* Search Input */}
            {searchable && (
              <div className="border-b p-2">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className={cn(
                    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                    'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
                    isMobile && 'py-3 text-base'
                  )}
                />
              </div>
            )}

            {/* Options */}
            <div className="max-h-60 overflow-auto p-1">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        if (!option.disabled) {
                          onValueChange?.(option.value);
                          setIsOpen(false);
                          setSearchQuery('');
                        }
                      }}
                      disabled={option.disabled}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm',
                        'touch-target tap-highlight-none',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        isSelected && 'bg-accent text-accent-foreground',
                        isMobile && 'py-3 text-base'
                      )}
                      role="option"
                      aria-selected={isSelected}
                    >
                      {option.icon && (
                        <option.icon className="h-4 w-4 flex-shrink-0" />
                      )}
                      <span className="flex-1 truncate">{option.label}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
