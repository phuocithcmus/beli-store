/**
 * useVariantOperations Hook
 * T021 [US1] - Custom hook for variant CRUD operations
 * Depends on T020
 */

import { useState, useCallback } from 'react';
import {
  createVariantWithAutoSKU,
  updateVariantInventory,
  updateProductVariant,
} from '@/lib/storage/productVariantService';
import {
  validateVariantUniqueness,
  validateSKUUniqueness,
} from '@/lib/utils/variantValidation';
import { generateUniqueSKU } from '@/lib/utils/skuGenerator';
import { storageService } from '@/lib/storage';
import type { ProductVariant } from '@/types';
import type {
  CreateProductVariantData,
  UpdateProductVariantData,
  ProductVariantFormData,
  BulkVariantResult,
  VariantInventoryUpdate,
} from '@/features/products/types/variants';

/**
 * Hook for variant CRUD operations with validation and error handling
 */
export function useVariantOperations() {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedVariant, setLastSavedVariant] =
    useState<ProductVariant | null>(null);

  // Create a new variant
  const createVariant = useCallback(
    async (data: CreateProductVariantData): Promise<ProductVariant | null> => {
      try {
        setSaving(true);
        setError(null);

        // Get the product to validate it exists
        const product = storageService.getProduct(data.productId);
        if (!product) {
          throw new Error('Product not found');
        }

        // Validate variant uniqueness
        const existingVariants = storageService.getProductVariants();
        const uniquenessResult = validateVariantUniqueness(
          {
            productId: data.productId,
            color: data.color,
            size: data.size,
            form: data.form,
          },
          existingVariants
        );

        if (!uniquenessResult.isValid) {
          throw new Error(
            uniquenessResult.error || 'Variant combination already exists'
          );
        }

        // Create variant with auto-generated SKU
        const variant = createVariantWithAutoSKU(data);
        setLastSavedVariant(variant);

        return variant;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create variant';
        setError(errorMessage);
        return null;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  // Create variant from form data
  const createVariantFromForm = useCallback(
    async (
      formData: ProductVariantFormData
    ): Promise<ProductVariant | null> => {
      const data: CreateProductVariantData = {
        productId: formData.productId,
        color: formData.color.trim(),
        size: formData.size,
        form: formData.form,
        inventoryCount: formData.inventoryCount,
        reservedCount: formData.reservedCount,
        soldCount: formData.soldCount,
      };

      return createVariant(data);
    },
    [createVariant]
  );

  // Update an existing variant
  const updateVariant = useCallback(
    async (
      variantId: string,
      updates: UpdateProductVariantData
    ): Promise<ProductVariant | null> => {
      try {
        setSaving(true);
        setError(null);

        // Get the current variant
        const currentVariant = storageService.getProductVariant(variantId);
        if (!currentVariant) {
          throw new Error('Variant not found');
        }

        // If updating variant combination, validate uniqueness
        if (updates.color || updates.size || updates.form) {
          const combination = {
            productId: currentVariant.productId,
            color: updates.color || currentVariant.color,
            size: updates.size || currentVariant.size,
            form: updates.form || currentVariant.form,
          };

          const existingVariants = storageService.getProductVariants();
          const uniquenessResult = validateVariantUniqueness(
            combination,
            existingVariants
          );

          if (
            !uniquenessResult.isValid &&
            uniquenessResult.conflictingVariant?.id !== variantId
          ) {
            throw new Error(
              uniquenessResult.error || 'Variant combination already exists'
            );
          }

          // If combination changed, regenerate SKU
          if (updates.color || updates.size || updates.form) {
            const product = storageService.getProduct(currentVariant.productId);
            if (product) {
              const existingSKUs = storageService
                .getProductVariants()
                .filter((v) => v.id !== variantId)
                .map((v) => v.sku);

              const newSKU = generateUniqueSKU(
                {
                  productCode: product.code,
                  color: combination.color,
                  size: combination.size,
                  form: combination.form,
                },
                existingSKUs
              );

              updates.sku = newSKU;
            }
          }
        }

        // If updating SKU directly, validate uniqueness
        if (updates.sku) {
          const existingVariants = storageService.getProductVariants();
          const skuResult = validateSKUUniqueness(
            updates.sku,
            existingVariants,
            variantId
          );

          if (!skuResult.isValid) {
            throw new Error(skuResult.error || 'SKU already exists');
          }
        }

        const updatedVariant = updateProductVariant(variantId, updates);
        setLastSavedVariant(updatedVariant);

        return updatedVariant;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update variant';
        setError(errorMessage);
        return null;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  // Delete a variant
  const deleteVariant = useCallback(
    async (variantId: string): Promise<boolean> => {
      try {
        setDeleting(true);
        setError(null);

        const success = storageService.deleteProductVariant(variantId);

        if (!success) {
          throw new Error('Failed to delete variant');
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete variant';
        setError(errorMessage);
        return false;
      } finally {
        setDeleting(false);
      }
    },
    []
  );

  // Update variant inventory
  const updateInventory = useCallback(
    async (
      variantId: string,
      update: VariantInventoryUpdate
    ): Promise<ProductVariant | null> => {
      try {
        setSaving(true);
        setError(null);

        const currentVariant = storageService.getProductVariant(variantId);
        if (!currentVariant) {
          throw new Error('Variant not found');
        }

        let changes = {};

        switch (update.operation) {
          case 'add':
            changes = { inventoryChange: update.quantity };
            break;
          case 'remove':
            changes = { inventoryChange: -update.quantity };
            break;
          case 'set':
            changes = {
              inventoryChange: update.quantity - currentVariant.inventoryCount,
            };
            break;
          case 'reserve':
            changes = { reservedChange: update.quantity };
            break;
          case 'unreserve':
            changes = { reservedChange: -update.quantity };
            break;
          case 'sell':
            changes = {
              soldChange: update.quantity,
              reservedChange: -update.quantity, // Assume reserved items are being sold
            };
            break;
          default:
            throw new Error('Invalid inventory operation');
        }

        const updatedVariant = updateVariantInventory(variantId, changes);
        setLastSavedVariant(updatedVariant);

        return updatedVariant;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update inventory';
        setError(errorMessage);
        return null;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  // Bulk create variants
  const bulkCreate = useCallback(
    async (
      productId: string,
      variants: CreateProductVariantData[]
    ): Promise<BulkVariantResult> => {
      try {
        setSaving(true);
        setError(null);

        const product = storageService.getProduct(productId);
        if (!product) {
          throw new Error('Product not found');
        }

        const successful: ProductVariant[] = [];
        const failed: { data: CreateProductVariantData; error: string }[] = [];

        for (const variantData of variants) {
          try {
            const variant = await createVariant(variantData);
            if (variant) {
              successful.push(variant);
            } else {
              failed.push({
                data: variantData,
                error: error || 'Unknown error',
              });
            }
          } catch (err) {
            failed.push({
              data: variantData,
              error: err instanceof Error ? err.message : 'Unknown error',
            });
          }
        }

        const result: BulkVariantResult = {
          successful,
          failed,
          totalAttempted: variants.length,
          successCount: successful.length,
          failureCount: failed.length,
        };

        if (failed.length > 0) {
          setError(
            `${failed.length} of ${variants.length} variants failed to create`
          );
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to bulk create variants';
        setError(errorMessage);

        return {
          successful: [],
          failed: variants.map((data) => ({ data, error: errorMessage })),
          totalAttempted: variants.length,
          successCount: 0,
          failureCount: variants.length,
        };
      } finally {
        setSaving(false);
      }
    },
    [createVariant, error]
  );

  // Duplicate a variant with different attributes
  const duplicateVariant = useCallback(
    async (
      sourceVariantId: string,
      overrides: Partial<CreateProductVariantData>
    ): Promise<ProductVariant | null> => {
      try {
        setSaving(true);
        setError(null);

        const sourceVariant = storageService.getProductVariant(sourceVariantId);
        if (!sourceVariant) {
          throw new Error('Source variant not found');
        }

        const data: CreateProductVariantData = {
          productId: sourceVariant.productId,
          color: sourceVariant.color,
          size: sourceVariant.size,
          form: sourceVariant.form,
          inventoryCount: sourceVariant.inventoryCount,
          reservedCount: 0, // Reset counts for duplicate
          soldCount: 0,
          ...overrides, // Apply overrides
        };

        return createVariant(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to duplicate variant';
        setError(errorMessage);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [createVariant]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setSaving(false);
    setDeleting(false);
    setError(null);
    setLastSavedVariant(null);
  }, []);

  return {
    // State
    saving,
    deleting,
    error,
    lastSavedVariant,

    // Operations
    createVariant,
    createVariantFromForm,
    updateVariant,
    deleteVariant,
    updateInventory,
    bulkCreate,
    duplicateVariant,

    // Utilities
    clearError,
    reset,
  };
}
