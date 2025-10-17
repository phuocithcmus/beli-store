/**
 * Demo utility to test product variant revenue functionality
 * This demonstrates how the revenue system works with product variants
 */

import { storageService } from '@/lib/storage';
import { revenueService } from '@/lib/storage/revenueService';
import type { RevenueEntryFormData } from '@/types';

/**
 * Demo function to create sample revenue entries with variants
 * This shows how product variants are handled in revenue tracking
 */
export function createVariantRevenueDemo() {
  try {
    // Get products with variants
    const productsWithVariants = storageService.getProductsWithVariants();

    if (productsWithVariants.length === 0) {
      console.log('No products found. Please add products first.');
      return;
    }

    // Find a product that has variants
    const productWithVariants = productsWithVariants.find(
      (product) => product.variants && product.variants.length > 0
    );

    if (!productWithVariants || !productWithVariants.variants) {
      console.log(
        'No products with variants found. Please add product variants first.'
      );
      return;
    }

    console.log(`Found product with variants: ${productWithVariants.name}`);
    console.log(
      `Available variants:`,
      productWithVariants.variants.map(
        (v) => `${v.color}/${v.size}/${v.form} (${v.sku})`
      )
    );

    // Create revenue entries for different variants
    const variant1 = productWithVariants.variants[0];
    const variant2 =
      productWithVariants.variants[1] || productWithVariants.variants[0];

    // Sample revenue entry with first variant
    const revenueEntry1: RevenueEntryFormData = {
      productId: productWithVariants.id,
      productVariantId: variant1.id,
      amount: '25.99',
      quantity: '2',
      salesChannel: 'shopee-001',
      saleDate: new Date().toISOString().split('T')[0],
      notes: 'Demo sale with variant 1',
    };

    // Sample revenue entry with second variant
    const revenueEntry2: RevenueEntryFormData = {
      productId: productWithVariants.id,
      productVariantId: variant2.id,
      amount: '30.50',
      quantity: '1',
      salesChannel: 'tiktok-001',
      saleDate: new Date().toISOString().split('T')[0],
      notes: 'Demo sale with variant 2',
    };

    // Sample revenue entry without specific variant
    const revenueEntry3: RevenueEntryFormData = {
      productId: productWithVariants.id,
      // No productVariantId - general product sale
      amount: '22.00',
      quantity: '3',
      salesChannel: 'manual-001',
      saleDate: new Date().toISOString().split('T')[0],
      notes: 'Demo sale without specific variant',
    };

    // Create the revenue entries
    const result1 = revenueService.createRevenueEntry(revenueEntry1);
    const result2 = revenueService.createRevenueEntry(revenueEntry2);
    const result3 = revenueService.createRevenueEntry(revenueEntry3);

    if (result1.data && result2.data && result3.data) {
      console.log('✅ Demo revenue entries created successfully!');
      console.log('Revenue entry with variant 1:', {
        id: result1.data.id,
        productName: result1.data.productName,
        variantDetails: result1.data.variantDetails,
        amount: result1.data.amount,
        quantity: result1.data.quantity,
      });
      console.log('Revenue entry with variant 2:', {
        id: result2.data.id,
        productName: result2.data.productName,
        variantDetails: result2.data.variantDetails,
        amount: result2.data.amount,
        quantity: result2.data.quantity,
      });
      console.log('Revenue entry without variant:', {
        id: result3.data.id,
        productName: result3.data.productName,
        variantDetails: result3.data.variantDetails || 'None',
        amount: result3.data.amount,
        quantity: result3.data.quantity,
      });
    } else {
      console.error('Failed to create demo revenue entries:', {
        errors: [result1.error, result2.error, result3.error].filter(Boolean),
      });
    }

    return {
      success: true,
      entries: [result1.data, result2.data, result3.data].filter(Boolean),
    };
  } catch (error) {
    console.error('Error creating variant revenue demo:', error);
    return { success: false, error };
  }
}

/**
 * Demo function to show how revenue analytics work with variants
 */
export function showVariantRevenueAnalytics() {
  try {
    const entries = revenueService.getRevenueEntries();

    if (!entries.data || entries.data.length === 0) {
      console.log('No revenue entries found.');
      return;
    }

    console.log('\n📊 Revenue Analytics with Variants:');
    console.log('Total entries:', entries.data.length);

    // Group by variant
    const variantGroups = entries.data.reduce(
      (groups, entry) => {
        const key = entry.variantDetails || 'No specific variant';
        if (!groups[key]) {
          groups[key] = {
            count: 0,
            totalRevenue: 0,
            totalQuantity: 0,
            entries: [],
          };
        }
        groups[key].count++;
        groups[key].totalRevenue += entry.amount;
        groups[key].totalQuantity += entry.quantity;
        groups[key].entries.push(entry);
        return groups;
      },
      {} as Record<string, any>
    );

    Object.entries(variantGroups).forEach(([variant, data]) => {
      console.log(`\n${variant}:`);
      console.log(`  • ${data.count} sales`);
      console.log(`  • $${data.totalRevenue.toFixed(2)} total revenue`);
      console.log(`  • ${data.totalQuantity} units sold`);
      console.log(
        `  • $${(data.totalRevenue / data.count).toFixed(2)} average per sale`
      );
    });

    return variantGroups;
  } catch (error) {
    console.error('Error showing variant analytics:', error);
    return null;
  }
}
