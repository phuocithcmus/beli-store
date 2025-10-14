import { z } from 'zod';

// Base schemas for entities
export const ProductSchema = z
  .object({
    id: z.string().uuid(),
    code: z.string().min(1, 'Product code is required').max(50),
    name: z.string().min(1, 'Product name is required').max(100),
    category: z.enum(['shirt', 'pants']),
    remainingQuantity: z.number().int().min(0, 'Quantity cannot be negative'),
    soldQuantity: z.number().int().min(0, 'Sold quantity cannot be negative'),
    purchasePrice: z.number().positive('Purchase price must be positive'),
    sellingPrice: z.number().positive('Selling price must be positive'),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .refine((data) => data.sellingPrice > data.purchasePrice, {
    message: 'Selling price must be greater than purchase price',
    path: ['sellingPrice'],
  });

export const ImportPhaseSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1, 'Phase code is required').max(50),
  date: z.date().max(new Date(), 'Import date cannot be in the future'),
  description: z.string().max(500).optional(),
  status: z.enum(['active', 'completed']),
  totalItems: z.number().int().min(0),
  totalCost: z.number().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ImportPhaseProductSchema = z.object({
  id: z.string().uuid(),
  importPhaseId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitCost: z.number().positive('Unit cost must be positive'),
  createdAt: z.date(),
});

export const TransactionSchema = z
  .object({
    id: z.string().uuid(),
    type: z.enum(['sale', 'purchase']),
    productId: z.string().uuid(),
    quantity: z.number().int().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
    totalAmount: z.number().positive('Total amount must be positive'),
    date: z.date().max(new Date(), 'Transaction date cannot be in the future'),
    importPhaseId: z.string().uuid().optional(),
    notes: z.string().max(500).optional(),
    createdAt: z.date(),
  })
  .refine(
    (data) =>
      Math.abs(data.totalAmount - data.quantity * data.unitPrice) < 0.01,
    {
      message: 'Total amount must equal quantity × unit price',
      path: ['totalAmount'],
    }
  );

export const RevenueRecordSchema = z.object({
  id: z.string().uuid(),
  period: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Period must be in YYYY-MM-DD format'),
  totalSalesRevenue: z.number().min(0),
  totalPurchaseCosts: z.number().min(0),
  grossProfit: z.number(),
  profitMargin: z.number().min(0).max(100),
  transactionCount: z.number().int().min(0),
  topSellingProductId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Form validation schemas
export const ProductFormSchema = z
  .object({
    code: z.string().min(1, 'Product code is required').max(50),
    name: z.string().min(1, 'Product name is required').max(100),
    category: z.enum(['shirt', 'pants'], {
      required_error: 'Please select a category',
    }),
    remainingQuantity: z.coerce
      .number()
      .int()
      .min(0, 'Quantity cannot be negative'),
    purchasePrice: z.coerce
      .number()
      .positive('Purchase price must be positive'),
    sellingPrice: z.coerce.number().positive('Selling price must be positive'),
  })
  .refine((data) => data.sellingPrice > data.purchasePrice, {
    message: 'Selling price must be greater than purchase price',
    path: ['sellingPrice'],
  });

export const ImportPhaseFormSchema = z
  .object({
    code: z.string().min(1, 'Phase code is required').max(50),
    date: z.string().min(1, 'Date is required'),
    description: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      const date = new Date(data.date);
      return date <= new Date();
    },
    {
      message: 'Import date cannot be in the future',
      path: ['date'],
    }
  );

export const TransactionFormSchema = z.object({
  type: z.enum(['sale', 'purchase'], {
    required_error: 'Please select transaction type',
  }),
  productId: z.string().min(1, 'Please select a product'),
  quantity: z.coerce.number().int().positive('Quantity must be positive'),
  unitPrice: z.coerce.number().positive('Unit price must be positive'),
  date: z.string().optional(),
  importPhaseId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const SaleFormSchema = z.object({
  quantity: z.coerce.number().int().positive('Quantity must be positive'),
  unitPrice: z.coerce.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

// Filter validation schemas
export const ProductFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.enum(['shirt', 'pants']).optional(),
  lowStock: z.coerce.boolean().optional(),
});

export const TransactionFiltersSchema = z.object({
  type: z.enum(['sale', 'purchase']).optional(),
  productId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const ImportPhaseFiltersSchema = z.object({
  status: z.enum(['active', 'completed']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// Export validation schemas
export const ExportFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  category: z.enum(['shirt', 'pants']).optional(),
  lowStock: z.coerce.boolean().optional(),
  type: z.enum(['sale', 'purchase']).optional(),
  productId: z.string().uuid().optional(),
  status: z.enum(['active', 'completed']).optional(),
});

export const ExportOptionsSchema = z.object({
  filters: ExportFiltersSchema.optional(),
  columns: z.array(z.string()).optional(),
  format: z.enum(['xlsx', 'csv']).default('xlsx'),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
  includeSummary: z.boolean().default(true),
  includeProducts: z.boolean().default(true),
});

// Storage schema validation
export const StorageMetadataSchema = z.object({
  version: z.string(),
  lastBackup: z.date(),
  recordCounts: z.record(z.string(), z.number()),
});

export const StorageSchema = z.object({
  products: z.array(ProductSchema),
  importPhases: z.array(ImportPhaseSchema),
  importPhaseProducts: z.array(ImportPhaseProductSchema),
  transactions: z.array(TransactionSchema),
  revenueRecords: z.array(RevenueRecordSchema),
  metadata: StorageMetadataSchema,
});

// API validation schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Type exports for form validation
export type ProductFormData = z.infer<typeof ProductFormSchema>;
export type ImportPhaseFormData = z.infer<typeof ImportPhaseFormSchema>;
export type TransactionFormData = z.infer<typeof TransactionFormSchema>;
export type SaleFormData = z.infer<typeof SaleFormSchema>;
export type ProductFilters = z.infer<typeof ProductFiltersSchema>;
export type TransactionFilters = z.infer<typeof TransactionFiltersSchema>;
export type ImportPhaseFilters = z.infer<typeof ImportPhaseFiltersSchema>;
export type ExportFilters = z.infer<typeof ExportFiltersSchema>;
export type ExportOptions = z.infer<typeof ExportOptionsSchema>;
