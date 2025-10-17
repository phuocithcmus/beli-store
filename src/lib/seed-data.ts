/**
 * Sample data seeder for development and testing
 * Creates sample products to demonstrate the inventory management system
 */

import { storageService } from '@/lib/storage';

export function seedSampleData() {
  // Clear existing data
  storageService.clearAllData();

  // Add sample products with variant support
  const sampleProducts = [
    {
      code: 'SHIRT001',
      name: 'Classic Cotton T-Shirt',
      category: 'shirt' as const,
      remainingQuantity: 0, // Will be calculated from variants
      soldQuantity: 0, // Will be calculated from variants
      purchasePrice: 15.0,
      sellingPrice: 29.99,
      hasVariants: true,
    },
    {
      code: 'SHIRT002',
      name: 'Premium Polo Shirt',
      category: 'shirt' as const,
      remainingQuantity: 0, // Will be calculated from variants
      soldQuantity: 0, // Will be calculated from variants
      purchasePrice: 18.0,
      sellingPrice: 39.99,
      hasVariants: true,
    },
    {
      code: 'SHIRT003',
      name: 'Basic White Shirt',
      category: 'shirt' as const,
      remainingQuantity: 15,
      soldQuantity: 5,
      purchasePrice: 12.0,
      sellingPrice: 24.99,
      hasVariants: false, // Simple product without variants
    },
    {
      code: 'PANTS001',
      name: 'Classic Denim Jeans',
      category: 'pants' as const,
      remainingQuantity: 0, // Will be calculated from variants
      soldQuantity: 0, // Will be calculated from variants
      purchasePrice: 25.0,
      sellingPrice: 59.99,
      hasVariants: true,
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
  const createdProducts: { id: string; code: string; sellingPrice: number }[] =
    [];
  sampleProducts.forEach((product) => {
    try {
      const createdProduct = storageService.saveProduct(product);
      createdProducts.push(createdProduct);
    } catch (error) {
      console.error(`Error adding sample product ${product.code}:`, error);
    }
  });

  // Add variants for products that support them
  const tshirtProduct = createdProducts.find((p) => p.code === 'SHIRT001');
  if (tshirtProduct) {
    // Classic Cotton T-Shirt variants
    const tshirtVariants = [
      {
        color: 'Red',
        size: 'S',
        form: 'oversized',
        inventoryCount: 20,
        reservedCount: 0,
        soldCount: 3,
      },
      {
        color: 'Red',
        size: 'M',
        form: 'oversized',
        inventoryCount: 25,
        reservedCount: 2,
        soldCount: 5,
      },
      {
        color: 'Red',
        size: 'L',
        form: 'fit',
        inventoryCount: 15,
        reservedCount: 1,
        soldCount: 2,
      },
      {
        color: 'Blue',
        size: 'M',
        form: 'oversized',
        inventoryCount: 30,
        reservedCount: 0,
        soldCount: 8,
      },
      {
        color: 'Blue',
        size: 'L',
        form: 'fit',
        inventoryCount: 18,
        reservedCount: 3,
        soldCount: 4,
      },
      {
        color: 'Black',
        size: 'S',
        form: 'fit',
        inventoryCount: 22,
        reservedCount: 1,
        soldCount: 6,
      },
      {
        color: 'Black',
        size: 'XL',
        form: 'oversized',
        inventoryCount: 12,
        reservedCount: 0,
        soldCount: 1,
      },
    ];

    tshirtVariants.forEach((variant, index) => {
      try {
        const sku = `${tshirtProduct.code}-${variant.color.toUpperCase().substring(0, 3)}-${variant.size}-${variant.form.toUpperCase().substring(0, 2)}`;
        storageService.saveProductVariant({
          productId: tshirtProduct.id,
          color: variant.color,
          size: variant.size as 'S' | 'M' | 'L' | 'XL',
          form: variant.form as 'oversized' | 'fit',
          sku,
          inventoryCount: variant.inventoryCount,
          reservedCount: variant.reservedCount,
          soldCount: variant.soldCount,
          sellingPrice: tshirtProduct.sellingPrice + (index % 2 === 0 ? 2 : 0), // Slight price variation
        });
      } catch (error) {
        console.error(`Error adding T-shirt variant:`, error);
      }
    });
  }

  const poloProduct = createdProducts.find((p) => p.code === 'SHIRT002');
  if (poloProduct) {
    // Premium Polo Shirt variants
    const poloVariants = [
      {
        color: 'Navy',
        size: 'M',
        form: 'fit',
        inventoryCount: 15,
        reservedCount: 1,
        soldCount: 2,
      },
      {
        color: 'Navy',
        size: 'L',
        form: 'fit',
        inventoryCount: 20,
        reservedCount: 0,
        soldCount: 3,
      },
      {
        color: 'White',
        size: 'S',
        form: 'fit',
        inventoryCount: 18,
        reservedCount: 2,
        soldCount: 1,
      },
      {
        color: 'White',
        size: 'XL',
        form: 'oversized',
        inventoryCount: 10,
        reservedCount: 0,
        soldCount: 0,
      },
      {
        color: 'Gray',
        size: 'M',
        form: 'oversized',
        inventoryCount: 25,
        reservedCount: 1,
        soldCount: 4,
      },
    ];

    poloVariants.forEach((variant, index) => {
      try {
        const sku = `${poloProduct.code}-${variant.color.toUpperCase().substring(0, 3)}-${variant.size}-${variant.form.toUpperCase().substring(0, 2)}`;
        storageService.saveProductVariant({
          productId: poloProduct.id,
          color: variant.color,
          size: variant.size as 'S' | 'M' | 'L' | 'XL',
          form: variant.form as 'oversized' | 'fit',
          sku,
          inventoryCount: variant.inventoryCount,
          reservedCount: variant.reservedCount,
          soldCount: variant.soldCount,
          sellingPrice: poloProduct.sellingPrice + index * 1.5, // Price variation
        });
      } catch (error) {
        console.error(`Error adding Polo variant:`, error);
      }
    });
  }

  const jeansProduct = createdProducts.find((p) => p.code === 'PANTS001');
  if (jeansProduct) {
    // Classic Denim Jeans variants
    const jeansVariants = [
      {
        color: 'Blue',
        size: 'S',
        form: 'fit',
        inventoryCount: 12,
        reservedCount: 0,
        soldCount: 2,
      },
      {
        color: 'Blue',
        size: 'M',
        form: 'fit',
        inventoryCount: 18,
        reservedCount: 1,
        soldCount: 5,
      },
      {
        color: 'Blue',
        size: 'L',
        form: 'oversized',
        inventoryCount: 15,
        reservedCount: 2,
        soldCount: 3,
      },
      {
        color: 'Black',
        size: 'M',
        form: 'fit',
        inventoryCount: 20,
        reservedCount: 0,
        soldCount: 7,
      },
      {
        color: 'Black',
        size: 'L',
        form: 'oversized',
        inventoryCount: 14,
        reservedCount: 1,
        soldCount: 4,
      },
      {
        color: 'Gray',
        size: 'XL',
        form: 'oversized',
        inventoryCount: 8,
        reservedCount: 0,
        soldCount: 1,
      },
    ];

    jeansVariants.forEach((variant, index) => {
      try {
        const sku = `${jeansProduct.code}-${variant.color.toUpperCase().substring(0, 3)}-${variant.size}-${variant.form.toUpperCase().substring(0, 2)}`;
        storageService.saveProductVariant({
          productId: jeansProduct.id,
          color: variant.color,
          size: variant.size as 'S' | 'M' | 'L' | 'XL',
          form: variant.form as 'oversized' | 'fit',
          sku,
          inventoryCount: variant.inventoryCount,
          reservedCount: variant.reservedCount,
          soldCount: variant.soldCount,
          sellingPrice: jeansProduct.sellingPrice + (index % 3 === 0 ? 5 : 0), // Price variation
        });
      } catch (error) {
        console.error(`Error adding Jeans variant:`, error);
      }
    });
  }

  // eslint-disable-next-line no-console
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
