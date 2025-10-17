/**
 * ProductVariant feature-specific types
 * T019 [P] [US1] - Create ProductVariant types for feature module
 */

import type { ProductVariant } from '@/types';

/**
 * Form for creating/editing product variants
 */
export interface ProductVariantFormData {
  productId: string;
  color: string;
  size: 'S' | 'M' | 'L' | 'XL';
  form: 'oversized' | 'fit';
  inventoryCount: number;
  reservedCount: number;
  soldCount: number;
}

/**
 * Variant creation data (without generated fields)
 */
export interface CreateProductVariantData {
  productId: string;
  color: string;
  size: 'S' | 'M' | 'L' | 'XL';
  form: 'oversized' | 'fit';
  inventoryCount: number;
  reservedCount?: number;
  soldCount?: number;
}

/**
 * Variant update data (partial fields)
 */
export interface UpdateProductVariantData {
  color?: string;
  size?: 'S' | 'M' | 'L' | 'XL';
  form?: 'oversized' | 'fit';
  inventoryCount?: number;
  reservedCount?: number;
  soldCount?: number;
  sku?: string;
}

/**
 * Variant combination for uniqueness validation
 */
export interface VariantCombination {
  productId: string;
  color: string;
  size: 'S' | 'M' | 'L' | 'XL';
  form: 'oversized' | 'fit';
}

/**
 * Variant filter options
 */
export interface VariantFilterOptions {
  productId?: string;
  color?: string;
  size?: 'S' | 'M' | 'L' | 'XL';
  form?: 'oversized' | 'fit';
  hasInventory?: boolean;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  minInventory?: number;
  maxInventory?: number;
}

/**
 * Variant sort options
 */
export type VariantSortField =
  | 'sku'
  | 'color'
  | 'size'
  | 'form'
  | 'inventoryCount'
  | 'reservedCount'
  | 'soldCount'
  | 'availableCount'
  | 'createdAt'
  | 'updatedAt';

export type VariantSortDirection = 'asc' | 'desc';

export interface VariantSortOptions {
  field: VariantSortField;
  direction: VariantSortDirection;
}

/**
 * Variant search options
 */
export interface VariantSearchOptions {
  query?: string;
  filter?: VariantFilterOptions;
  sort?: VariantSortOptions;
  limit?: number;
  offset?: number;
}

/**
 * Variant with computed available count
 */
export interface ProductVariantWithAvailable extends ProductVariant {
  availableCount: number;
}

/**
 * Variant statistics
 */
export interface VariantStats {
  totalVariants: number;
  totalInventory: number;
  totalReserved: number;
  totalSold: number;
  totalAvailable: number;
  lowStockCount: number;
  outOfStockCount: number;
  averageInventoryPerVariant: number;
}

/**
 * Bulk variant creation result
 */
export interface BulkVariantResult {
  successful: ProductVariant[];
  failed: {
    data: CreateProductVariantData;
    error: string;
  }[];
  totalAttempted: number;
  successCount: number;
  failureCount: number;
}

/**
 * Variant validation result
 */
export interface VariantValidationResult {
  isValid: boolean;
  error?: string;
  conflictingVariant?: ProductVariant;
}

/**
 * SKU validation result
 */
export interface SKUValidationResult {
  isValid: boolean;
  error?: string;
  conflictingVariant?: ProductVariant;
}

/**
 * Variant inventory operation types
 */
export type VariantInventoryOperation =
  | 'add'
  | 'remove'
  | 'set'
  | 'reserve'
  | 'unreserve'
  | 'sell';

/**
 * Variant inventory update data
 */
export interface VariantInventoryUpdate {
  operation: VariantInventoryOperation;
  quantity: number;
  reason?: string;
}

/**
 * Variant inventory change record
 */
export interface VariantInventoryChange {
  variantId: string;
  operation: VariantInventoryOperation;
  previousInventory: number;
  newInventory: number;
  previousReserved: number;
  newReserved: number;
  previousSold: number;
  newSold: number;
  quantity: number;
  reason?: string;
  timestamp: Date;
}

/**
 * Variant table display data
 */
export interface VariantTableRow {
  variant: ProductVariant;
  availableCount: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  profitMargin?: number;
}

/**
 * Variant dialog mode
 */
export type VariantDialogMode = 'create' | 'edit' | 'view';

/**
 * Variant dialog props
 */
export interface VariantDialogProps {
  mode: VariantDialogMode;
  productId: string;
  variant?: ProductVariant;
  isOpen: boolean;
  onClose: () => void;
  onSave: (variant: ProductVariant) => void;
}

/**
 * Size options
 */
export const VARIANT_SIZES = ['S', 'M', 'L', 'XL'] as const;

/**
 * Form options
 */
export const VARIANT_FORMS = ['oversized', 'fit'] as const;

/**
 * Common color options
 */
export const COMMON_COLORS = [
  'Black',
  'White',
  'Gray',
  'Navy',
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Orange',
  'Purple',
  'Pink',
  'Brown',
  'Beige',
  'Maroon',
  'Teal',
] as const;

/**
 * Inventory status
 */
export type InventoryStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

/**
 * Helper function to get inventory status
 */
export function getInventoryStatus(
  availableCount: number,
  lowStockThreshold: number = 5
): InventoryStatus {
  if (availableCount <= 0) {
    return 'out-of-stock';
  }
  if (availableCount <= lowStockThreshold) {
    return 'low-stock';
  }
  return 'in-stock';
}

/**
 * Helper function to calculate available count
 */
export function calculateAvailableCount(variant: ProductVariant): number {
  return Math.max(
    0,
    variant.inventoryCount - variant.reservedCount - variant.soldCount
  );
}

/**
 * Helper function to check if variant is low stock
 */
export function isLowStock(
  variant: ProductVariant,
  threshold: number = 5
): boolean {
  const available = calculateAvailableCount(variant);
  return available > 0 && available <= threshold;
}

/**
 * Helper function to check if variant is out of stock
 */
export function isOutOfStock(variant: ProductVariant): boolean {
  return calculateAvailableCount(variant) <= 0;
}

/**
 * Helper function to create variant display name
 */
export function createVariantDisplayName(variant: ProductVariant): string {
  return `${variant.color} - ${variant.size} - ${variant.form}`;
}

/**
 * Helper function to format variant for display
 */
export function formatVariantForDisplay(
  variant: ProductVariant
): VariantTableRow {
  const availableCount = calculateAvailableCount(variant);
  return {
    variant,
    availableCount,
    isLowStock: isLowStock(variant),
    isOutOfStock: isOutOfStock(variant),
  };
}
