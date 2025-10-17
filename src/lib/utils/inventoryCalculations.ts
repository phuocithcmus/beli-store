/**
 * Inventory Calculation Utilities
 * Handles inventory-related calculations for product variants
 */

import type { ProductVariant, VariantSaleRecord } from '@/types';

/**
 * Calculate available inventory after sale
 */
export function calculateInventoryAfterSale(
  currentInventory: number,
  saleQuantity: number
): number {
  if (saleQuantity < 0) {
    throw new Error('Sale quantity cannot be negative');
  }

  if (currentInventory < saleQuantity) {
    throw new Error(
      `Insufficient inventory: trying to sell ${saleQuantity} but only ${currentInventory} available`
    );
  }

  return currentInventory - saleQuantity;
}

/**
 * Calculate total available inventory for a variant
 */
export function calculateAvailableInventory(variant: ProductVariant): number {
  return variant.inventoryCount - variant.reservedCount;
}

/**
 * Validate sale quantity against available inventory
 */
export function validateSaleQuantity(
  variant: ProductVariant,
  saleQuantity: number
): {
  isValid: boolean;
  availableQuantity: number;
  errorMessage?: string;
} {
  const availableQuantity = calculateAvailableInventory(variant);

  if (saleQuantity <= 0) {
    return {
      isValid: false,
      availableQuantity,
      errorMessage: 'Sale quantity must be greater than 0',
    };
  }

  if (saleQuantity > availableQuantity) {
    return {
      isValid: false,
      availableQuantity,
      errorMessage: `Insufficient inventory: trying to sell ${saleQuantity} but only ${availableQuantity} available`,
    };
  }

  return {
    isValid: true,
    availableQuantity,
  };
}

/**
 * Calculate inventory turnover rate
 */
export function calculateInventoryTurnover(
  variant: ProductVariant,
  salesHistory: VariantSaleRecord[],
  periodDays: number = 30
): {
  turnoverRate: number;
  averageDailySales: number;
  daysOfInventoryRemaining: number;
} {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);

  const recentSales = salesHistory.filter(
    (sale) => sale.saleDate >= cutoffDate
  );
  const totalSold = recentSales.reduce((sum, sale) => sum + sale.quantity, 0);

  const averageDailySales = totalSold / periodDays;
  const currentInventory = calculateAvailableInventory(variant);

  const turnoverRate = currentInventory > 0 ? totalSold / currentInventory : 0;
  const daysOfInventoryRemaining =
    averageDailySales > 0 ? currentInventory / averageDailySales : Infinity;

  return {
    turnoverRate: Math.round(turnoverRate * 100) / 100,
    averageDailySales: Math.round(averageDailySales * 100) / 100,
    daysOfInventoryRemaining:
      daysOfInventoryRemaining === Infinity
        ? Infinity
        : Math.round(daysOfInventoryRemaining),
  };
}

/**
 * Calculate optimal reorder point
 */
export function calculateReorderPoint(
  averageDailySales: number,
  leadTimeDays: number,
  safetyStockDays: number = 7
): number {
  const reorderPoint = averageDailySales * (leadTimeDays + safetyStockDays);
  return Math.ceil(reorderPoint);
}

/**
 * Determine inventory status
 */
export function getInventoryStatus(
  variant: ProductVariant,
  salesHistory: VariantSaleRecord[],
  lowStockThreshold: number = 10
): {
  status: 'out-of-stock' | 'low-stock' | 'in-stock' | 'overstocked';
  availableQuantity: number;
  message: string;
} {
  const availableQuantity = calculateAvailableInventory(variant);

  if (availableQuantity === 0) {
    return {
      status: 'out-of-stock',
      availableQuantity,
      message: 'Out of stock',
    };
  }

  if (availableQuantity <= lowStockThreshold) {
    return {
      status: 'low-stock',
      availableQuantity,
      message: `Low stock: ${availableQuantity} remaining`,
    };
  }

  // Calculate if overstocked based on sales velocity
  const { daysOfInventoryRemaining } = calculateInventoryTurnover(
    variant,
    salesHistory
  );

  if (daysOfInventoryRemaining > 90) {
    return {
      status: 'overstocked',
      availableQuantity,
      message: `Overstocked: ${Math.round(daysOfInventoryRemaining)} days of inventory remaining`,
    };
  }

  return {
    status: 'in-stock',
    availableQuantity,
    message: `In stock: ${availableQuantity} available`,
  };
}

/**
 * Calculate cost of goods sold (COGS)
 */
export function calculateCOGS(
  sales: VariantSaleRecord[],
  costPerUnit: number
): {
  totalCOGS: number;
  totalRevenue: number;
  grossProfit: number;
  grossMargin: number;
} {
  const totalUnits = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalCOGS = totalUnits * costPerUnit;
  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    totalCOGS: Math.round(totalCOGS * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    grossMargin: Math.round(grossMargin * 100) / 100,
  };
}

/**
 * Predict future inventory needs
 */
export function predictInventoryNeeds(
  variant: ProductVariant,
  salesHistory: VariantSaleRecord[],
  forecastDays: number = 30
): {
  predictedSales: number;
  recommendedRestockQuantity: number;
  forecastAccuracy: 'high' | 'medium' | 'low';
} {
  if (salesHistory.length < 7) {
    return {
      predictedSales: 0,
      recommendedRestockQuantity: 0,
      forecastAccuracy: 'low',
    };
  }

  // Use last 30 days for prediction
  const { averageDailySales } = calculateInventoryTurnover(
    variant,
    salesHistory,
    30
  );
  const predictedSales = averageDailySales * forecastDays;
  const currentAvailable = calculateAvailableInventory(variant);

  // Recommend restock if predicted sales exceed current inventory
  const recommendedRestockQuantity = Math.max(
    0,
    Math.ceil(predictedSales - currentAvailable + averageDailySales * 7) // Add 7 days safety stock
  );

  // Determine forecast accuracy based on data availability
  let forecastAccuracy: 'high' | 'medium' | 'low' = 'low';
  if (salesHistory.length >= 30) {
    forecastAccuracy = 'high';
  } else if (salesHistory.length >= 14) {
    forecastAccuracy = 'medium';
  }

  return {
    predictedSales: Math.ceil(predictedSales),
    recommendedRestockQuantity,
    forecastAccuracy,
  };
}

/**
 * Calculate ABC analysis classification
 */
export function calculateABCAnalysis(
  variants: { variant: ProductVariant; salesHistory: VariantSaleRecord[] }[]
): {
  variant: ProductVariant;
  classification: 'A' | 'B' | 'C';
  revenueContribution: number;
  cumulativePercentage: number;
}[] {
  // Calculate revenue for each variant
  const variantRevenues = variants.map(({ variant, salesHistory }) => {
    const totalRevenue = salesHistory.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );
    return {
      variant,
      salesHistory,
      totalRevenue,
    };
  });

  // Sort by revenue descending
  variantRevenues.sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalRevenue = variantRevenues.reduce(
    (sum, item) => sum + item.totalRevenue,
    0
  );
  let cumulativeRevenue = 0;

  return variantRevenues.map((item) => {
    cumulativeRevenue += item.totalRevenue;
    const cumulativePercentage =
      totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0;

    let classification: 'A' | 'B' | 'C';
    if (cumulativePercentage <= 80) {
      classification = 'A'; // Top 80% of revenue
    } else if (cumulativePercentage <= 95) {
      classification = 'B'; // Next 15% of revenue
    } else {
      classification = 'C'; // Bottom 5% of revenue
    }

    return {
      variant: item.variant,
      classification,
      revenueContribution:
        totalRevenue > 0 ? (item.totalRevenue / totalRevenue) * 100 : 0,
      cumulativePercentage: Math.round(cumulativePercentage * 100) / 100,
    };
  });
}

/**
 * Calculate safety stock requirements
 */
export function calculateSafetyStock(
  averageDailySales: number,
  salesVariability: number,
  leadTimeDays: number,
  serviceLevel: number = 0.95 // 95% service level
): number {
  // Z-score for different service levels
  const zScores: Record<number, number> = {
    0.9: 1.28,
    0.95: 1.65,
    0.98: 2.05,
    0.99: 2.33,
  };

  const zScore = zScores[serviceLevel] || 1.65;
  const safetyStock = zScore * salesVariability * Math.sqrt(leadTimeDays);

  return Math.ceil(safetyStock);
}

/**
 * Validate inventory adjustment
 */
export function validateInventoryAdjustment(
  variant: ProductVariant,
  adjustment: number,
  reason: string
): {
  isValid: boolean;
  newInventoryCount: number;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  const newInventoryCount = variant.inventoryCount + adjustment;

  // Validate new inventory count
  if (newInventoryCount < 0) {
    errors.push(
      `Adjustment would result in negative inventory (${newInventoryCount})`
    );
  }

  if (newInventoryCount < variant.reservedCount) {
    errors.push(
      `Adjustment would result in inventory (${newInventoryCount}) less than reserved quantity (${variant.reservedCount})`
    );
  }

  // Check for large adjustments
  const adjustmentPercentage =
    (Math.abs(adjustment) / variant.inventoryCount) * 100;
  if (adjustmentPercentage > 50) {
    warnings.push(
      `Large inventory adjustment: ${Math.round(adjustmentPercentage)}% change`
    );
  }

  // Validate reason
  if (!reason || reason.trim().length < 3) {
    errors.push('Adjustment reason must be at least 3 characters long');
  }

  return {
    isValid: errors.length === 0,
    newInventoryCount: Math.max(0, newInventoryCount),
    warnings,
    errors,
  };
}
