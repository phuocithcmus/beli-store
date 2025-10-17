/**
 * Generic currency formatting utilities
 * Provides currency formatting functions for various currencies
 * Complements the VND-specific formatting in src/lib/currency.ts
 */

import { formatVND } from '../currency';

export type SupportedCurrency = 'VND' | 'USD' | 'EUR';

/**
 * Generic currency formatter that supports multiple currencies
 * @param amount - The amount to format
 * @param currency - The currency code
 * @param showSymbol - Whether to show the currency symbol
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency = 'VND',
  showSymbol: boolean = true
): string {
  if (currency === 'VND') {
    return formatVND(amount, { showSymbol });
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(amount);
}

/**
 * Parse currency string back to number
 * @param currencyString - The formatted currency string
 * @returns Parsed number
 */
export function parseCurrency(currencyString: string): number {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }

  // Remove currency symbols and formatting
  const cleaned = currencyString
    .replace(/[$€,\s]/g, '')
    .replace(/VND/gi, '')
    .trim();

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate if a string is a valid currency format
 * @param currencyString - String to validate
 * @param currency - Expected currency type
 * @returns True if valid currency format
 */
export function isValidCurrencyFormat(currencyString: string): boolean {
  if (!currencyString || typeof currencyString !== 'string') {
    return false;
  }

  const parsed = parseCurrency(currencyString);
  return !isNaN(parsed) && parsed >= 0;
}

/**
 * Format currency input for display in forms
 * @param value - Raw input value
 * @param currency - Currency type
 * @returns Formatted display value
 */
export function formatCurrencyInput(
  value: string | number,
  currency: SupportedCurrency = 'VND'
): string {
  const numValue = typeof value === 'string' ? parseCurrency(value) : value;

  if (numValue === 0) {
    return '';
  }

  return formatCurrency(numValue, currency, false);
}
