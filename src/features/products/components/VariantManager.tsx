/**
 * VariantManager Container Component
 * T024 [P] [US1] - Create container to orchestrate variant operations
 *
 * This container component manages the interaction between:
 * - VariantTable for displaying variants
 * - ProductVariantDialog for creating/editing variants
 * - Variant operations (create, update, delete)
 * - State management for the variant management interface
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

import VariantTable from './VariantTable';
import { ProductVariantDialog } from './ProductVariantDialog';
import { useProductVariants } from '../hooks/useProductVariants';
import { useVariantOperations } from '../hooks/useVariantOperations';

import type { ProductVariant } from '@/types';

interface VariantManagerProps {
  /** Product ID to manage variants for */
  productId: string;
  /** Optional CSS class name */
  className?: string;
  /** Whether the interface is read-only */
  readOnly?: boolean;
  /** Callback when variant count changes */
  onVariantCountChange?: (count: number) => void;
}

/**
 * Container component that orchestrates variant management operations
 */
const VariantManager: React.FC<VariantManagerProps> = ({
  productId,
  className,
  readOnly = false,
  onVariantCountChange,
}) => {
  // State for dialog management
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(
    null
  );

  // Hooks for data and operations
  const { variants, loading, error, refresh } = useProductVariants(productId);

  const { deleteVariant, saving } = useVariantOperations();

  // Effect to notify of variant count changes
  React.useEffect(() => {
    if (onVariantCountChange && variants) {
      onVariantCountChange(variants.length);
    }
  }, [variants, onVariantCountChange]);

  // Dialog handlers
  const handleOpenCreateDialog = useCallback(() => {
    if (readOnly) {
      return;
    }
    setEditingVariant(null);
    setIsDialogOpen(true);
  }, [readOnly]);

  const handleOpenEditDialog = useCallback(
    (variant: ProductVariant) => {
      if (readOnly) {
        return;
      }
      setEditingVariant(variant);
      setIsDialogOpen(true);
    },
    [readOnly]
  );

  const handleOpenViewDialog = useCallback((variant: ProductVariant) => {
    setEditingVariant(variant);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingVariant(null);
  }, []);

  const handleDeleteVariant = useCallback(
    async (variantId: string) => {
      if (readOnly) {
        return;
      }

      try {
        await deleteVariant(variantId);

        // Variant deleted successfully
        refresh();
      } catch (error) {
        console.error('Failed to delete variant:', error);
      }
    },
    [deleteVariant, readOnly, refresh]
  );

  // Loading state
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Product Variants</h3>
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-64 animate-pulse rounded border bg-muted" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Product Variants</h3>
          {!readOnly && (
            <Button onClick={handleOpenCreateDialog} disabled>
              <Plus className="mr-2 h-4 w-4" />
              Add Variant
            </Button>
          )}
        </div>
        <div className="rounded border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load variants: {error}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Product Variants</h3>
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-64 animate-pulse rounded border bg-muted" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Product Variants</h3>
          {!readOnly && (
            <Button onClick={handleOpenCreateDialog} disabled>
              <Plus className="mr-2 h-4 w-4" />
              Add Variant
            </Button>
          )}
        </div>
        <div className="rounded border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load variants: {error}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Product Variants</h3>
          {variants && variants.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {variants.length} variant{variants.length !== 1 ? 's' : ''}{' '}
              configured
            </p>
          )}
        </div>
        {!readOnly && (
          <Button
            onClick={handleOpenCreateDialog}
            disabled={saving}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Variant
          </Button>
        )}
      </div>

      {/* Variants Table */}
      <VariantTable
        variants={variants || []}
        onEditVariant={readOnly ? undefined : handleOpenEditDialog}
        onDeleteVariant={readOnly ? undefined : handleDeleteVariant}
        onViewVariant={handleOpenViewDialog}
        className="rounded-lg border"
      />

      {/* Variant Dialog */}
      <ProductVariantDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        productId={productId}
        variant={editingVariant || undefined}
        onSuccess={() => {
          handleCloseDialog();
          refresh();
        }}
      />
    </div>
  );
};

export default VariantManager;
