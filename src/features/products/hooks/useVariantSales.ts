/**
 * Hook for managing variant sales operations
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  SaleTransaction,
  VariantSaleRecord,
  VariantSalesSummary,
  ProductVariant,
} from '@/types';
import { variantSalesService } from '@/lib/storage/variantSalesService';

interface UseVariantSalesReturn {
  // Data
  sales: VariantSaleRecord[];
  summary: VariantSalesSummary;

  // Loading states
  isLoading: boolean;
  isRecordingSale: boolean;

  // Error states
  error: string | null;

  // Actions
  recordSale: (
    transaction: Omit<SaleTransaction, 'id'>
  ) => Promise<VariantSaleRecord>;
  reverseSale: (
    saleId: string,
    reason?: string
  ) => Promise<{
    reversedSale: VariantSaleRecord;
    updatedVariant: ProductVariant;
  }>;
  bulkRecordSales: (transactions: Omit<SaleTransaction, 'id'>[]) => Promise<{
    successful: {
      saleRecord: VariantSaleRecord;
      updatedVariant: ProductVariant;
    }[];
    failed: { transaction: SaleTransaction; error: string }[];
  }>;

  // Utilities
  refreshSales: () => void;
  clearError: () => void;
}

export function useVariantSales(variantId: string): UseVariantSalesReturn {
  const [sales, setSales] = useState<VariantSaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecordingSale, setIsRecordingSale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sales for the variant
  const loadSales = useCallback(async () => {
    if (!variantId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const variantSales = variantSalesService.getSalesForVariant(variantId);
      setSales(variantSales);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales');
    } finally {
      setIsLoading(false);
    }
  }, [variantId]);

  // Calculate summary from sales
  const summary = useMemo((): VariantSalesSummary => {
    if (sales.length === 0) {
      return {
        totalSold: 0,
        totalRevenue: 0,
        averagePrice: 0,
        lastSaleDate: undefined,
      };
    }

    const totalSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalSales = sales.length;
    const averagePrice = totalRevenue / totalSales;
    const lastSaleDate = sales[0]?.saleDate; // Sales are sorted desc

    return {
      totalSold,
      totalRevenue,
      averagePrice,
      lastSaleDate,
    };
  }, [sales]);

  // Record a new sale
  const recordSale = useCallback(
    async (
      transaction: Omit<SaleTransaction, 'id'>
    ): Promise<VariantSaleRecord> => {
      setIsRecordingSale(true);
      setError(null);

      try {
        const fullTransaction: SaleTransaction = {
          ...transaction,
          id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        const saleRecord = variantSalesService.recordSale(fullTransaction);

        // Refresh sales to get updated list
        await loadSales();

        return saleRecord;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to record sale';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsRecordingSale(false);
      }
    },
    [loadSales]
  );

  // Reverse a sale
  const reverseSale = useCallback(
    async (saleId: string, reason?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = variantSalesService.reverseSale(saleId, reason);

        // Refresh sales to get updated list
        await loadSales();

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to reverse sale';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [loadSales]
  );

  // Bulk record sales
  const bulkRecordSales = useCallback(
    async (transactions: Omit<SaleTransaction, 'id'>[]) => {
      setIsRecordingSale(true);
      setError(null);

      try {
        const fullTransactions: SaleTransaction[] = transactions.map(
          (transaction, index) => ({
            ...transaction,
            id: `sale-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          })
        );

        const result = variantSalesService.bulkRecordSales(fullTransactions);

        // Refresh sales to get updated list
        await loadSales();

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to record bulk sales';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsRecordingSale(false);
      }
    },
    [loadSales]
  );

  // Refresh sales data
  const refreshSales = useCallback(() => {
    loadSales();
  }, [loadSales]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load initial data
  useState(() => {
    loadSales();
  });

  return {
    // Data
    sales,
    summary,

    // Loading states
    isLoading,
    isRecordingSale,

    // Error states
    error,

    // Actions
    recordSale,
    reverseSale,
    bulkRecordSales,

    // Utilities
    refreshSales,
    clearError,
  };
}

interface UseAllVariantSalesReturn {
  // Data
  allSales: VariantSaleRecord[];
  salesByProduct: Record<string, VariantSaleRecord[]>;

  // Loading states
  isLoading: boolean;

  // Error states
  error: string | null;

  // Actions
  getSalesForProduct: (productId: string) => VariantSaleRecord[];
  refreshAllSales: () => void;
  clearError: () => void;
}

/**
 * Hook for managing all variant sales across all products
 */
export function useAllVariantSales(): UseAllVariantSalesReturn {
  const [allSales, setAllSales] = useState<VariantSaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group sales by product
  const salesByProduct = useMemo(() => {
    const grouped: Record<string, VariantSaleRecord[]> = {};

    allSales.forEach((sale) => {
      if (!grouped[sale.productId]) {
        grouped[sale.productId] = [];
      }
      grouped[sale.productId].push(sale);
    });

    return grouped;
  }, [allSales]);

  // Load all sales
  const loadAllSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all sales from the service
      const allSalesData = variantSalesService.getAllVariantSales();
      setAllSales(allSalesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load all sales');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get sales for specific product
  const getSalesForProduct = useCallback(
    (productId: string): VariantSaleRecord[] => {
      return salesByProduct[productId] || [];
    },
    [salesByProduct]
  );

  // Refresh all sales data
  const refreshAllSales = useCallback(() => {
    loadAllSales();
  }, [loadAllSales]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load initial data
  useState(() => {
    loadAllSales();
  });

  return {
    // Data
    allSales,
    salesByProduct,

    // Loading states
    isLoading,

    // Error states
    error,

    // Actions
    getSalesForProduct,
    refreshAllSales,
    clearError,
  };
}
