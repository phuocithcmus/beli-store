/**
 * Profit Calculation Utilities
 * Functions for calculating profit, margins, and related metrics for revenue entries
 */

export interface ProfitCalculation {
  grossProfit: number;
  profitMargin: number;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  totalCost: number;
  totalRevenue: number;
}

export interface ProfitBreakdown {
  sellingPrice: number;
  importCost: number;
  unitProfit: number;
  quantity: number;
  totalProfit: number;
  profitMargin: number;
}

/**
 * Calculate profit for a revenue entry based on import phase cost
 */
export function calculateProfit(
  sellingPrice: number,
  importCost: number,
  quantity: number = 1
): ProfitCalculation {
  const totalRevenue = sellingPrice * quantity;
  const totalCost = importCost * quantity;
  const grossProfit = totalRevenue - totalCost;
  const profitMargin =
    totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    grossProfit,
    profitMargin,
    costPrice: importCost,
    sellingPrice,
    quantity,
    totalCost,
    totalRevenue,
  };
}

/**
 * Calculate detailed profit breakdown for display
 */
export function calculateProfitBreakdown(
  sellingPrice: number,
  importCost: number,
  quantity: number = 1
): ProfitBreakdown {
  const unitProfit = sellingPrice - importCost;
  const totalProfit = unitProfit * quantity;
  const totalRevenue = sellingPrice * quantity;
  const profitMargin =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    sellingPrice,
    importCost,
    unitProfit,
    quantity,
    totalProfit,
    profitMargin,
  };
}

/**
 * Format profit margin as percentage
 */
export function formatProfitMargin(margin: number): string {
  return `${margin.toFixed(1)}%`;
}

/**
 * Format profit amount with currency
 */
export function formatProfitAmount(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Check if a profit calculation is profitable
 */
export function isProfitable(profit: number): boolean {
  return profit > 0;
}

/**
 * Calculate profit margin from gross profit and revenue
 */
export function calculateMarginFromGrossProfit(
  grossProfit: number,
  totalRevenue: number
): number {
  return totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
}

/**
 * Calculate return on investment (ROI) percentage
 */
export function calculateROI(profit: number, cost: number): number {
  return cost > 0 ? (profit / cost) * 100 : 0;
}
