/**
 * Currency formatting utilities for Vietnamese Dong (VND)
 * Implements P4 - VND Currency Display and Formatting feature
 */

export const VND_SYMBOL = 'VND';

/**
 * Formats a number as Vietnamese Dong currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "123,456,789 VND")
 */
export function formatVND(
  amount: number,
  options: {
    showSymbol?: boolean;
    precision?: number;
  } = {}
): string {
  const { showSymbol = true, precision = 0 } = options;

  // Handle edge cases
  if (isNaN(amount) || !isFinite(amount)) {
    return showSymbol ? `0 ${VND_SYMBOL}` : '0';
  }

  // Format with thousand separators
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(amount);

  return showSymbol ? `${formatted} ${VND_SYMBOL}` : formatted;
}

/**
 * Parses a VND formatted string back to number
 * @param vndString - The formatted VND string to parse
 * @returns The numeric value
 */
export function parseVND(vndString: string): number {
  if (!vndString || typeof vndString !== 'string') {
    return 0;
  }

  // Remove VND symbol and thousand separators
  const cleaned = vndString.replace(/VND/gi, '').replace(/[,\s]/g, '').trim();

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validates if a string represents a valid VND amount
 * @param vndString - The string to validate
 * @returns True if valid VND amount
 */
export function isValidVND(vndString: string): boolean {
  if (!vndString || typeof vndString !== 'string') {
    return false;
  }

  const parsed = parseVND(vndString);
  return parsed >= 0 && isFinite(parsed);
}

/**
 * Formats VND amount for form input (without symbol)
 * @param amount - The amount to format
 * @returns Formatted string for input fields
 */
export function formatVNDForInput(amount: number): string {
  return formatVND(amount, { showSymbol: false });
}

/**
 * VND currency constants
 */
export const VND_CONFIG = {
  symbol: VND_SYMBOL,
  precision: 0, // VND typically doesn't use decimal places
  thousandSeparator: ',',
  decimalSeparator: '.',
  locale: 'vi-VN',
} as const;

/**
 * Helper for calculating percentage of an amount
 * @param amount - Base amount
 * @param percentage - Percentage (e.g., 3.5 for 3.5%)
 * @returns Calculated percentage amount
 */
export function calculatePercentage(
  amount: number,
  percentage: number
): number {
  return Math.round(amount * (percentage / 100));
}

/**
 * Helper for calculating fixed fee + percentage
 * @param amount - Base amount
 * @param fixedFee - Fixed fee amount
 * @param percentage - Percentage (e.g., 3.5 for 3.5%)
 * @returns Total fee amount
 */
export function calculateTotalFee(
  amount: number,
  fixedFee: number = 0,
  percentage: number = 0
): number {
  const percentageFee = calculatePercentage(amount, percentage);
  return fixedFee + percentageFee;
}
