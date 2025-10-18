/**
 * Test script to verify inventory synchronization between revenue entries and variant soldCount
 */

// Mock localStorage for Node.js
global.localStorage = {
  getItem: (key) => {
    return (global._storage && global._storage[key]) || null;
  },
  setItem: (key, value) => {
    global._storage = global._storage || {};
    global._storage[key] = value;
  },
  removeItem: (key) => {
    if (global._storage) {
      delete global._storage[key];
    }
  },
};

// Import the services
const { storageService } = require('./src/lib/storage/index.ts');
const { revenueService } = require('./src/lib/storage/revenueService.ts');

async function testInventorySync() {
  console.log('🧪 Testing Inventory Synchronization...\n');

  try {
    // 1. First, get a product with variants
    const productsWithVariants = storageService.getProductsWithVariants();

    if (productsWithVariants.length === 0) {
      console.log('❌ No products found. Please add products first.');
      return;
    }

    const product = productsWithVariants.find(
      (p) => p.variants && p.variants.length > 0
    );

    if (!product || !product.variants) {
      console.log('❌ No products with variants found.');
      return;
    }

    const variant = product.variants[0];
    console.log('📦 Testing with product:', product.name);
    console.log(
      '🏷️  Testing with variant:',
      `${variant.color}/${variant.size}/${variant.form} (${variant.sku})`
    );
    console.log('📊 Initial soldCount:', variant.soldCount || 0);

    const initialSoldCount = variant.soldCount || 0;

    // 2. Create a revenue entry
    console.log('\n📝 Creating revenue entry...');
    const revenueEntry = {
      productId: product.id,
      productVariantId: variant.id,
      amount: '25.99',
      quantity: '3',
      salesChannel: 'test-channel',
      saleDate: new Date().toISOString().split('T')[0],
      notes: 'Test inventory sync',
    };

    const createResult = revenueService.createRevenueEntry(revenueEntry);

    if (!createResult.data) {
      console.log('❌ Failed to create revenue entry:', createResult.error);
      return;
    }

    console.log('✅ Revenue entry created successfully');

    // 3. Check if soldCount was updated
    const updatedProducts = storageService.getProductsWithVariants();
    const updatedProduct = updatedProducts.find((p) => p.id === product.id);
    const updatedVariant = updatedProduct?.variants?.find(
      (v) => v.id === variant.id
    );

    if (!updatedVariant) {
      console.log('❌ Could not find updated variant');
      return;
    }

    const newSoldCount = updatedVariant.soldCount || 0;
    console.log('📊 Updated soldCount:', newSoldCount);
    console.log('📈 Expected increase:', 3);
    console.log('📈 Actual increase:', newSoldCount - initialSoldCount);

    if (newSoldCount === initialSoldCount + 3) {
      console.log('✅ CREATE operation: soldCount updated correctly!');
    } else {
      console.log('❌ CREATE operation: soldCount not updated correctly');
    }

    // 4. Test UPDATE operation
    console.log('\n📝 Testing UPDATE operation...');
    const updateResult = revenueService.updateRevenueEntry(
      createResult.data.id,
      {
        ...revenueEntry,
        quantity: '5', // Change quantity from 3 to 5
      }
    );

    if (!updateResult.data) {
      console.log('❌ Failed to update revenue entry:', updateResult.error);
      return;
    }

    // Check soldCount after update
    const postUpdateProducts = storageService.getProductsWithVariants();
    const postUpdateProduct = postUpdateProducts.find(
      (p) => p.id === product.id
    );
    const postUpdateVariant = postUpdateProduct?.variants?.find(
      (v) => v.id === variant.id
    );

    if (postUpdateVariant) {
      const finalSoldCount = postUpdateVariant.soldCount || 0;
      console.log('📊 Post-update soldCount:', finalSoldCount);
      console.log('📈 Expected total:', initialSoldCount + 5);
      console.log('📈 Actual total:', finalSoldCount);

      if (finalSoldCount === initialSoldCount + 5) {
        console.log('✅ UPDATE operation: soldCount updated correctly!');
      } else {
        console.log('❌ UPDATE operation: soldCount not updated correctly');
      }
    }

    // 5. Test DELETE operation
    console.log('\n📝 Testing DELETE operation...');
    const deleteResult = revenueService.deleteRevenueEntry(
      createResult.data.id
    );

    if (!deleteResult.success) {
      console.log('❌ Failed to delete revenue entry:', deleteResult.error);
      return;
    }

    // Check soldCount after delete
    const postDeleteProducts = storageService.getProductsWithVariants();
    const postDeleteProduct = postDeleteProducts.find(
      (p) => p.id === product.id
    );
    const postDeleteVariant = postDeleteProduct?.variants?.find(
      (v) => v.id === variant.id
    );

    if (postDeleteVariant) {
      const deleteSoldCount = postDeleteVariant.soldCount || 0;
      console.log('📊 Post-delete soldCount:', deleteSoldCount);
      console.log('📈 Expected back to initial:', initialSoldCount);
      console.log('📈 Actual:', deleteSoldCount);

      if (deleteSoldCount === initialSoldCount) {
        console.log('✅ DELETE operation: soldCount reverted correctly!');
      } else {
        console.log('❌ DELETE operation: soldCount not reverted correctly');
      }
    }

    console.log('\n🎉 Inventory synchronization test completed!');
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testInventorySync();
