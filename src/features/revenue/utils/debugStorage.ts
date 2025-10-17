/**
 * Debug utility to check the storage state
 * This helps diagnose why products appear empty in revenue dialog
 */

import { storageService } from '@/lib/storage';
import { revenueService } from '@/lib/storage/revenueService';

export function debugStorageState() {
  console.log('=== STORAGE DEBUG ===');

  try {
    // Check basic products
    const products = storageService.getProducts();
    console.log('📦 Basic Products:', products.length);
    products.forEach((product, index) => {
      console.log(
        `  ${index + 1}. ${product.name} (${product.code}) - ID: ${product.id}`
      );
    });

    // Check products with variants
    const productsWithVariants = storageService.getProductsWithVariants();
    console.log('\n📦 Products with Variants:', productsWithVariants.length);
    productsWithVariants.forEach((product, index) => {
      console.log(
        `  ${index + 1}. ${product.name} (${product.code}) - ID: ${product.id}`
      );
      if (product.variants && product.variants.length > 0) {
        console.log(`     📱 Variants: ${product.variants.length}`);
        product.variants.forEach((variant, vIndex) => {
          console.log(
            `       ${vIndex + 1}. ${variant.color}/${variant.size}/${variant.form} (${variant.sku}) - ID: ${variant.id}`
          );
        });
      } else {
        console.log('     📱 No variants');
      }
    });

    // Check product variants separately
    const allVariants = storageService.getProductVariants();
    console.log('\n📱 All Product Variants:', allVariants.length);
    allVariants.forEach((variant, index) => {
      console.log(
        `  ${index + 1}. ${variant.color}/${variant.size}/${variant.form} (${variant.sku}) - Product: ${variant.productId}`
      );
    });

    // Check revenue entries
    const revenueEntries = revenueService.getRevenueEntries();
    console.log('\n💰 Revenue Entries:', revenueEntries.data.length);
    revenueEntries.data.forEach((entry, index) => {
      console.log(
        `  ${index + 1}. ${entry.productName} - ${entry.variantDetails || 'No variant'} - $${entry.amount}`
      );
    });

    // Check sales channels
    const salesChannels = storageService.getSalesChannels();
    console.log('\n🛒 Sales Channels:', salesChannels.length);
    salesChannels.forEach((channel, index) => {
      console.log(
        `  ${index + 1}. ${channel.name} (${channel.type}) - Active: ${channel.isActive}`
      );
    });

    return {
      products: products.length,
      productsWithVariants: productsWithVariants.length,
      variants: allVariants.length,
      revenueEntries: revenueEntries.data.length,
      salesChannels: salesChannels.length,
    };
  } catch (error) {
    console.error('❌ Error debugging storage:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function createSampleData() {
  console.log('🔧 Creating sample data...');

  try {
    // Create sample products if none exist
    const existingProducts = storageService.getProducts();
    if (existingProducts.length === 0) {
      console.log('📦 Creating sample products...');

      const sampleProduct1 = storageService.saveProduct({
        code: 'TSH001',
        name: 'Classic T-Shirt',
        category: 'shirt' as const,
        remainingQuantity: 100,
        soldQuantity: 0,
        purchasePrice: 15.0,
        sellingPrice: 25.99,
        hasVariants: true,
      });

      const sampleProduct2 = storageService.saveProduct({
        code: 'PNT001',
        name: 'Denim Jeans',
        category: 'pants' as const,
        remainingQuantity: 50,
        soldQuantity: 0,
        purchasePrice: 35.0,
        sellingPrice: 59.99,
        hasVariants: true,
      });

      // Create variants for the products
      if (sampleProduct1) {
        storageService.saveProductVariant({
          productId: sampleProduct1.id,
          sku: 'TSH001-RED-M',
          color: 'Red',
          size: 'M',
          form: 'fit' as const,
          sellingPrice: 62.99,
          inventoryCount: 25,
          soldCount: 0,
          reservedCount: 0,
        });

        storageService.saveProductVariant({
          productId: sampleProduct1.id,
          sku: 'TSH001-BLUE-L',
          color: 'Blue',
          size: 'L',
          form: 'oversized' as const,
          sellingPrice: 27.99,
          inventoryCount: 30,
          soldCount: 0,
          reservedCount: 0,
        });
      }

      if (sampleProduct2) {
        storageService.saveProductVariant({
          productId: sampleProduct2.id,
          sku: 'PNT001-DARK-32',
          color: 'Dark Blue',
          size: 'L',
          form: 'fit' as const,
          sellingPrice: 59.99,
          inventoryCount: 20,
          soldCount: 0,
          reservedCount: 0,
        });
      }

      console.log('✅ Sample data created!');
      return debugStorageState();
    } else {
      console.log('📦 Products already exist, skipping sample data creation');
      return debugStorageState();
    }
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
