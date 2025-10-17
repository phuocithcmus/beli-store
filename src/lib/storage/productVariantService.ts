/**
 * ProductVariant Storage Service
 * Handles CRUD operations for product variants
 * T017 [P] [US1] - TDD Implementation
 */

import { storageService } from './index';
import { generateUniqueSKU } from '@/lib/utils/skuGenerator';
import { validateVariantUniqueness } from '@/lib/utils/variantValidation';
import type { ProductVariant } from '@/types';

/**
 * Get all product variants
 */
export function getProductVariants(): ProductVariant[] {
  return storageService.getProductVariants();
}

/**
 * Get a specific product variant by ID
 */
export function getProductVariant(id: string): ProductVariant | undefined {
  return storageService.getProductVariant(id);
}

/**
 * Get product variants for a specific product
 */
export function getProductVariantsByProduct(
  productId: string
): ProductVariant[] {
  return storageService.getProductVariantsByProduct(productId);
}

/**
 * Get product variant by SKU
 */
export function getProductVariantBySKU(
  sku: string
): ProductVariant | undefined {
  return storageService.getProductVariantBySKU(sku);
}

/**
 * Save a new product variant
 */
export function saveProductVariant(
  variant: Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>
): ProductVariant {
  return storageService.saveProductVariant(variant);
}

/**
 * Update an existing product variant
 */
export function updateProductVariant(
  id: string,
  updates: Partial<
    Omit<ProductVariant, 'id' | 'productId' | 'createdAt' | 'updatedAt'>
  >
): ProductVariant {
  return storageService.updateProductVariant(id, updates);
}

/**
 * Delete a product variant
 */
export function deleteProductVariant(id: string): boolean {
  return storageService.deleteProductVariant(id);
}

/**
 * Create a variant with auto-generated SKU
 */
export function createVariantWithAutoSKU(variant: {
  productId: string;
  color: string;
  size: 'S' | 'M' | 'L' | 'XL';
  form: 'oversized' | 'fit';
  inventoryCount: number;
  reservedCount?: number;
  soldCount?: number;
}): ProductVariant {
  // Get the product to get its code
  const product = storageService.getProduct(variant.productId);
  if (!product) {
    throw new Error('Product not found');
  }

  // Get existing variants to ensure uniqueness
  const existingVariants = getProductVariants();
  const existingSKUs = existingVariants.map((v) => v.sku);

  // Validate variant uniqueness
  const uniquenessResult = validateVariantUniqueness(
    {
      productId: variant.productId,
      color: variant.color,
      size: variant.size,
      form: variant.form,
    },
    existingVariants
  );

  if (!uniquenessResult.isValid) {
    throw new Error(
      uniquenessResult.error || 'Variant combination already exists'
    );
  }

  // Generate unique SKU
  const sku = generateUniqueSKU(
    {
      productCode: product.code,
      color: variant.color,
      size: variant.size,
      form: variant.form,
    },
    existingSKUs
  );

  // Create the variant
  return saveProductVariant({
    productId: variant.productId,
    color: variant.color,
    size: variant.size,
    form: variant.form,
    sku,
    inventoryCount: variant.inventoryCount,
    reservedCount: variant.reservedCount || 0,
    soldCount: variant.soldCount || 0,
  });
}

/**
 * Update variant inventory (for sales tracking)
 */
export function updateVariantInventory(
  variantId: string,
  changes: {
    inventoryChange?: number;
    reservedChange?: number;
    soldChange?: number;
  }
): ProductVariant {
  const variant = getProductVariant(variantId);
  if (!variant) {
    throw new Error('Product variant not found');
  }

  const updates: Partial<ProductVariant> = {};

  if (changes.inventoryChange !== undefined) {
    updates.inventoryCount = Math.max(
      0,
      variant.inventoryCount + changes.inventoryChange
    );
  }

  if (changes.reservedChange !== undefined) {
    updates.reservedCount = Math.max(
      0,
      variant.reservedCount + changes.reservedChange
    );
  }

  if (changes.soldChange !== undefined) {
    updates.soldCount = Math.max(0, variant.soldCount + changes.soldChange);
  }

  return updateProductVariant(variantId, updates);
}

/**
 * Get available inventory for a variant
 */
export function getAvailableInventory(variantId: string): number {
  const variant = getProductVariant(variantId);
  if (!variant) {
    return 0;
  }

  return Math.max(
    0,
    variant.inventoryCount - variant.reservedCount - variant.soldCount
  );
}

/**
 * Check if a variant has sufficient inventory
 */
export function hasInventoryAvailable(
  variantId: string,
  requestedQuantity: number
): boolean {
  const available = getAvailableInventory(variantId);
  return available >= requestedQuantity;
}

/**
 * Get variants with low inventory (configurable threshold)
 */
export function getLowInventoryVariants(
  threshold: number = 5
): ProductVariant[] {
  const allVariants = getProductVariants();
  return allVariants.filter((variant) => {
    const available =
      variant.inventoryCount - variant.reservedCount - variant.soldCount;
    return available > 0 && available <= threshold;
  });
}

/**
 * Get out-of-stock variants
 */
export function getOutOfStockVariants(): ProductVariant[] {
  const allVariants = getProductVariants();
  return allVariants.filter((variant) => {
    const available =
      variant.inventoryCount - variant.reservedCount - variant.soldCount;
    return available <= 0;
  });
}

/**
 * Bulk create variants for a product
 */
export function bulkCreateVariants(
  productId: string,
  variants: {
    color: string;
    size: 'S' | 'M' | 'L' | 'XL';
    form: 'oversized' | 'fit';
    inventoryCount: number;
    reservedCount?: number;
    soldCount?: number;
  }[]
): ProductVariant[] {
  const product = storageService.getProduct(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const createdVariants: ProductVariant[] = [];

  for (const variantData of variants) {
    try {
      const variant = createVariantWithAutoSKU({
        productId,
        ...variantData,
      });
      createdVariants.push(variant);
    } catch (error) {
      // Continue with other variants even if one fails
      // eslint-disable-next-line no-console
      console.warn(
        `Failed to create variant for ${variantData.color}-${variantData.size}-${variantData.form}:`,
        error
      );
    }
  }

  return createdVariants;
}

/**
 * Get variant statistics for a product
 */
export function getVariantStats(productId: string) {
  const variants = getProductVariantsByProduct(productId);

  const totalInventory = variants.reduce((sum, v) => sum + v.inventoryCount, 0);
  const totalReserved = variants.reduce((sum, v) => sum + v.reservedCount, 0);
  const totalSold = variants.reduce((sum, v) => sum + v.soldCount, 0);
  const totalAvailable = variants.reduce((sum, v) => {
    const available = v.inventoryCount - v.reservedCount - v.soldCount;
    return sum + Math.max(0, available);
  }, 0);

  const lowStock = variants.filter((v) => {
    const available = v.inventoryCount - v.reservedCount - v.soldCount;
    return available > 0 && available <= 5;
  }).length;

  const outOfStock = variants.filter((v) => {
    const available = v.inventoryCount - v.reservedCount - v.soldCount;
    return available <= 0;
  }).length;

  return {
    totalVariants: variants.length,
    totalInventory,
    totalReserved,
    totalSold,
    totalAvailable,
    lowStockCount: lowStock,
    outOfStockCount: outOfStock,
    averageInventoryPerVariant:
      variants.length > 0 ? Math.round(totalInventory / variants.length) : 0,
  };
}
