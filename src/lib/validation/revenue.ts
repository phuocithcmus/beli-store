import { z } from 'zod';

/**
 * Revenue Entry validation schema
 * Validates data for creating and updating revenue entries
 */
export const RevenueEntrySchema = z.object({
  id: z.string().min(1, 'Revenue entry ID is required'),
  date: z.date(),
  salesChannel: z.string().min(1, 'Sales channel is required'),
  salesChannelName: z.string().min(1, 'Sales channel name is required'),
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be 0 or greater'),
  totalRevenue: z.number().min(0, 'Total revenue must be 0 or greater'),
  commission: z.number().min(0, 'Commission must be 0 or greater'),
  netRevenue: z.number(), // Can be negative in some cases (refunds, etc.)
  paymentStatus: z.enum(['pending', 'paid', 'refunded', 'disputed'], {
    required_error: 'Payment status is required',
    invalid_type_error: 'Invalid payment status',
  }),
  orderReference: z.string().optional(),
  customerInfo: z.string().optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Revenue Entry creation schema (without computed fields)
 */
export const CreateRevenueEntrySchema = RevenueEntrySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Custom validation for computed fields
  totalRevenue: z.number().optional(), // Will be computed from quantity * unitPrice
  netRevenue: z.number().optional(), // Will be computed from totalRevenue - commission
});

/**
 * Revenue Entry update schema (partial, without computed fields)
 */
export const UpdateRevenueEntrySchema = RevenueEntrySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

/**
 * Sales Channel validation schema
 */
export const SalesChannelSchema = z.object({
  id: z.string().min(1, 'Sales channel ID is required'),
  name: z
    .string()
    .min(1, 'Channel name is required')
    .max(100, 'Channel name must be 100 characters or less'),
  type: z.enum(['online', 'manual', 'partner'], {
    required_error: 'Channel type is required',
    invalid_type_error: 'Invalid channel type',
  }),
  isActive: z.boolean(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Sales Channel creation schema
 */
export const CreateSalesChannelSchema = SalesChannelSchema;

/**
 * Sales Channel update schema (partial)
 */
export const UpdateSalesChannelSchema = SalesChannelSchema.partial().omit({
  id: true,
});

/**
 * Revenue filter schema for reports and analytics
 */
export const RevenueFilterSchema = z.object({
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  salesChannels: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  paymentStatuses: z
    .array(z.enum(['pending', 'paid', 'refunded', 'disputed']))
    .optional(),
  minRevenue: z.number().min(0).optional(),
  maxRevenue: z.number().min(0).optional(),
  includeRefunds: z.boolean().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'channel', 'product']).optional(),
});

/**
 * Revenue aggregation schema for generating summaries
 */
export const RevenueAggregationSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year'], {
    required_error: 'Period is required',
    invalid_type_error: 'Invalid period type',
  }),
  startDate: z.date(),
  endDate: z.date(),
  groupBy: z.enum(['total', 'channel', 'product', 'date']).optional(),
  includeCommissions: z.boolean().default(true),
  includeRefunds: z.boolean().default(false),
});

/**
 * Revenue report configuration schema
 */
export const RevenueReportConfigSchema = z.object({
  title: z
    .string()
    .min(1, 'Report title is required')
    .max(200, 'Title must be 200 characters or less'),
  dateRange: z
    .object({
      from: z.date(),
      to: z.date(),
    })
    .refine(
      (data) => data.from <= data.to,
      'Start date must be before or equal to end date'
    ),
  filters: RevenueFilterSchema.optional(),
  groupBy: z.enum(['day', 'week', 'month', 'channel', 'product']).optional(),
  includeCharts: z.boolean().default(true),
  includeTopProducts: z.boolean().default(true),
  includeChannelBreakdown: z.boolean().default(true),
  format: z.enum(['pdf', 'csv', 'json']).default('pdf'),
});

/**
 * Commission calculation schema
 */
export const CommissionCalculationSchema = z.object({
  salesChannelId: z.string().min(1, 'Sales channel ID is required'),
  grossRevenue: z.number().min(0, 'Gross revenue must be 0 or greater'),
  customRate: z.number().min(0).max(1).optional(), // Override default channel rate
});

// Export types derived from schemas
export type RevenueEntryInput = z.infer<typeof CreateRevenueEntrySchema>;
export type RevenueEntryUpdateInput = z.infer<typeof UpdateRevenueEntrySchema>;
export type SalesChannelInput = z.infer<typeof CreateSalesChannelSchema>;
export type SalesChannelUpdateInput = z.infer<typeof UpdateSalesChannelSchema>;
export type RevenueFilterInput = z.infer<typeof RevenueFilterSchema>;
export type RevenueAggregationInput = z.infer<typeof RevenueAggregationSchema>;
export type RevenueReportConfigInput = z.infer<
  typeof RevenueReportConfigSchema
>;
export type CommissionCalculationInput = z.infer<
  typeof CommissionCalculationSchema
>;
