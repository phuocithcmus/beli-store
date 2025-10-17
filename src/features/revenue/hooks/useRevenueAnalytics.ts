import { useState, useEffect, useMemo, useCallback } from 'react';
import { revenueService } from '@/lib/storage/revenueService';
import { salesChannelService } from '@/lib/storage/salesChannelService';
import { RevenueCalculator } from '@/lib/utils/revenueCalculations';
import type {
  RevenueAnalyticsData,
  RevenuePeriod,
  UseRevenueAnalyticsReturn,
  AnalyticsFilters,
} from '@/features/revenue/types/revenue';

/**
 * Custom hook for revenue analytics and dashboard metrics
 * Provides comprehensive analytics data for revenue tracking dashboard
 */
export function useRevenueAnalytics(
  period: RevenuePeriod = 'month',
  filters?: AnalyticsFilters
): UseRevenueAnalyticsReturn {
  const [data, setData] = useState<RevenueAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1);
    }

    return { start, end: now };
  }, [period]);

  // Load and process analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load revenue entries using correct parameter names
      const revenueResponse = revenueService.getRevenueEntries({
        dateFrom: dateRange.start,
        dateTo: dateRange.end,
        salesChannel: filters?.salesChannelId,
        productId: filters?.productId,
      });

      // Load sales channels using correct method name (returns array directly)
      const channels = salesChannelService.getSalesChannels();

      const entries = revenueResponse.data;

      // Calculate total metrics using static methods
      const metrics = RevenueCalculator.calculateMetrics(entries);
      const totalRevenue = metrics.totalRevenue;
      const totalQuantity = metrics.totalQuantity;
      const totalOrders = metrics.totalTransactions;
      const averageOrderValue = metrics.averageOrderValue;

      // Calculate profit (simplified - assuming 30% margin)
      const totalProfit = totalRevenue * 0.3;

      // P2 Integration: Calculate net revenue metrics from entries
      const totalChannelFees = entries.reduce(
        (sum, entry) => sum + (entry.channelFee || 0),
        0
      );
      const totalNetRevenue = entries.reduce(
        (sum, entry) => sum + (entry.netAmount || entry.amount),
        0
      );
      const averageNetOrderValue =
        totalOrders > 0 ? totalNetRevenue / totalOrders : 0;
      const averageFeePerOrder =
        totalOrders > 0 ? totalChannelFees / totalOrders : 0;

      // Calculate growth metrics (compare with previous period)
      const previousStart = new Date(dateRange.start);
      const previousEnd = new Date(dateRange.end);
      const periodDays = Math.ceil(
        (dateRange.end.getTime() - dateRange.start.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      previousStart.setDate(previousStart.getDate() - periodDays);
      previousEnd.setDate(previousEnd.getDate() - periodDays);

      const previousRevenueResponse = revenueService.getRevenueEntries({
        dateFrom: previousStart,
        dateTo: previousEnd,
        salesChannel: filters?.salesChannelId,
        productId: filters?.productId,
      });

      let revenueGrowth = 0;
      let quantityGrowth = 0;
      let profitGrowth = 0;

      if (previousRevenueResponse.data.length > 0) {
        const previousMetrics = RevenueCalculator.calculateMetrics(
          previousRevenueResponse.data
        );
        const previousRevenue = previousMetrics.totalRevenue;
        const previousQuantity = previousMetrics.totalQuantity;
        const previousProfit = previousRevenue * 0.3;

        revenueGrowth =
          previousRevenue > 0
            ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
            : 0;
        quantityGrowth =
          previousQuantity > 0
            ? ((totalQuantity - previousQuantity) / previousQuantity) * 100
            : 0;
        profitGrowth =
          previousProfit > 0
            ? ((totalProfit - previousProfit) / previousProfit) * 100
            : 0;
      }

      // Calculate analytics by different dimensions using correct static methods
      const revenueByProduct = RevenueCalculator.calculateByProduct(entries);
      const revenueByChannel = RevenueCalculator.calculateByChannel(entries);
      const revenueByPeriod = RevenueCalculator.groupByPeriod(
        entries,
        period === 'week' ? 'daily' : 'monthly'
      );

      // Calculate top performers
      const topProducts = revenueByProduct
        .map((product: any) => ({
          productName: product.productName,
          revenue: product.revenue,
          quantity: product.quantity,
          profit: product.revenue * 0.3,
          averagePrice: product.averagePrice,
        }))
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      const topChannels = revenueByChannel
        .map((channel: any) => ({
          channelName: channel.channelName,
          revenue: channel.revenue,
          quantity: channel.quantity,
          profit: channel.revenue * 0.3,
          orderCount: channel.transactions,
          averageOrderValue: channel.averageOrderValue,
        }))
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate channel performance metrics with P2 fee integration
      const channelPerformance = channels.map((channel: any) => {
        const channelData = revenueByChannel.find(
          (rc: any) => rc.channelName === channel.name
        );

        const channelRevenue = channelData?.revenue || 0;
        const channelNetRevenue = channelData?.netRevenue || channelRevenue;
        const channelTotalFees = channelData?.totalFees || 0;
        const channelOrders = channelData?.transactions || 0;
        const channelMarketShare = channelData?.marketShare || 0;
        const channelNetMarketShare =
          channelData?.netMarketShare || channelMarketShare;
        const channelAverageOrderValue = channelData?.averageOrderValue || 0;
        const channelAverageNetOrderValue =
          channelData?.averageNetOrderValue || channelAverageOrderValue;
        const channelAverageFeePerTransaction =
          channelData?.averageFeePerTransaction || 0;

        return {
          id: channel.id,
          name: channel.name,
          revenue: channelRevenue,
          netRevenue: channelNetRevenue,
          totalFees: channelTotalFees,
          orders: channelOrders,
          conversionRate: channelOrders > 0 ? channelOrders / 100 : 0, // Simplified metric
          averageOrderValue: channelAverageOrderValue,
          averageNetOrderValue: channelAverageNetOrderValue,
          averageFeePerTransaction: channelAverageFeePerTransaction,
          marketShare: channelMarketShare,
          netMarketShare: channelNetMarketShare,
          commissionRate: channel.commissionRate || 0,
        };
      });

      // Prepare trends data
      const trends = revenueByPeriod
        .map((periodData) => ({
          period: periodData.period,
          revenue: periodData.revenue,
          quantity: periodData.quantity,
          profit: periodData.revenue * 0.3,
          orders: periodData.transactions,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      const analyticsData: RevenueAnalyticsData = {
        // Summary metrics
        totalRevenue,
        totalNetRevenue,
        totalChannelFees,
        totalQuantity,
        totalProfit,
        totalOrders,
        averageOrderValue,
        averageNetOrderValue,
        averageFeePerOrder,

        // Growth metrics
        revenueGrowth,
        quantityGrowth,
        profitGrowth,

        // Top performers
        topProducts,
        topChannels,

        // Channel performance
        channelPerformance,

        // Trends
        trends,

        // Period info
        period,
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
      };

      setData(analyticsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load analytics data'
      );
    } finally {
      setLoading(false);
    }
  }, [
    dateRange.start,
    dateRange.end,
    filters?.salesChannelId,
    filters?.productId,
    period,
  ]);

  // Refresh analytics data
  const refreshAnalytics = () => {
    loadAnalytics();
  };

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    data,
    loading,
    error,
    refreshAnalytics,
  };
}
