/**
 * Revenue Calculation Utilities
 * Provides utility functions for revenue analytics and calculations
 */

import type { RevenueEntry, Product } from '@/types';

export interface RevenueMetrics {
  totalRevenue: number;
  totalTransactions: number;
  totalQuantity: number;
  averageOrderValue: number;
  averageQuantityPerOrder: number;
}

export interface PeriodRevenueData {
  period: string;
  revenue: number;
  transactions: number;
  quantity: number;
  date: Date;
}

export interface ProductRevenueData {
  productId: string;
  productName: string;
  revenue: number;
  transactions: number;
  quantity: number;
  averagePrice: number;
}

export interface ChannelRevenueData {
  channelId: string;
  channelName: string;
  revenue: number;
  netRevenue: number;
  totalFees: number;
  transactions: number;
  quantity: number;
  marketShare: number;
  netMarketShare: number;
  averageOrderValue: number;
  averageNetOrderValue: number;
  averageFeePerTransaction: number;
}

export interface RevenueGrowthData {
  currentPeriod: RevenueMetrics;
  previousPeriod: RevenueMetrics;
  growthRate: number;
  revenueGrowth: number;
  transactionGrowth: number;
  quantityGrowth: number;
}

export class RevenueCalculator {
  /**
   * Calculate basic revenue metrics from entries
   */
  static calculateMetrics(entries: RevenueEntry[]): RevenueMetrics {
    const totalRevenue = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const totalTransactions = entries.length;
    const totalQuantity = entries.reduce(
      (sum, entry) => sum + entry.quantity,
      0
    );

    return {
      totalRevenue,
      totalTransactions,
      totalQuantity,
      averageOrderValue:
        totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      averageQuantityPerOrder:
        totalTransactions > 0 ? totalQuantity / totalTransactions : 0,
    };
  }

  /**
   * Group revenue entries by time period
   */
  static groupByPeriod(
    entries: RevenueEntry[],
    periodType: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): PeriodRevenueData[] {
    const grouped = new Map<
      string,
      {
        revenue: number;
        transactions: number;
        quantity: number;
        date: Date;
      }
    >();

    entries.forEach((entry) => {
      const periodKey = this.getPeriodKey(entry.saleDate, periodType);
      const existing = grouped.get(periodKey);

      if (existing) {
        existing.revenue += entry.amount;
        existing.transactions += 1;
        existing.quantity += entry.quantity;
      } else {
        grouped.set(periodKey, {
          revenue: entry.amount,
          transactions: 1,
          quantity: entry.quantity,
          date: this.getPeriodStartDate(entry.saleDate, periodType),
        });
      }
    });

    return Array.from(grouped.entries())
      .map(([period, data]) => ({
        period,
        ...data,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Calculate revenue by product
   */
  static calculateByProduct(entries: RevenueEntry[]): ProductRevenueData[] {
    const grouped = new Map<
      string,
      {
        productName: string;
        revenue: number;
        transactions: number;
        quantity: number;
      }
    >();

    entries.forEach((entry) => {
      const existing = grouped.get(entry.productId);

      if (existing) {
        existing.revenue += entry.amount;
        existing.transactions += 1;
        existing.quantity += entry.quantity;
      } else {
        grouped.set(entry.productId, {
          productName: entry.productName,
          revenue: entry.amount,
          transactions: 1,
          quantity: entry.quantity,
        });
      }
    });

    return Array.from(grouped.entries())
      .map(([productId, data]) => ({
        productId,
        ...data,
        averagePrice: data.quantity > 0 ? data.revenue / data.quantity : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Calculate revenue by sales channel with P2 channel fee integration
   */
  static calculateByChannel(entries: RevenueEntry[]): ChannelRevenueData[] {
    const grouped = new Map<
      string,
      {
        channelName: string;
        revenue: number;
        netRevenue: number;
        totalFees: number;
        transactions: number;
        quantity: number;
      }
    >();

    let totalRevenue = 0;
    let totalNetRevenue = 0;

    entries.forEach((entry) => {
      totalRevenue += entry.amount;
      const netAmount = entry.netAmount || entry.amount; // Use netAmount if available, fallback to gross
      const channelFee = entry.channelFee || 0;
      totalNetRevenue += netAmount;

      const existing = grouped.get(entry.salesChannel);

      if (existing) {
        existing.revenue += entry.amount;
        existing.netRevenue += netAmount;
        existing.totalFees += channelFee;
        existing.transactions += 1;
        existing.quantity += entry.quantity;
      } else {
        grouped.set(entry.salesChannel, {
          channelName: entry.salesChannelName,
          revenue: entry.amount,
          netRevenue: netAmount,
          totalFees: channelFee,
          transactions: 1,
          quantity: entry.quantity,
        });
      }
    });

    return Array.from(grouped.entries())
      .map(([channelId, data]) => ({
        channelId,
        ...data,
        marketShare: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        averageOrderValue:
          data.transactions > 0 ? data.revenue / data.transactions : 0,
        netMarketShare:
          totalNetRevenue > 0 ? (data.netRevenue / totalNetRevenue) * 100 : 0,
        averageNetOrderValue:
          data.transactions > 0 ? data.netRevenue / data.transactions : 0,
        averageFeePerTransaction:
          data.transactions > 0 ? data.totalFees / data.transactions : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Calculate growth metrics between two periods
   */
  static calculateGrowth(
    currentEntries: RevenueEntry[],
    previousEntries: RevenueEntry[]
  ): RevenueGrowthData {
    const currentPeriod = this.calculateMetrics(currentEntries);
    const previousPeriod = this.calculateMetrics(previousEntries);

    const revenueGrowth =
      previousPeriod.totalRevenue > 0
        ? ((currentPeriod.totalRevenue - previousPeriod.totalRevenue) /
            previousPeriod.totalRevenue) *
          100
        : 0;

    const transactionGrowth =
      previousPeriod.totalTransactions > 0
        ? ((currentPeriod.totalTransactions -
            previousPeriod.totalTransactions) /
            previousPeriod.totalTransactions) *
          100
        : 0;

    const quantityGrowth =
      previousPeriod.totalQuantity > 0
        ? ((currentPeriod.totalQuantity - previousPeriod.totalQuantity) /
            previousPeriod.totalQuantity) *
          100
        : 0;

    const growthRate = (revenueGrowth + transactionGrowth + quantityGrowth) / 3;

    return {
      currentPeriod,
      previousPeriod,
      growthRate,
      revenueGrowth,
      transactionGrowth,
      quantityGrowth,
    };
  }

  /**
   * Calculate top performing products
   */
  static getTopProducts(
    entries: RevenueEntry[],
    limit = 10
  ): ProductRevenueData[] {
    const productData = this.calculateByProduct(entries);
    return productData.slice(0, limit);
  }

  /**
   * Calculate underperforming products
   */
  static getUnderperformingProducts(
    entries: RevenueEntry[],
    products: Product[],
    limit = 10
  ): ProductRevenueData[] {
    const productData = this.calculateByProduct(entries);
    const productRevenueMap = new Map(productData.map((p) => [p.productId, p]));

    // Find products with low or no sales
    const underperforming = products
      .map((product) => {
        const revenueData = productRevenueMap.get(product.id);
        return {
          productId: product.id,
          productName: product.name,
          revenue: revenueData?.revenue || 0,
          transactions: revenueData?.transactions || 0,
          quantity: revenueData?.quantity || 0,
          averagePrice: revenueData?.averagePrice || 0,
        };
      })
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, limit);

    return underperforming;
  }

  /**
   * Calculate profit margin if product cost data is available
   */
  static calculateProfitMargin(
    entries: RevenueEntry[],
    products: Product[]
  ): {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    profitMargin: number;
  } {
    const productCostMap = new Map(
      products.map((p) => [p.id, p.purchasePrice])
    );

    let totalRevenue = 0;
    let totalCost = 0;

    entries.forEach((entry) => {
      totalRevenue += entry.amount;
      const productCost = productCostMap.get(entry.productId) || 0;
      totalCost += productCost * entry.quantity;
    });

    const grossProfit = totalRevenue - totalCost;
    const profitMargin =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin,
    };
  }

  /**
   * Get period key for grouping
   */
  private static getPeriodKey(
    date: Date,
    periodType: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    switch (periodType) {
      case 'daily':
        return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
      case 'monthly':
        return `${year}-${(month + 1).toString().padStart(2, '0')}`;
      case 'yearly':
        return year.toString();
      default:
        return `${year}-${(month + 1).toString().padStart(2, '0')}`;
    }
  }

  /**
   * Get period start date
   */
  private static getPeriodStartDate(
    date: Date,
    periodType: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): Date {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    switch (periodType) {
      case 'daily':
        return new Date(year, month, day);
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return new Date(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate()
        );
      case 'monthly':
        return new Date(year, month, 1);
      case 'yearly':
        return new Date(year, 0, 1);
      default:
        return new Date(year, month, 1);
    }
  }

  /**
   * Filter entries by date range
   */
  static filterByDateRange(
    entries: RevenueEntry[],
    startDate?: Date,
    endDate?: Date
  ): RevenueEntry[] {
    let filtered = entries;

    if (startDate) {
      filtered = filtered.filter((entry) => entry.saleDate >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((entry) => entry.saleDate <= endDate);
    }

    return filtered;
  }

  /**
   * Get revenue trend direction
   */
  static getTrendDirection(
    data: PeriodRevenueData[]
  ): 'up' | 'down' | 'stable' {
    if (data.length < 2) {
      return 'stable';
    }

    const lastTwo = data.slice(-2);
    const [previous, current] = lastTwo;

    if (current.revenue > previous.revenue) {
      return 'up';
    } else if (current.revenue < previous.revenue) {
      return 'down';
    } else {
      return 'stable';
    }
  }
}
