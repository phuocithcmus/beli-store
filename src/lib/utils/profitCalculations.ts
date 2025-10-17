/**
 * Profit calculation utilities
 * Provides standardized profit margin and profitability calculations
 * Implements T027 - Profit margin calculation utility
 */

import type { Product, ImportFee } from '@/types';

/**
 * Calculate profit margin percentage
 * @param sellingPrice - The selling price (optional)
 * @param costPrice - The cost/purchase price
 * @returns Profit margin percentage or null if selling price not set
 */
export function calculateProfitMargin(
  sellingPrice: number | undefined,
  costPrice: number
): number | null {
  if (!sellingPrice || sellingPrice <= 0 || costPrice <= 0) {
    return null;
  }

  const profit = sellingPrice - costPrice;
  const margin = (profit / sellingPrice) * 100;

  return Math.round(margin * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate profit amount
 * @param sellingPrice - The selling price (optional)
 * @param costPrice - The cost/purchase price
 * @returns Profit amount or null if selling price not set
 */
export function calculateProfitAmount(
  sellingPrice: number | undefined,
  costPrice: number
): number | null {
  if (!sellingPrice || sellingPrice <= 0 || costPrice <= 0) {
    return null;
  }

  const profit = sellingPrice - costPrice;
  return profit > 0 ? Math.round(profit) : 0;
}

/**
 * Calculate markup percentage (profit as percentage of cost)
 * @param sellingPrice - The selling price (optional)
 * @param costPrice - The cost/purchase price
 * @returns Markup percentage or null if selling price not set
 */
export function calculateMarkup(
  sellingPrice: number | undefined,
  costPrice: number
): number | null {
  if (!sellingPrice || sellingPrice <= 0 || costPrice <= 0) {
    return null;
  }

  const profit = sellingPrice - costPrice;
  const markup = (profit / costPrice) * 100;

  return Math.round(markup * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate total cost including import fees
 * @param purchasePrice - Base purchase price
 * @param importFees - Array of import fees
 * @param quantity - Quantity of items (to distribute fees)
 * @returns Total cost per unit including fees
 */
export function calculateTotalCostWithFees(
  purchasePrice: number,
  importFees: ImportFee[] = [],
  quantity: number = 1
): number {
  if (quantity <= 0) {
    return purchasePrice;
  }

  const totalFees = importFees.reduce((sum, fee) => sum + fee.amount, 0);
  const feePerUnit = totalFees / quantity;

  return Math.round(purchasePrice + feePerUnit);
}

/**
 * Calculate break-even price (minimum selling price to avoid loss)
 * @param costPrice - The total cost price
 * @param targetMargin - Optional target margin percentage
 * @returns Break-even price or target price
 */
export function calculateBreakEvenPrice(
  costPrice: number,
  targetMargin: number = 0
): number {
  if (costPrice <= 0) {
    return 0;
  }

  if (targetMargin <= 0) {
    return costPrice; // Break-even is just covering costs
  }

  // Calculate price needed to achieve target margin
  // Formula: Price = Cost / (1 - (Target Margin / 100))
  const targetDecimal = targetMargin / 100;
  const targetPrice = costPrice / (1 - targetDecimal);

  return Math.round(targetPrice);
}

/**
 * Analyze product profitability
 * @param product - The product to analyze
 * @param importFees - Related import fees
 * @param soldQuantity - Quantity sold (for revenue calculations)
 * @returns Comprehensive profitability analysis
 */
export function analyzeProductProfitability(
  product: Product,
  importFees: ImportFee[] = [],
  soldQuantity: number = product.soldQuantity
): {
  hasPricing: boolean;
  totalCost: number;
  sellingPrice: number | null;
  profitAmount: number | null;
  profitMargin: number | null;
  markup: number | null;
  breakEvenPrice: number;
  recommendedPrice: number;
  totalRevenue: number | null;
  totalProfit: number | null;
  status: 'profitable' | 'break-even' | 'loss' | 'no-pricing';
} {
  const totalCost = calculateTotalCostWithFees(
    product.purchasePrice,
    importFees,
    product.remainingQuantity + product.soldQuantity
  );

  const hasPricing = !!product.sellingPrice;
  const sellingPrice = product.sellingPrice || null;

  const profitAmount = calculateProfitAmount(product.sellingPrice, totalCost);
  const profitMargin = calculateProfitMargin(product.sellingPrice, totalCost);
  const markup = calculateMarkup(product.sellingPrice, totalCost);

  const breakEvenPrice = calculateBreakEvenPrice(totalCost);
  const recommendedPrice = calculateBreakEvenPrice(totalCost, 20); // 20% margin

  // Calculate totals based on sold quantity
  const totalRevenue = sellingPrice ? sellingPrice * soldQuantity : null;
  const totalProfit = profitAmount ? profitAmount * soldQuantity : null;

  // Determine status
  let status: 'profitable' | 'break-even' | 'loss' | 'no-pricing';
  if (!hasPricing) {
    status = 'no-pricing';
  } else if (!profitAmount) {
    status = 'break-even';
  } else if (profitAmount > 0) {
    status = 'profitable';
  } else {
    status = 'loss';
  }

  return {
    hasPricing,
    totalCost,
    sellingPrice,
    profitAmount,
    profitMargin,
    markup,
    breakEvenPrice,
    recommendedPrice,
    totalRevenue,
    totalProfit,
    status,
  };
}

/**
 * Calculate suggested pricing tiers
 * @param costPrice - The total cost price
 * @returns Suggested pricing options
 */
export function calculatePricingTiers(costPrice: number): {
  breakEven: number;
  conservative: number; // 15% margin
  standard: number; // 25% margin
  premium: number; // 40% margin
} {
  return {
    breakEven: calculateBreakEvenPrice(costPrice, 0),
    conservative: calculateBreakEvenPrice(costPrice, 15),
    standard: calculateBreakEvenPrice(costPrice, 25),
    premium: calculateBreakEvenPrice(costPrice, 40),
  };
}

/**
 * Format profit margin for display
 * @param margin - Profit margin percentage or null
 * @returns Formatted margin string
 */
export function formatProfitMargin(margin: number | null): string {
  if (margin === null) {
    return 'N/A';
  }

  if (margin === 0) {
    return '0%';
  }

  const sign = margin > 0 ? '+' : '';
  return `${sign}${margin.toFixed(1)}%`;
}

/**
 * Get profit status color for UI
 * @param margin - Profit margin percentage or null
 * @returns CSS color class or status
 */
export function getProfitStatusColor(margin: number | null): string {
  if (margin === null) {
    return 'gray'; // No pricing set
  }

  if (margin <= 0) {
    return 'red'; // Loss or break-even
  }

  if (margin < 10) {
    return 'yellow'; // Low margin
  }

  if (margin < 25) {
    return 'blue'; // Good margin
  }

  return 'green'; // Excellent margin
}
