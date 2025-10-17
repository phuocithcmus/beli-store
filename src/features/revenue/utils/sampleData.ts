/**
 * Sample Data Creation Utility
 * Simple utility to create sample products and variants for testing revenue features
 */

import { storageService } from '@/lib/storage';

export function createSampleProducts() {
  try {
    // Check if products already exist
    const existingProducts = storageService.getProducts();
    if (existingProducts.length > 0) {
      return {
        success: false,
        message: 'Products already exist. No sample data created.',
      };
    }

    // Create sample products
    const tshirt = storageService.saveProduct({
      code: 'TSH001',
      name: 'Classic T-Shirt',
      category: 'shirt',
      remainingQuantity: 100,
      soldQuantity: 0,
      description: 'Classic cotton t-shirt available in multiple variants',
      hasVariants: true,
    });

    const jeans = storageService.saveProduct({
      code: 'PNT001',
      name: 'Denim Jeans',
      category: 'pants',
      remainingQuantity: 50,
      soldQuantity: 0,
      description: 'Premium denim jeans with perfect fit',
      hasVariants: true,
    });

    if (!tshirt || !jeans) {
      throw new Error('Failed to create sample products');
    }

    // Create variants for T-Shirt
    storageService.saveProductVariant({
      productId: tshirt.id,
      sku: 'TSH001-RED-M',
      color: 'Red',
      size: 'M',
      form: 'fit',
      inventoryCount: 25,
      soldCount: 0,
      reservedCount: 0,
    });

    storageService.saveProductVariant({
      productId: tshirt.id,
      sku: 'TSH001-BLUE-L',
      color: 'Blue',
      size: 'L',
      form: 'oversized',
      inventoryCount: 30,
      soldCount: 0,
      reservedCount: 0,
    });

    storageService.saveProductVariant({
      productId: tshirt.id,
      sku: 'TSH001-WHITE-S',
      color: 'White',
      size: 'S',
      form: 'fit',
      inventoryCount: 20,
      soldCount: 0,
      reservedCount: 0,
    });

    // Create variants for Jeans
    storageService.saveProductVariant({
      productId: jeans.id,
      sku: 'PNT001-DARK-32',
      color: 'Dark Blue',
      size: '32',
      form: 'fit',
      inventoryCount: 15,
      soldCount: 0,
      reservedCount: 0,
    });

    storageService.saveProductVariant({
      productId: jeans.id,
      sku: 'PNT001-LIGHT-34',
      color: 'Light Blue',
      size: '34',
      form: 'oversized',
      inventoryCount: 18,
      soldCount: 0,
      reservedCount: 0,
    });

    return {
      success: true,
      message: 'Sample products and variants created successfully!',
      products: [
        {
          name: tshirt.name,
          code: tshirt.code,
          variants: 3,
        },
        {
          name: jeans.name,
          code: jeans.code,
          variants: 2,
        },
      ],
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create sample data',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function getSampleRevenueData() {
  return [
    {
      productCode: 'TSH001',
      variantSku: 'TSH001-RED-M',
      amount: '25.99',
      quantity: '2',
      salesChannel: 'shopee-001',
      notes: 'Online sale - Red M-size t-shirts',
    },
    {
      productCode: 'TSH001',
      variantSku: 'TSH001-BLUE-L',
      amount: '27.99',
      quantity: '1',
      salesChannel: 'tiktok-001',
      notes: 'TikTok Shop sale - Blue L-size t-shirt',
    },
    {
      productCode: 'PNT001',
      variantSku: 'PNT001-DARK-32',
      amount: '59.99',
      quantity: '1',
      salesChannel: 'manual-001',
      notes: 'Direct sale - Dark blue jeans size 32',
    },
  ];
}
