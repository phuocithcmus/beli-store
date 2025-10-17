/**
 * Sales-Inventory Integration Utilities
 * Implements T041: Integrate sales recording with variant inventory updates
 * Implements T042: Add sales performance calculations and reporting
 */

import { variantSalesService } from '@/lib/storage/variantSalesService';
import { storageService } from '@/lib/storage';
import type {
  ProductVariant,
  SaleTransaction,
  VariantSaleRecord,
} from '@/types';
import {
  calculateInventoryTurnover,
  calculateCOGS,
  getInventoryStatus,
  calculateABCAnalysis,
} from '@/lib/utils/inventoryCalculations';

/**
 * T041: Sales-Inventory Integration
 * Ensures sales recording automatically updates variant inventory
 */
export class SalesInventoryIntegration {
  /**
   * Record a sale and update inventory atomically
   */
  static async recordSaleAndUpdateInventory(
    transaction: Omit<SaleTransaction, 'id'>
  ): Promise<{
    saleRecord: VariantSaleRecord;
    updatedVariant: ProductVariant;
  }> {
    try {
      // Record the sale (this automatically updates inventory in the service)
      const saleRecord = variantSalesService.recordSale(transaction);

      // Get the updated variant to return current state
      const updatedVariant = storageService.getProductVariant(
        transaction.variantId
      );

      if (!updatedVariant) {
        throw new Error(
          `Variant ${transaction.variantId} not found after sale recording`
        );
      }

      return {
        saleRecord,
        updatedVariant,
      };
    } catch (error) {
      throw new Error(
        `Failed to record sale and update inventory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get variant with enriched sales data
   */
  static getVariantWithSalesData(variantId: string): ProductVariant & {
    totalSales: number;
    totalRevenue: number;
    lastSaleDate?: Date;
  } {
    const variant = storageService.getProductVariant(variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    const salesSummary =
      variantSalesService.getSalesSummaryForVariant(variantId);

    return {
      ...variant,
      totalSales: salesSummary.totalSold,
      totalRevenue: salesSummary.totalRevenue,
      lastSaleDate: salesSummary.lastSaleDate,
    };
  }

  /**
   * Bulk record sales with inventory updates
   */
  static bulkRecordSales(transactions: Omit<SaleTransaction, 'id'>[]): {
    successful: {
      saleRecord: VariantSaleRecord;
      updatedVariant: ProductVariant;
    }[];
    failed: { transaction: Omit<SaleTransaction, 'id'>; error: string }[];
  } {
    const results = variantSalesService.bulkRecordSales(transactions);

    const successful = results.successful.map(({ saleRecord }) => {
      const updatedVariant = storageService.getProductVariant(
        saleRecord.variantId
      );
      if (!updatedVariant) {
        throw new Error(
          `Variant ${saleRecord.variantId} not found after bulk sale`
        );
      }
      return { saleRecord, updatedVariant };
    });

    return {
      successful,
      failed: results.failed.map(({ transaction, error }) => ({
        transaction,
        error,
      })),
    };
  }
}

/**
 * T042: Sales Performance Calculations and Reporting
 * Comprehensive performance analytics for variant sales
 */
export class SalesPerformanceReporting {
  /**
   * Generate comprehensive performance report for a variant
   */
  static generateVariantPerformanceReport(variantId: string) {
    const variant = storageService.getProductVariant(variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    const salesHistory = variantSalesService.getSalesForVariant(variantId);
    const salesSummary =
      variantSalesService.getSalesSummaryForVariant(variantId);
    const product = storageService.getProduct(variant.productId);

    // Basic metrics
    const availableInventory = variant.inventoryCount - variant.reservedCount;
    const inventoryStatus = getInventoryStatus(variant, salesHistory);

    // Performance calculations
    const turnoverMetrics = calculateInventoryTurnover(variant, salesHistory);
    const profitabilityMetrics = calculateCOGS(
      salesHistory,
      product?.purchasePrice || 0
    );

    // Sales velocity (sales per day over last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = salesHistory.filter(
      (sale) => new Date(sale.saleDate) >= thirtyDaysAgo
    );

    const salesVelocity =
      recentSales.reduce((total, sale) => total + sale.quantity, 0) / 30;

    return {
      // Basic info
      variant,
      salesSummary,

      // Inventory status
      availableInventory,
      inventoryStatus,

      // Performance metrics
      turnoverMetrics,
      profitabilityMetrics,
      salesVelocity,

      // Calculated insights
      daysToStockout:
        salesVelocity > 0
          ? Math.ceil(availableInventory / salesVelocity)
          : null,
      isTopPerformer: turnoverMetrics.turnoverRate > 2.0,
      isProfitable: profitabilityMetrics.grossMargin > 0,

      // Recent activity
      recentSalesCount: recentSales.length,
      lastSaleDate: salesSummary.lastSaleDate,
    };
  }

  /**
   * Generate performance comparison report for all variants
   */
  static generateAllVariantsPerformanceReport() {
    const allVariants = storageService.getProductVariants();

    const variantReports = allVariants.map((variant) =>
      this.generateVariantPerformanceReport(variant.id)
    );

    // Calculate ABC classification
    const abcAnalysis = calculateABCAnalysis(
      allVariants.map((variant) => ({
        variant,
        salesHistory: variantSalesService.getSalesForVariant(variant.id),
      }))
    );

    // Performance rankings
    const topPerformers = variantReports
      .filter((report) => report.turnoverMetrics.turnoverRate > 0)
      .sort(
        (a, b) =>
          b.turnoverMetrics.turnoverRate - a.turnoverMetrics.turnoverRate
      )
      .slice(0, 10);

    const slowMovers = variantReports
      .filter((report) => report.turnoverMetrics.turnoverRate < 1.0)
      .sort(
        (a, b) =>
          a.turnoverMetrics.turnoverRate - b.turnoverMetrics.turnoverRate
      )
      .slice(0, 10);

    const mostProfitable = variantReports
      .filter((report) => report.profitabilityMetrics.grossMargin > 0)
      .sort(
        (a, b) =>
          b.profitabilityMetrics.grossMargin -
          a.profitabilityMetrics.grossMargin
      )
      .slice(0, 10);

    // Summary statistics
    const totalRevenue = variantReports.reduce(
      (sum, report) => sum + report.salesSummary.totalRevenue,
      0
    );

    const totalUnitsSold = variantReports.reduce(
      (sum, report) => sum + report.salesSummary.totalSold,
      0
    );

    const averageTurnover =
      variantReports.reduce(
        (sum, report) => sum + report.turnoverMetrics.turnoverRate,
        0
      ) / variantReports.length;

    return {
      // Summary metrics
      totalVariants: allVariants.length,
      totalRevenue,
      totalUnitsSold,
      averageTurnover,

      // Categorized variants
      topPerformers,
      slowMovers,
      mostProfitable,
      abcAnalysis,

      // Individual reports
      variantReports,

      // Generated at
      generatedAt: new Date(),
    };
  }

  /**
   * Get sales trends over time periods
   */
  static getSalesTrends(variantId?: string, days: number = 30) {
    const salesHistory = variantId
      ? variantSalesService.getSalesForVariant(variantId)
      : variantSalesService.getAllVariantSales();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentSales = salesHistory.filter(
      (sale) => new Date(sale.saleDate) >= cutoffDate
    );

    // Group by day
    const dailySales = new Map<string, { quantity: number; revenue: number }>();

    recentSales.forEach((sale) => {
      const dateKey = sale.saleDate.toISOString().split('T')[0];
      const existing = dailySales.get(dateKey) || { quantity: 0, revenue: 0 };

      dailySales.set(dateKey, {
        quantity: existing.quantity + sale.quantity,
        revenue: existing.revenue + sale.totalAmount,
      });
    });

    return Array.from(dailySales.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

/**
 * Utility functions for performance calculations
 */
export const PerformanceUtils = {
  /**
   * Calculate conversion rate from views to sales (would need view tracking)
   */
  calculateConversionRate: (views: number, sales: number): number => {
    return views > 0 ? (sales / views) * 100 : 0;
  },

  /**
   * Calculate customer lifetime value for variant purchases
   */
  calculateCLV: (
    averageOrderValue: number,
    purchaseFrequency: number,
    customerLifespan: number
  ): number => {
    return averageOrderValue * purchaseFrequency * customerLifespan;
  },

  /**
   * Calculate stock-to-sales ratio
   */
  calculateStockToSalesRatio: (
    currentStock: number,
    averageMonthlySales: number
  ): number => {
    return averageMonthlySales > 0 ? currentStock / averageMonthlySales : 0;
  },

  /**
   * Format currency values
   */
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  },

  /**
   * Format percentage values
   */
  formatPercentage: (value: number): string => {
    return `${value.toFixed(1)}%`;
  },
};

// Export everything as a unified module
const SalesPerformanceIntegrationModule = {
  SalesInventoryIntegration,
  SalesPerformanceReporting,
  PerformanceUtils,
};

export default SalesPerformanceIntegrationModule;
