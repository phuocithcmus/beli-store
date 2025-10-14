/**
 * Sample data seeder for development and testing
 * Creates sample products to demonstrate the inventory management system
 */

import { storageService } from '@/lib/storage';

export function seedSampleData() {
  // Clear existing data
  storageService.clearAllData();

  // Add sample products
  const sampleProducts = [
    {
      code: 'SHIRT001',
      name: 'Classic Blue Cotton Shirt',
      category: 'shirt' as const,
      remainingQuantity: 25,
      soldQuantity: 5,
      purchasePrice: 15.0,
      sellingPrice: 29.99,
    },
    {
      code: 'SHIRT002',
      name: 'Red Polo Shirt',
      category: 'shirt' as const,
      remainingQuantity: 18,
      soldQuantity: 2,
      purchasePrice: 12.0,
      sellingPrice: 24.99,
    },
    {
      code: 'SHIRT003',
      name: 'White Dress Shirt',
      category: 'shirt' as const,
      remainingQuantity: 8, // Low stock
      soldQuantity: 12,
      purchasePrice: 18.0,
      sellingPrice: 39.99,
    },
    {
      code: 'PANTS001',
      name: 'Classic Black Jeans',
      category: 'pants' as const,
      remainingQuantity: 15,
      soldQuantity: 8,
      purchasePrice: 20.0,
      sellingPrice: 49.99,
    },
    {
      code: 'PANTS002',
      name: 'Blue Denim Jeans',
      category: 'pants' as const,
      remainingQuantity: 22,
      soldQuantity: 3,
      purchasePrice: 22.0,
      sellingPrice: 54.99,
    },
    {
      code: 'PANTS003',
      name: 'Khaki Chinos',
      category: 'pants' as const,
      remainingQuantity: 6, // Low stock
      soldQuantity: 14,
      purchasePrice: 16.0,
      sellingPrice: 34.99,
    },
    {
      code: 'SHIRT004',
      name: 'Green Flannel Shirt',
      category: 'shirt' as const,
      remainingQuantity: 30,
      soldQuantity: 0,
      purchasePrice: 14.0,
      sellingPrice: 32.99,
    },
    {
      code: 'PANTS004',
      name: 'Gray Dress Pants',
      category: 'pants' as const,
      remainingQuantity: 12,
      soldQuantity: 6,
      purchasePrice: 25.0,
      sellingPrice: 59.99,
    },
  ];

  // Save all sample products
  sampleProducts.forEach((product) => {
    try {
      storageService.saveProduct(product);
    } catch (error) {
      console.error(`Error adding sample product ${product.code}:`, error);
    }
  });

  console.log(`✅ Added ${sampleProducts.length} sample products to inventory`);
}

// Auto-seed in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Check if we already have data
  const existingProducts = storageService.getProducts();
  if (existingProducts.length === 0) {
    seedSampleData();
  }
}
