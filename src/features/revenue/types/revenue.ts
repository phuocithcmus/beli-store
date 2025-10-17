/**
 * Revenue Feature Types
 * Type definitions specific to the revenue tracking feature
 */

import type { RevenueEntry, SalesChannel, Product } from '@/types';

// Period types for analytics
export type RevenuePeriod = 'week' | 'month' | 'quarter' | 'year';

// Form data types for revenue entry management
export interface RevenueEntryFormData {
  productId: string;
  productVariantId?: string;
  amount: string; // String for form input
  quantity: string; // String for form input
  salesChannel: string;
  saleDate: string; // ISO string for form input
  notes?: string;
}

// Revenue analytics and filtering types
export interface RevenueFilters {
  productId?: string;
  productVariantId?: string;
  salesChannel?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  minQuantity?: number;
  maxQuantity?: number;
}

export interface AnalyticsFilters {
  salesChannelId?: string;
  productId?: string;
}

// Analytics data structure for dashboard
export interface RevenueAnalyticsData {
  // Summary metrics
  totalRevenue: number;
  totalQuantity: number;
  totalProfit: number;
  totalOrders: number;
  averageOrderValue: number;

  // Growth metrics
  revenueGrowth: number;
  quantityGrowth: number;
  profitGrowth: number;

  // Top performers
  topProducts: {
    productName: string;
    revenue: number;
    quantity: number;
    profit: number;
    averagePrice: number;
  }[];

  topChannels: {
    channelName: string;
    revenue: number;
    quantity: number;
    profit: number;
    orderCount: number;
    averageOrderValue: number;
  }[];

  // Channel performance
  channelPerformance: {
    id: string;
    name: string;
    revenue: number;
    orders: number;
    conversionRate: number;
    averageOrderValue: number;
    marketShare: number;
    commissionRate: number;
  }[];

  // Trends
  trends: {
    period: string;
    revenue: number;
    quantity: number;
    profit: number;
    orders: number;
  }[];

  // Period info
  period: RevenuePeriod;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface RevenueSortOptions {
  field: 'date' | 'amount' | 'quantity' | 'productName' | 'salesChannel';
  direction: 'asc' | 'desc';
}

// Dashboard metrics and analytics types
export interface RevenueDashboardMetrics {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  totalQuantity: number;
  revenueGrowth: number;
  transactionGrowth: number;
  topProduct: {
    id: string;
    name: string;
    revenue: number;
  } | null;
  topChannel: {
    id: string;
    name: string;
    revenue: number;
  } | null;
}

export interface PeriodRevenue {
  period: string;
  revenue: number;
  transactions: number;
  quantity: number;
  date: Date;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  totalRevenue: number;
  totalQuantity: number;
  totalTransactions: number;
  averagePrice: number;
  profitMargin?: number;
  growthRate?: number;
}

export interface ChannelPerformance {
  channelId: string;
  channelName: string;
  channelType: 'online' | 'manual' | 'partner';
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  marketShare: number;
  isActive: boolean;
  commission?: number;
}

export interface VariantPerformance {
  variantId: string;
  productId: string;
  productName: string;
  variantDetails: string;
  sku: string;
  totalRevenue: number;
  totalQuantity: number;
  totalTransactions: number;
  averagePrice: number;
}

// Chart and visualization data types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface TrendData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ComparisonData {
  current: {
    period: string;
    value: number;
  };
  previous: {
    period: string;
    value: number;
  };
  comparison: TrendData;
}

// Component prop types
export interface RevenueListProps {
  entries: RevenueEntry[];
  onEdit?: (entry: RevenueEntry) => void;
  onDelete?: (entryId: string) => void;
  onView?: (entry: RevenueEntry) => void;
  loading?: boolean;
  error?: string;
}

export interface RevenueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RevenueEntryFormData) => Promise<void>;
  editingEntry?: RevenueEntry;
  products: Product[];
  salesChannels: SalesChannel[];
}

export interface RevenueAnalyticsProps {
  dateRange?: {
    from: Date;
    to: Date;
  };
  onDateRangeChange?: (range: { from: Date; to: Date }) => void;
  showChannelBreakdown?: boolean;
  showProductBreakdown?: boolean;
}

export interface ChannelAnalyticsProps {
  channels: SalesChannel[];
  performances: ChannelPerformance[];
  onChannelSelect?: (channelId: string) => void;
  selectedChannelId?: string;
}

// Export configuration types
export interface RevenueExportConfig {
  format: 'csv' | 'xlsx' | 'pdf';
  dateRange?: {
    from: Date;
    to: Date;
  };
  includeChannelBreakdown: boolean;
  includeProductBreakdown: boolean;
  includeVariantBreakdown: boolean;
  filters?: RevenueFilters;
}

// API response types specific to revenue
export interface RevenueApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
  metadata?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// Hook return types
export interface UseRevenueReturn {
  entries: RevenueEntry[];
  loading: boolean;
  error: string | null;
  createEntry: (data: RevenueEntryFormData) => Promise<boolean>;
  updateEntry: (
    id: string,
    data: Partial<RevenueEntryFormData>
  ) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<boolean>;
  refreshEntries: () => Promise<void>;
  filters: RevenueFilters;
  setFilters: (filters: RevenueFilters) => void;
  sortOptions: RevenueSortOptions;
  setSortOptions: (options: RevenueSortOptions) => void;
}

export interface UseRevenueAnalyticsReturn {
  data: RevenueAnalyticsData | null;
  loading: boolean;
  error: string | null;
  refreshAnalytics: () => void;
}

export interface UseSalesChannelsReturn {
  channels: SalesChannel[];
  activeChannels: SalesChannel[];
  loading: boolean;
  error: string | null;
  createChannel: (data: {
    name: string;
    type: 'online' | 'manual' | 'partner';
    metadata?: Record<string, any>;
  }) => Promise<boolean>;
  updateChannel: (
    id: string,
    data: {
      name?: string;
      type?: 'online' | 'manual' | 'partner';
      isActive?: boolean;
      metadata?: Record<string, any>;
    }
  ) => Promise<boolean>;
  deleteChannel: (id: string) => Promise<boolean>;
  refreshChannels: () => Promise<void>;
}

// Validation error types
export interface RevenueValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface RevenueFormErrors {
  productId?: string;
  amount?: string;
  quantity?: string;
  salesChannel?: string;
  saleDate?: string;
  general?: string;
}

// Business logic types
export interface RevenueBusinessRules {
  minimumOrderValue: number;
  maximumOrderValue: number;
  allowNegativeAdjustments: boolean;
  requireProductVariant: boolean;
  defaultSalesChannel: string;
  automaticProfitCalculation: boolean;
}
