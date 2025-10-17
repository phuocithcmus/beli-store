/**
 * useProductVariants Hook
 * T020 [US1] - Custom hook for managing product variants
 * Depends on T017, T018
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getProductVariants,
  getProductVariantsByProduct,
  getProductVariant,
  deleteProductVariant as deleteVariant,
  getVariantStats,
  getLowInventoryVariants,
} from '@/lib/storage/productVariantService';
import type { ProductVariant } from '@/types';
import type {
  VariantSearchOptions,
  ProductVariantWithAvailable,
  VariantStats,
} from '@/features/products/types/variants';
import {
  calculateAvailableCount,
  isLowStock,
  isOutOfStock,
} from '@/features/products/types/variants';

/**
 * Hook for managing product variants with filtering, sorting, and search
 */
export function useProductVariants(productId?: string) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [filteredVariants, setFilteredVariants] = useState<
    ProductVariantWithAvailable[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load variants data
  const loadVariants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const variantsData = productId
        ? getProductVariantsByProduct(productId)
        : getProductVariants();

      setVariants(variantsData);

      // Transform to include available count
      const variantsWithAvailable = variantsData.map((variant) => ({
        ...variant,
        availableCount: calculateAvailableCount(variant),
      }));

      setFilteredVariants(variantsWithAvailable);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load variants');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Initial load
  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  // Filter and sort variants
  const filterAndSortVariants = useCallback(
    (options: VariantSearchOptions = {}) => {
      let filtered = [...variants];

      // Apply search query
      if (options.query) {
        const query = options.query.toLowerCase();
        filtered = filtered.filter(
          (variant) =>
            variant.sku.toLowerCase().includes(query) ||
            variant.color.toLowerCase().includes(query) ||
            variant.size.toLowerCase().includes(query) ||
            variant.form.toLowerCase().includes(query)
        );
      }

      // Apply filters
      if (options.filter) {
        const filter = options.filter;

        if (filter.color) {
          filtered = filtered.filter((v) =>
            v.color.toLowerCase().includes(filter.color?.toLowerCase() || '')
          );
        }

        if (filter.size) {
          filtered = filtered.filter((v) => v.size === filter.size);
        }

        if (filter.form) {
          filtered = filtered.filter((v) => v.form === filter.form);
        }

        if (filter.hasInventory !== undefined) {
          filtered = filtered.filter((v) => {
            const available = calculateAvailableCount(v);
            return filter.hasInventory ? available > 0 : available <= 0;
          });
        }

        if (filter.isLowStock) {
          filtered = filtered.filter((v) => isLowStock(v));
        }

        if (filter.isOutOfStock) {
          filtered = filtered.filter((v) => isOutOfStock(v));
        }

        if (filter.minInventory !== undefined) {
          filtered = filtered.filter(
            (v) => calculateAvailableCount(v) >= (filter.minInventory || 0)
          );
        }

        if (filter.maxInventory !== undefined) {
          filtered = filtered.filter(
            (v) => calculateAvailableCount(v) <= (filter.maxInventory || 0)
          );
        }
      }

      // Apply sorting
      if (options.sort) {
        const { field, direction } = options.sort;

        filtered.sort((a, b) => {
          let aVal: string | number | Date;
          let bVal: string | number | Date;

          switch (field) {
            case 'sku':
              aVal = a.sku;
              bVal = b.sku;
              break;
            case 'color':
              aVal = a.color;
              bVal = b.color;
              break;
            case 'size':
              // Custom size sorting: S, M, L, XL
              const sizeOrder = { S: 1, M: 2, L: 3, XL: 4 };
              aVal = sizeOrder[a.size];
              bVal = sizeOrder[b.size];
              break;
            case 'form':
              aVal = a.form;
              bVal = b.form;
              break;
            case 'inventoryCount':
              aVal = a.inventoryCount;
              bVal = b.inventoryCount;
              break;
            case 'reservedCount':
              aVal = a.reservedCount;
              bVal = b.reservedCount;
              break;
            case 'soldCount':
              aVal = a.soldCount;
              bVal = b.soldCount;
              break;
            case 'availableCount':
              aVal = calculateAvailableCount(a);
              bVal = calculateAvailableCount(b);
              break;
            case 'createdAt':
              aVal = a.createdAt.getTime();
              bVal = b.createdAt.getTime();
              break;
            case 'updatedAt':
              aVal = a.updatedAt.getTime();
              bVal = b.updatedAt.getTime();
              break;
            default:
              return 0;
          }

          if (typeof aVal === 'string' && typeof bVal === 'string') {
            const comparison = aVal.localeCompare(bVal);
            return direction === 'desc' ? -comparison : comparison;
          }

          if (typeof aVal === 'number' && typeof bVal === 'number') {
            const comparison = aVal - bVal;
            return direction === 'desc' ? -comparison : comparison;
          }

          return 0;
        });
      }

      // Apply pagination
      if (options.offset !== undefined || options.limit !== undefined) {
        const start = options.offset || 0;
        const end = options.limit ? start + options.limit : undefined;
        filtered = filtered.slice(start, end);
      }

      // Transform to include available count
      const variantsWithAvailable = filtered.map((variant) => ({
        ...variant,
        availableCount: calculateAvailableCount(variant),
      }));

      setFilteredVariants(variantsWithAvailable);
      return variantsWithAvailable;
    },
    [variants]
  );

  // Get variant by ID
  const getVariant = useCallback((id: string) => {
    return getProductVariant(id);
  }, []);

  // Delete variant
  const deleteVariantById = useCallback(
    async (id: string) => {
      try {
        const success = deleteVariant(id);
        if (success) {
          await loadVariants(); // Refresh data
        }
        return success;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to delete variant'
        );
        return false;
      }
    },
    [loadVariants]
  );

  // Get variant statistics
  const getStats = useCallback((): VariantStats | null => {
    if (!productId) {
      // Calculate stats for all variants
      const totalVariants = variants.length;
      const totalInventory = variants.reduce(
        (sum, v) => sum + v.inventoryCount,
        0
      );
      const totalReserved = variants.reduce(
        (sum, v) => sum + v.reservedCount,
        0
      );
      const totalSold = variants.reduce((sum, v) => sum + v.soldCount, 0);
      const totalAvailable = variants.reduce(
        (sum, v) => sum + calculateAvailableCount(v),
        0
      );
      const lowStockCount = variants.filter((v) => isLowStock(v)).length;
      const outOfStockCount = variants.filter((v) => isOutOfStock(v)).length;

      return {
        totalVariants,
        totalInventory,
        totalReserved,
        totalSold,
        totalAvailable,
        lowStockCount,
        outOfStockCount,
        averageInventoryPerVariant:
          totalVariants > 0 ? Math.round(totalInventory / totalVariants) : 0,
      };
    }

    return getVariantStats(productId);
  }, [productId, variants]);

  // Get low inventory variants
  const getLowStockVariants = useCallback(
    (threshold?: number) => {
      if (productId) {
        return variants.filter((v) => isLowStock(v, threshold));
      }
      return getLowInventoryVariants(threshold);
    },
    [productId, variants]
  );

  // Get out of stock variants
  const getOutOfStockVariantsForProduct = useCallback(() => {
    if (productId) {
      return variants.filter((v) => isOutOfStock(v));
    }
    return variants.filter((v) => isOutOfStock(v)); // All variants if no productId
  }, [productId, variants]);

  // Refresh data
  const refresh = useCallback(() => {
    return loadVariants();
  }, [loadVariants]);

  return {
    // Data
    variants,
    filteredVariants,
    loading,
    error,

    // Actions
    getVariant,
    deleteVariant: deleteVariantById,
    filterAndSortVariants,
    refresh,

    // Statistics
    getStats,
    getLowStockVariants,
    getOutOfStockVariants: getOutOfStockVariantsForProduct,
  };
}

/**
 * Hook for managing a single product variant
 */
export function useProductVariant(variantId: string) {
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVariant = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const variantData = getProductVariant(variantId);
      setVariant(variantData || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load variant');
    } finally {
      setLoading(false);
    }
  }, [variantId]);

  useEffect(() => {
    if (variantId) {
      loadVariant();
    }
  }, [variantId, loadVariant]);

  const refresh = useCallback(() => {
    return loadVariant();
  }, [loadVariant]);

  return {
    variant,
    loading,
    error,
    refresh,
  };
}
