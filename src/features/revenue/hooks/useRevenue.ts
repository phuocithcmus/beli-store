/**
 * useRevenue Hook
 * Custom hook for managing revenue entries and operations
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { revenueService } from '@/lib/storage/revenueService';
import type { RevenueEntry, RevenueEntryFormData } from '@/types';
import type {
  RevenueFilters,
  RevenueSortOptions,
  UseRevenueReturn,
} from '@/features/revenue/types/revenue';

export function useRevenue(initialFilters?: RevenueFilters): UseRevenueReturn {
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RevenueFilters>(initialFilters || {});
  const [sortOptions, setSortOptions] = useState<RevenueSortOptions>({
    field: 'date',
    direction: 'desc',
  });

  // Load revenue entries
  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = revenueService.getRevenueEntries({
        productId: filters.productId,
        salesChannel: filters.salesChannel,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        limit: 100, // Default limit
        offset: 0,
      });

      let filteredEntries = response.data;

      // Apply additional filters
      if (filters.minAmount !== undefined) {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.amount >= (filters.minAmount ?? 0)
        );
      }

      if (filters.maxAmount !== undefined) {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.amount <= (filters.maxAmount ?? Number.MAX_VALUE)
        );
      }

      if (filters.minQuantity !== undefined) {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.quantity >= (filters.minQuantity ?? 0)
        );
      }

      if (filters.maxQuantity !== undefined) {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.quantity <= (filters.maxQuantity ?? Number.MAX_VALUE)
        );
      }

      if (filters.productVariantId) {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.productVariantId === filters.productVariantId
        );
      }

      // Apply sorting
      filteredEntries.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortOptions.field) {
          case 'date':
            aValue = a.saleDate.getTime();
            bValue = b.saleDate.getTime();
            break;
          case 'amount':
            aValue = a.amount;
            bValue = b.amount;
            break;
          case 'quantity':
            aValue = a.quantity;
            bValue = b.quantity;
            break;
          case 'productName':
            aValue = a.productName.toLowerCase();
            bValue = b.productName.toLowerCase();
            break;
          case 'salesChannel':
            aValue = a.salesChannelName.toLowerCase();
            bValue = b.salesChannelName.toLowerCase();
            break;
          default:
            aValue = a.saleDate.getTime();
            bValue = b.saleDate.getTime();
        }

        if (sortOptions.direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      setEntries(filteredEntries);
    } catch (err) {
      console.error('Error loading revenue entries:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load revenue entries'
      );
    } finally {
      setLoading(false);
    }
  }, [filters, sortOptions]);

  // Create new revenue entry
  const createEntry = useCallback(
    async (data: RevenueEntryFormData): Promise<boolean> => {
      try {
        setError(null);
        const response = revenueService.createRevenueEntry(data);

        if (response.error) {
          setError(response.error);
          return false;
        }

        // Refresh entries
        await loadEntries();
        return true;
      } catch (err) {
        console.error('Error creating revenue entry:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to create revenue entry'
        );
        return false;
      }
    },
    [loadEntries]
  );

  // Update existing revenue entry
  const updateEntry = useCallback(
    async (
      id: string,
      data: Partial<RevenueEntryFormData>
    ): Promise<boolean> => {
      try {
        setError(null);
        const response = revenueService.updateRevenueEntry(id, data);

        if (response.error) {
          setError(response.error);
          return false;
        }

        // Refresh entries
        await loadEntries();
        return true;
      } catch (err) {
        console.error('Error updating revenue entry:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to update revenue entry'
        );
        return false;
      }
    },
    [loadEntries]
  );

  // Delete revenue entry
  const deleteEntry = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);
        const response = revenueService.deleteRevenueEntry(id);

        if (response.error) {
          setError(response.error);
          return false;
        }

        // Refresh entries
        await loadEntries();
        return true;
      } catch (err) {
        console.error('Error deleting revenue entry:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to delete revenue entry'
        );
        return false;
      }
    },
    [loadEntries]
  );

  // Refresh entries
  const refreshEntries = useCallback(async () => {
    await loadEntries();
  }, [loadEntries]);

  // Load entries when dependencies change
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  return {
    entries,
    loading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    refreshEntries,
    filters,
    setFilters,
    sortOptions,
    setSortOptions,
  };
}
