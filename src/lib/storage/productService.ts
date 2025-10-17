/**
 * Enhanced Product Storage Service with Variant Support
 * T018 [P] [US1] - Enhanced Product storage methods for variant support
 */

import { storageService } from './index';
import {
  getProductVariantsByProduct,
  getVariantStats,
} from './productVariantService';
import type { Product, ProductVariant } from '@/types';

/**
 * Get all products
 */
export function getProducts(): Product[] {
  return storageService.getProducts();
}

/**
 * Get a specific product by ID
 */
export function getProduct(id: string): Product | undefined {
  return storageService.getProduct(id);
}

/**
 * Get product by code
 */
export function getProductByCode(code: string): Product | undefined {
  return storageService.getProductByCode(code);
}

/**
 * Save a new product
 */
export function saveProduct(
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Product {
  return storageService.saveProduct(product);
}

/**
 * Update an existing product
 */
export function updateProduct(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
): Product {
  return storageService.updateProduct(id, updates);
}

/**
 * Delete a product (and all its variants)
 */
export function deleteProduct(id: string): boolean {
  // Get all variants for this product
  const variants = getProductVariantsByProduct(id);

  // Delete all variants first
  for (const variant of variants) {
    storageService.deleteProductVariant(variant.id);
  }

  // Then delete the product
  return storageService.deleteProduct(id);
}

/**
 * Get product with its variants
 */
export function getProductWithVariants(
  id: string
): (Product & { variants: ProductVariant[] }) | undefined {
  const product = getProduct(id);
  if (!product) {
    return undefined;
  }

  const variants = getProductVariantsByProduct(id);

  return {
    ...product,
    variants,
  };
}

/**
 * Get all products with their variants
 */
export function getProductsWithVariants(): (Product & {
  variants: ProductVariant[];
})[] {
  const products = getProducts();

  return products.map((product) => {
    const variants = getProductVariantsByProduct(product.id);
    return {
      ...product,
      variants,
    };
  });
}

/**
 * Get product with variant statistics
 */
export function getProductWithStats(
  id: string
):
  | (Product & { variantStats: ReturnType<typeof getVariantStats> })
  | undefined {
  const product = getProduct(id);
  if (!product) {
    return undefined;
  }

  const variantStats = getVariantStats(id);

  return {
    ...product,
    variantStats,
  };
}

/**
 * Get all products with variant statistics
 */
export function getProductsWithStats(): (Product & {
  variantStats: ReturnType<typeof getVariantStats>;
})[] {
  const products = getProducts();

  return products.map((product) => {
    const variantStats = getVariantStats(product.id);
    return {
      ...product,
      variantStats,
    };
  });
}

/**
 * Search products by name, code, or category
 */
export function searchProducts(query: string): Product[] {
  const products = getProducts();
  const searchTerm = query.toLowerCase().trim();

  if (!searchTerm) {
    return products;
  }

  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.code.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get products by category
 */
export function getProductsByCategory(category: string): Product[] {
  const products = getProducts();
  return products.filter(
    (product) => product.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get products with low overall inventory (considering all variants)
 */
export function getProductsWithLowInventory(threshold: number = 5): Product[] {
  const products = getProducts();

  return products.filter((product) => {
    const stats = getVariantStats(product.id);
    return stats.totalAvailable > 0 && stats.totalAvailable <= threshold;
  });
}

/**
 * Get products that are out of stock (all variants have no available inventory)
 */
export function getOutOfStockProducts(): Product[] {
  const products = getProducts();

  return products.filter((product) => {
    const stats = getVariantStats(product.id);
    return stats.totalAvailable === 0 && stats.totalVariants > 0;
  });
}

/**
 * Get products without any variants
 */
export function getProductsWithoutVariants(): Product[] {
  const products = getProducts();

  return products.filter((product) => {
    const variants = getProductVariantsByProduct(product.id);
    return variants.length === 0;
  });
}

/**
 * Update product's remaining quantity based on variant totals
 * This syncs the legacy remainingQuantity field with variant data
 */
export function syncProductInventoryWithVariants(productId: string): Product {
  const product = getProduct(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const stats = getVariantStats(productId);

  return updateProduct(productId, {
    remainingQuantity: stats.totalAvailable,
    soldQuantity: stats.totalSold,
  });
}

/**
 * Sync all products' inventory with their variants
 */
export function syncAllProductsInventoryWithVariants(): Product[] {
  const products = getProducts();
  const updatedProducts: Product[] = [];

  for (const product of products) {
    try {
      const updatedProduct = syncProductInventoryWithVariants(product.id);
      updatedProducts.push(updatedProduct);
    } catch (error) {
      // Continue with other products even if one fails
      // eslint-disable-next-line no-console
      console.warn(
        `Failed to sync inventory for product ${product.id}:`,
        error
      );
    }
  }

  return updatedProducts;
}

/**
 * Check if product code is unique (for validation)
 */
export function isProductCodeUnique(
  code: string,
  excludeProductId?: string
): boolean {
  const existingProduct = getProductByCode(code);

  if (!existingProduct) {
    return true;
  }

  // If we're updating an existing product, exclude it from the check
  if (excludeProductId && existingProduct.id === excludeProductId) {
    return true;
  }

  return false;
}

/**
 * Get products sorted by total sales (most sold first)
 */
export function getProductsBySales(): Product[] {
  const productsWithStats = getProductsWithStats();

  return productsWithStats
    .sort((a, b) => b.variantStats.totalSold - a.variantStats.totalSold)
    .map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category,
      remainingQuantity: p.remainingQuantity,
      soldQuantity: p.soldQuantity,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
}

/**
 * Get products sorted by total inventory (highest first)
 */
export function getProductsByInventory(): Product[] {
  const productsWithStats = getProductsWithStats();

  return productsWithStats
    .sort(
      (a, b) => b.variantStats.totalInventory - a.variantStats.totalInventory
    )
    .map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category,
      remainingQuantity: p.remainingQuantity,
      soldQuantity: p.soldQuantity,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
}

/**
 * Get dashboard statistics for all products
 */
export function getProductDashboardStats() {
  const products = getProducts();
  const productsWithStats = getProductsWithStats();

  const totalProducts = products.length;
  const totalInventory = productsWithStats.reduce(
    (sum, p) => sum + p.variantStats.totalInventory,
    0
  );
  const totalSold = productsWithStats.reduce(
    (sum, p) => sum + p.variantStats.totalSold,
    0
  );
  const totalAvailable = productsWithStats.reduce(
    (sum, p) => sum + p.variantStats.totalAvailable,
    0
  );
  const totalVariants = productsWithStats.reduce(
    (sum, p) => sum + p.variantStats.totalVariants,
    0
  );

  const lowStockProducts = getProductsWithLowInventory().length;
  const outOfStockProducts = getOutOfStockProducts().length;
  const productsWithoutVariants = getProductsWithoutVariants().length;

  return {
    totalProducts,
    totalVariants,
    totalInventory,
    totalSold,
    totalAvailable,
    lowStockProducts,
    outOfStockProducts,
    productsWithoutVariants,
    averageInventoryPerProduct:
      totalProducts > 0 ? Math.round(totalInventory / totalProducts) : 0,
    averageVariantsPerProduct:
      totalProducts > 0 ? Math.round(totalVariants / totalProducts) : 0,
  };
}
