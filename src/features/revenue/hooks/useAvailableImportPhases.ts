/**
 * useAvailableImportPhases Hook
 * Provides available import phases for revenue entry creation
 * Filters phases by product availability and remaining quantities
 */

import { useState, useEffect, useMemo } from 'react';
import { storageService } from '@/lib/storage';
import type { ImportPhase } from '@/types';

interface UseAvailableImportPhasesProps {
  productId?: string;
  enabled?: boolean;
}

interface UseAvailableImportPhasesReturn {
  availablePhases: ImportPhase[];
  allAvailablePhases: ImportPhase[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAvailableImportPhases({
  productId,
  enabled = true,
}: UseAvailableImportPhasesProps = {}): UseAvailableImportPhasesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Force re-fetch when needed
  const refetch = () => {
    // Since the data is memoized based on productId and enabled,
    // we could trigger a state update to force re-computation
    setError(null);
  };

  // Get available import phases for specific product
  const availablePhases = useMemo(() => {
    if (!enabled || !productId) {
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);

      const phases = storageService.getAvailableImportPhases(productId);
      return phases;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch import phases';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [productId, enabled]);

  // Get all available import phases (any product)
  const allAvailablePhases = useMemo(() => {
    if (!enabled) {
      return [];
    }

    try {
      return storageService.getAllAvailableImportPhases();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch all import phases';
      setError(errorMessage);
      return [];
    }
  }, [enabled]);

  // Auto-refetch when productId changes - data is reactive through useMemo dependencies

  return {
    availablePhases,
    allAvailablePhases,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get import phase details by ID
 */
export function useImportPhase(importPhaseId?: string) {
  const [phase, setPhase] = useState<ImportPhase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!importPhaseId) {
      setPhase(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const foundPhase = storageService.getImportPhase(importPhaseId);
      setPhase(foundPhase);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch import phase';
      setError(errorMessage);
      setPhase(null);
    } finally {
      setIsLoading(false);
    }
  }, [importPhaseId]);

  return {
    phase,
    isLoading,
    error,
  };
}

/**
 * Hook to check if a product has available import phases
 */
export function useHasAvailableImportPhases(productId?: string) {
  const { availablePhases } = useAvailableImportPhases({ productId });

  return {
    hasAvailablePhases: availablePhases.length > 0,
    availablePhasesCount: availablePhases.length,
  };
}

export default useAvailableImportPhases;
