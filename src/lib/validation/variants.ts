import { z } from 'zod';

/**
 * Product Variant validation schema
 * Validates data for creating and updating product variants
 */
export const ProductVariantSchema = z.object({
  id: z.string().min(1, 'Variant ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be 50 characters or less'),
  barcode: z.string().optional(),
  size: z
    .string()
    .min(1, 'Size is required')
    .max(20, 'Size must be 20 characters or less'),
  color: z
    .string()
    .min(1, 'Color is required')
    .max(30, 'Color must be 30 characters or less'),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be 0 or greater'),
  reservedQuantity: z
    .number()
    .int()
    .min(0, 'Reserved quantity must be 0 or greater'),
  lowStockThreshold: z
    .number()
    .int()
    .min(0, 'Low stock threshold must be 0 or greater'),
  additionalCost: z.number().min(0, 'Additional cost must be 0 or greater'),
  isActive: z.boolean(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Product Variant creation schema (without computed fields)
 */
export const CreateProductVariantSchema = ProductVariantSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Product Variant update schema (partial, without computed fields)
 */
export const UpdateProductVariantSchema = ProductVariantSchema.omit({
  id: true,
  productId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

/**
 * Inventory update schema for variant stock operations
 */
export const InventoryUpdateSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  quantityChange: z
    .number()
    .int()
    .refine((val) => val !== 0, 'Quantity change cannot be zero'),
  operation: z.enum(['add', 'subtract', 'set'], {
    required_error: 'Operation type is required',
    invalid_type_error: 'Operation must be add, subtract, or set',
  }),
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(200, 'Reason must be 200 characters or less'),
  referenceId: z.string().optional(), // For linking to transactions, adjustments, etc.
  performedBy: z.string().min(1, 'Performed by is required'),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

/**
 * Bulk inventory update schema for multiple variants
 */
export const BulkInventoryUpdateSchema = z.object({
  updates: z
    .array(InventoryUpdateSchema)
    .min(1, 'At least one inventory update is required'),
  batchReason: z
    .string()
    .min(1, 'Batch reason is required')
    .max(200, 'Batch reason must be 200 characters or less'),
  performedBy: z.string().min(1, 'Performed by is required'),
});

/**
 * Variant search/filter schema
 */
export const VariantFilterSchema = z.object({
  productId: z.string().optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  lowStock: z.boolean().optional(), // Filter variants below threshold
  outOfStock: z.boolean().optional(), // Filter variants with 0 stock
  skuQuery: z.string().optional(), // Search by SKU
  barcodeQuery: z.string().optional(), // Search by barcode
});

/**
 * SKU generation options schema
 */
export const SKUGenerationSchema = z.object({
  productCode: z
    .string()
    .min(1, 'Product code is required')
    .max(10, 'Product code must be 10 characters or less'),
  size: z
    .string()
    .min(1, 'Size is required')
    .max(10, 'Size must be 10 characters or less'),
  color: z
    .string()
    .min(1, 'Color is required')
    .max(10, 'Color must be 10 characters or less'),
  suffix: z.string().max(5, 'Suffix must be 5 characters or less').optional(),
});

// Export types derived from schemas
export type ProductVariantInput = z.infer<typeof CreateProductVariantSchema>;
export type ProductVariantUpdateInput = z.infer<
  typeof UpdateProductVariantSchema
>;
export type InventoryUpdateInput = z.infer<typeof InventoryUpdateSchema>;
export type BulkInventoryUpdateInput = z.infer<
  typeof BulkInventoryUpdateSchema
>;
export type VariantFilterInput = z.infer<typeof VariantFilterSchema>;
export type SKUGenerationInput = z.infer<typeof SKUGenerationSchema>;
