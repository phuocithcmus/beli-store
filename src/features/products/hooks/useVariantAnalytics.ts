/**
 * Hook for variant analytics and performance tracking
 */

import { useState, useCallback, useMemo } from 'react';
import type { ProductVariant, VariantSalesSummary } from '@/types';
import { variantSalesService } from '@/lib/storage/variantSalesService';
import { storageService } from '@/lib/storage';
import {
  calculateInventoryTurnover,
  getInventoryStatus,
  calculateABCAnalysis,
  predictInventoryNeeds,
  calculateCOGS,
} from '@/lib/utils/inventoryCalculations';

interface VariantPerformanceData {
  variant: ProductVariant;
  salesSummary: VariantSalesSummary;
  inventoryStatus: {
    status: 'out-of-stock' | 'low-stock' | 'in-stock' | 'overstocked';
    availableQuantity: number;
    message: string;
  };
  turnoverMetrics: {
    turnoverRate: number;
    averageDailySales: number;
    daysOfInventoryRemaining: number;
  };
  profitabilityMetrics: {
    totalCOGS: number;
    totalRevenue: number;
    grossProfit: number;
    grossMargin: number;
  };
  abcClassification?: 'A' | 'B' | 'C';
  forecast: {
    predictedSales: number;
    recommendedRestockQuantity: number;
    forecastAccuracy: 'high' | 'medium' | 'low';
  };
}

interface UseVariantAnalyticsReturn {
  // Data
  variantPerformance: VariantPerformanceData | null;
  topPerformingVariants: VariantPerformanceData[];
  lowStockVariants: VariantPerformanceData[];
  slowMovingVariants: VariantPerformanceData[];
  profitableVariants: VariantPerformanceData[];

  // Loading states
  isLoading: boolean;

  // Error states
  error: string | null;

  // Actions
  refreshAnalytics: () => void;
  clearError: () => void;

  // Utilities
  getVariantPerformance: (variantId: string) => VariantPerformanceData | null;
}

export function useVariantAnalytics(
  variantId?: string
): UseVariantAnalyticsReturn {
  const [variantPerformance, setVariantPerformance] =
    useState<VariantPerformanceData | null>(null);
  const [allVariantPerformance, setAllVariantPerformance] = useState<
    VariantPerformanceData[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate performance data for a variant
  const calculateVariantPerformance = useCallback(
    async (variant: ProductVariant): Promise<VariantPerformanceData> => {
      const salesHistory = variantSalesService.getSalesForVariant(variant.id);
      const salesSummary = variantSalesService.getSalesSummaryForVariant(
        variant.id
      );

      // Get product to calculate cost
      const product = storageService.getProduct(variant.productId);
      const costPerUnit = product?.purchasePrice || 0;

      // Calculate various metrics
      const inventoryStatus = getInventoryStatus(variant, salesHistory);
      const turnoverMetrics = calculateInventoryTurnover(variant, salesHistory);
      const profitabilityMetrics = calculateCOGS(salesHistory, costPerUnit);
      const forecast = predictInventoryNeeds(variant, salesHistory);

      return {
        variant,
        salesSummary,
        inventoryStatus,
        turnoverMetrics,
        profitabilityMetrics,
        forecast,
      };
    },
    []
  );

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allVariants = storageService.getProductVariants();

      // Calculate performance for all variants
      const performancePromises = allVariants.map((variant) =>
        calculateVariantPerformance(variant)
      );

      const allPerformance = await Promise.all(performancePromises);

      // Calculate ABC classification
      const abcAnalysis = calculateABCAnalysis(
        allVariants.map((variant) => ({
          variant,
          salesHistory: variantSalesService.getSalesForVariant(variant.id),
        }))
      );

      // Add ABC classification to performance data
      const performanceWithABC = allPerformance.map((performance) => {
        const abcResult = abcAnalysis.find(
          (abc) => abc.variant.id === performance.variant.id
        );
        return {
          ...performance,
          abcClassification: abcResult?.classification,
        };
      });

      setAllVariantPerformance(performanceWithABC);

      // Set specific variant performance if variantId is provided
      if (variantId) {
        const specificPerformance = performanceWithABC.find(
          (p) => p.variant.id === variantId
        );
        setVariantPerformance(specificPerformance || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [variantId, calculateVariantPerformance]);

  // Top performing variants (by revenue)
  const topPerformingVariants = useMemo(() => {
    return [...allVariantPerformance]
      .sort((a, b) => b.salesSummary.totalRevenue - a.salesSummary.totalRevenue)
      .slice(0, 10);
  }, [allVariantPerformance]);

  // Low stock variants
  const lowStockVariants = useMemo(() => {
    return allVariantPerformance.filter(
      (p) =>
        p.inventoryStatus.status === 'low-stock' ||
        p.inventoryStatus.status === 'out-of-stock'
    );
  }, [allVariantPerformance]);

  // Slow moving variants (high days of inventory remaining)
  const slowMovingVariants = useMemo(() => {
    return [...allVariantPerformance]
      .filter((p) => p.turnoverMetrics.daysOfInventoryRemaining > 60)
      .sort(
        (a, b) =>
          b.turnoverMetrics.daysOfInventoryRemaining -
          a.turnoverMetrics.daysOfInventoryRemaining
      )
      .slice(0, 10);
  }, [allVariantPerformance]);

  // Most profitable variants (by gross margin)
  const profitableVariants = useMemo(() => {
    return [...allVariantPerformance]
      .filter((p) => p.profitabilityMetrics.grossMargin > 0)
      .sort(
        (a, b) =>
          b.profitabilityMetrics.grossMargin -
          a.profitabilityMetrics.grossMargin
      )
      .slice(0, 10);
  }, [allVariantPerformance]);

  // Get specific variant performance
  const getVariantPerformance = useCallback(
    (targetVariantId: string): VariantPerformanceData | null => {
      return (
        allVariantPerformance.find((p) => p.variant.id === targetVariantId) ||
        null
      );
    },
    [allVariantPerformance]
  );

  // Refresh analytics
  const refreshAnalytics = useCallback(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load initial data
  useState(() => {
    loadAnalytics();
  });

  return {
    // Data
    variantPerformance,
    topPerformingVariants,
    lowStockVariants,
    slowMovingVariants,
    profitableVariants,

    // Loading states
    isLoading,

    // Error states
    error,

    // Actions
    refreshAnalytics,
    clearError,

    // Utilities
    getVariantPerformance,
  };
}

interface DashboardMetrics {
  totalVariants: number;
  totalInventoryValue: number;
  totalSalesRevenue: number;
  averageGrossMargin: number;
  lowStockCount: number;
  outOfStockCount: number;
  topSellingVariant: VariantPerformanceData | null;
  slowestMovingVariant: VariantPerformanceData | null;
}

interface UseVariantDashboardReturn {
  // Data
  metrics: DashboardMetrics;

  // Loading states
  isLoading: boolean;

  // Error states
  error: string | null;

  // Actions
  refreshDashboard: () => void;
  clearError: () => void;
}

/**
 * Hook for variant dashboard analytics
 */
export function useVariantDashboard(): UseVariantDashboardReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalVariants: 0,
    totalInventoryValue: 0,
    totalSalesRevenue: 0,
    averageGrossMargin: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    topSellingVariant: null,
    slowestMovingVariant: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate dashboard metrics
  const calculateDashboardMetrics =
    useCallback(async (): Promise<DashboardMetrics> => {
      const allVariants = storageService.getProductVariants();
      const totalVariants = allVariants.length;

      if (totalVariants === 0) {
        return {
          totalVariants: 0,
          totalInventoryValue: 0,
          totalSalesRevenue: 0,
          averageGrossMargin: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          topSellingVariant: null,
          slowestMovingVariant: null,
        };
      }

      // Calculate performance for all variants
      const performancePromises = allVariants.map(async (variant) => {
        const salesHistory = variantSalesService.getSalesForVariant(variant.id);
        const salesSummary = variantSalesService.getSalesSummaryForVariant(
          variant.id
        );
        const product = storageService.getProduct(variant.productId);
        const costPerUnit = product?.purchasePrice || 0;

        const inventoryStatus = getInventoryStatus(variant, salesHistory);
        const turnoverMetrics = calculateInventoryTurnover(
          variant,
          salesHistory
        );
        const profitabilityMetrics = calculateCOGS(salesHistory, costPerUnit);
        const forecast = predictInventoryNeeds(variant, salesHistory);

        return {
          variant,
          salesSummary,
          inventoryStatus,
          turnoverMetrics,
          profitabilityMetrics,
          forecast,
        };
      });

      const allPerformance = await Promise.all(performancePromises);

      // Calculate aggregated metrics
      const totalInventoryValue = allVariants.reduce((sum, variant) => {
        const product = storageService.getProduct(variant.productId);
        const costPerUnit = product?.purchasePrice || 0;
        return sum + variant.inventoryCount * costPerUnit;
      }, 0);

      const totalSalesRevenue = allPerformance.reduce(
        (sum, p) => sum + p.salesSummary.totalRevenue,
        0
      );

      const totalGrossProfit = allPerformance.reduce(
        (sum, p) => sum + p.profitabilityMetrics.grossProfit,
        0
      );

      const averageGrossMargin =
        totalSalesRevenue > 0
          ? (totalGrossProfit / totalSalesRevenue) * 100
          : 0;

      const lowStockCount = allPerformance.filter(
        (p) => p.inventoryStatus.status === 'low-stock'
      ).length;

      const outOfStockCount = allPerformance.filter(
        (p) => p.inventoryStatus.status === 'out-of-stock'
      ).length;

      // Find top selling and slowest moving variants
      const topSellingVariant = allPerformance.reduce(
        (top, current) =>
          !top ||
          current.salesSummary.totalRevenue > top.salesSummary.totalRevenue
            ? current
            : top,
        null as VariantPerformanceData | null
      );

      const slowestMovingVariant = allPerformance.reduce(
        (slowest, current) =>
          !slowest ||
          current.turnoverMetrics.daysOfInventoryRemaining >
            slowest.turnoverMetrics.daysOfInventoryRemaining
            ? current
            : slowest,
        null as VariantPerformanceData | null
      );

      return {
        totalVariants,
        totalInventoryValue,
        totalSalesRevenue,
        averageGrossMargin: Math.round(averageGrossMargin * 100) / 100,
        lowStockCount,
        outOfStockCount,
        topSellingVariant,
        slowestMovingVariant,
      };
    }, []);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dashboardMetrics = await calculateDashboardMetrics();
      setMetrics(dashboardMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [calculateDashboardMetrics]);

  // Refresh dashboard
  const refreshDashboard = useCallback(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load initial data
  useState(() => {
    loadDashboard();
  });

  return {
    // Data
    metrics,

    // Loading states
    isLoading,

    // Error states
    error,

    // Actions
    refreshDashboard,
    clearError,
  };
}
