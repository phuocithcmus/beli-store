/**
 * VND Currency Hook
 * Provides VND currency formatting and input handling throughout the application
 * Replaces all USD currency usage with VND
 */

'use client';

import { useCallback, useMemo } from 'react';
import { formatVND, parseVND, isValidVND } from '@/lib/currency';

export interface CurrencyConfig {
  showSymbol?: boolean;
  precision?: number;
  compact?: boolean;
}

export function useCurrency() {
  // Format VND currency
  const formatCurrency = useCallback(
    (amount: number, config: CurrencyConfig = {}) => {
      const { showSymbol = true, precision = 0 } = config;
      return formatVND(amount, { showSymbol, precision });
    },
    []
  );

  // Parse currency string to number
  const parseCurrency = useCallback((currencyString: string) => {
    return parseVND(currencyString);
  }, []);

  // Validate currency string
  const isValidCurrency = useCallback((currencyString: string) => {
    return isValidVND(currencyString);
  }, []);

  // Format currency for input fields (no symbol during editing)
  const formatInputCurrency = useCallback((amount: number) => {
    return formatVND(amount, { showSymbol: false });
  }, []);

  // Format compact currency for tables/lists
  const formatCompactCurrency = useCallback((amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B VND`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M VND`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K VND`;
    }
    return formatVND(amount);
  }, []);

  // Calculate percentage with proper formatting
  const formatPercentage = useCallback((value: number, precision = 1) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(precision)}%`;
  }, []);

  // Format number with thousand separators (no currency)
  const formatNumber = useCallback((num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  }, []);

  // Calculate profit margin
  const calculateProfitMargin = useCallback(
    (sellingPrice: number | undefined, costPrice: number) => {
      if (!sellingPrice || sellingPrice <= 0 || costPrice <= 0) {
        return null;
      }

      const profit = sellingPrice - costPrice;
      const margin = (profit / sellingPrice) * 100;
      return Math.round(margin * 100) / 100; // Round to 2 decimal places
    },
    []
  );

  // Currency conversion rates (for future use if needed)
  const conversionRates = useMemo(
    () => ({
      USD_TO_VND: 24000, // Approximate rate - update as needed
      EUR_TO_VND: 26000, // Approximate rate - update as needed
    }),
    []
  );

  // Convert from other currencies to VND
  const convertToVND = useCallback(
    (amount: number, fromCurrency: 'USD' | 'EUR') => {
      const rate = conversionRates[`${fromCurrency}_TO_VND`];
      return amount * rate;
    },
    [conversionRates]
  );

  return {
    // Primary formatting functions
    formatCurrency,
    formatInputCurrency,
    formatCompactCurrency,

    // Parsing and validation
    parseCurrency,
    isValidCurrency,

    // Helper formatters
    formatNumber,
    formatPercentage,

    // Business logic
    calculateProfitMargin,

    // Currency conversion
    convertToVND,
    conversionRates,

    // Constants
    currencySymbol: 'VND',
    locale: 'vi-VN',
  };
}

// Export default configuration for VND
export const DEFAULT_VND_CONFIG: CurrencyConfig = {
  showSymbol: true,
  precision: 0,
  compact: false,
};

// Common currency ranges for Vietnamese market
export const VND_RANGES = {
  VERY_LOW: { min: 0, max: 100000 }, // Under 100K
  LOW: { min: 100000, max: 500000 }, // 100K - 500K
  MEDIUM: { min: 500000, max: 1000000 }, // 500K - 1M
  HIGH: { min: 1000000, max: 5000000 }, // 1M - 5M
  VERY_HIGH: { min: 5000000, max: Infinity }, // Over 5M
};

// Utility function to determine price range
export function getVNDPriceRange(amount: number): string {
  if (amount < VND_RANGES.VERY_LOW.max) {
    return 'Under 100K VND';
  }
  if (amount < VND_RANGES.LOW.max) {
    return '100K - 500K VND';
  }
  if (amount < VND_RANGES.MEDIUM.max) {
    return '500K - 1M VND';
  }
  if (amount < VND_RANGES.HIGH.max) {
    return '1M - 5M VND';
  }
  return 'Over 5M VND';
}
