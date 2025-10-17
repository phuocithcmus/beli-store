/**
 * Test Helper Functions
 * Utilities for creating test data objects
 */

import type { Product, ProductVariant } from '@/types';
import type { CreateProductVariantData } from '@/features/products/types/variants';

/**
 * Create a test product with default values
 */
export function createTestProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: `test-product-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Product',
    code: 'TEST',
    category: 'shirt',
    remainingQuantity: 100,
    soldQuantity: 10,
    purchasePrice: 50.0,
    sellingPrice: 99.99,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a test product variant with default values
 */
export function createTestProductVariant(
  overrides: Partial<ProductVariant> | CreateProductVariantData = {}
): ProductVariant {
  const base = {
    id: `test-variant-${Math.random().toString(36).substr(2, 9)}`,
    productId: 'test-product-id',
    sku: `TEST-RED-M-FIT-${Math.random().toString(36).substr(2, 4)}`,
    color: 'Red',
    size: 'M' as const,
    form: 'fit' as const,
    inventoryCount: 10,
    reservedCount: 0,
    soldCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    ...base,
    ...overrides,
  } as ProductVariant;
}
