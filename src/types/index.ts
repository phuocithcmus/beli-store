// Core entity types for the clothing store management system

export interface Product {
  id: string;
  code: string;
  name: string;
  category: 'shirt' | 'pants';
  remainingQuantity: number;
  soldQuantity: number;
  purchasePrice: number;
  sellingPrice?: number; // P3: Made optional for flexible pricing
  createdAt: Date;
  updatedAt: Date;
  // Enhanced fields for variant support
  hasVariants?: boolean;
  variants?: ProductVariant[];
  totalVariantInventory?: number;
  totalVariantSold?: number;
}

// Enhanced Product Variant Types
export interface ProductVariant {
  id: string;
  productId: string;
  color: string;
  size: 'S' | 'M' | 'L' | 'XL';
  form: 'oversized' | 'fit';
  sku: string;
  inventoryCount: number;
  reservedCount: number;
  soldCount: number;
  sellingPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Revenue Tracking Types
export interface RevenueEntry {
  id: string;
  productId: string;
  productVariantId?: string;
  productName: string;
  variantDetails?: string;
  amount: number; // Gross revenue amount
  quantity: number;
  unitPrice: number;
  salesChannel: string;
  salesChannelName: string;
  saleDate: Date;
  notes?: string;
  // P2 Channel Fee Integration
  channelFee?: number; // Calculated channel fee amount
  netAmount?: number; // Net revenue after channel fees (amount - channelFee)
  createdAt: Date;
  updatedAt: Date;
}

// Sales Channel Types
export interface SalesChannel {
  id: string;
  name: string;
  type: 'online' | 'manual' | 'partner';
  isActive: boolean;
  metadata?: Record<string, unknown>;
  // P2 Feature: Channel Fee Configuration
  feeStructure?: ChannelFeeStructure;
}

// Channel Fee Configuration Types (P2 Feature)
export interface ChannelFeeStructure {
  id: string;
  salesChannelId: string;
  percentageRate: number; // Percentage fee (e.g., 3.5 for 3.5%)
  fixedFee: number; // Fixed fee in VND
  minimumFee?: number; // Optional minimum fee
  maximumFee?: number; // Optional maximum fee
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Variant Sales Tracking Types
export interface SaleTransaction {
  id?: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: Date;
  customerId?: string;
  notes?: string;
}

export interface VariantSaleRecord {
  id: string;
  variantId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: Date;
  customerId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VariantSalesSummary {
  totalSold: number;
  totalRevenue: number;
  averagePrice: number;
  lastSaleDate?: Date;
}

export interface ImportPhase {
  id: string;
  code: string;
  date: Date;
  description?: string;
  status: 'active' | 'completed';
  totalItems: number;
  totalCost: number;
  totalFees: number; // Total of all import fees
  finalCost: number; // totalCost + totalFees
  createdAt: Date;
  updatedAt: Date;
}

// Import Fee Management Types (P1 Feature)
export interface ImportFee {
  id: string;
  importPhaseId: string;
  type: 'shipping' | 'customs' | 'handling' | 'storage' | 'other';
  name: string; // Display name for the fee
  amount: number; // Amount in VND
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportPhaseProduct {
  id: string;
  importPhaseId: string;
  productId: string;
  productVariantId?: string; // Optional variant selection
  quantity: number;
  unitCost: number;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'purchase';
  productId: string;
  productVariantId?: string; // Add support for variant tracking
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  date: Date;
  importPhaseId?: string;
  notes?: string;
  createdAt: Date;
}

export interface RevenueRecord {
  id: string;
  period: string; // YYYY-MM-DD format
  totalSalesRevenue: number;
  totalPurchaseCosts: number;
  grossProfit: number;
  profitMargin: number;
  transactionCount: number;
  topSellingProductId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  page?: number;
  limit?: number;
}

// Form types
export interface ProductFormData {
  code: string;
  name: string;
  category: 'shirt' | 'pants';
  remainingQuantity: number;
  purchasePrice: number;
  sellingPrice?: number; // P3: Made optional for flexible pricing
}

export interface ProductVariantFormData {
  color: string;
  size: 'S' | 'M' | 'L' | 'XL';
  form: 'oversized' | 'fit';
  inventoryCount: number;
}

export interface RevenueEntryFormData {
  productId: string;
  productVariantId?: string;
  amount: string; // String for form input
  quantity: string; // String for form input
  salesChannel: string;
  saleDate: string; // ISO string for form input
  notes?: string;
}

export interface ImportPhaseFormData {
  code: string;
  date: string; // ISO string
  description?: string;
}

export interface ImportFeeFormData {
  type: 'shipping' | 'customs' | 'handling' | 'storage' | 'other';
  name: string;
  amount: string; // String for form input
  description?: string;
}

export interface ChannelFeeFormData {
  percentageRate: string; // String for form input (e.g., "3.5")
  fixedFee: string; // String for form input in VND
  minimumFee?: string; // Optional minimum fee
  maximumFee?: string; // Optional maximum fee
}

export interface TransactionFormData {
  type: 'sale' | 'purchase';
  productId: string;
  quantity: number;
  unitPrice: number;
  date?: string; // ISO string
  importPhaseId?: string;
  notes?: string;
}

// Storage schema
export interface StorageSchema {
  products: Product[];
  importPhases: ImportPhase[];
  importPhaseProducts: ImportPhaseProduct[];
  transactions: Transaction[];
  revenueRecords: RevenueRecord[];
  // Enhanced entities for variants and revenue
  productVariants: ProductVariant[];
  revenueEntries: RevenueEntry[];
  salesChannels: SalesChannel[];
  // Fee management entities
  importFees: ImportFee[];
  channelFeeStructures: ChannelFeeStructure[];
  metadata: {
    version: string;
    lastBackup: Date;
    recordCounts: Record<string, number>;
    schemaVersion: number;
    variantSystemEnabled: boolean;
    feeSystemEnabled: boolean;
    channelFeeSystemEnabled: boolean;
  };
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Table column types
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
}

// Filter types
export interface ProductFilters {
  search?: string;
  category?: 'shirt' | 'pants';
  lowStock?: boolean;
}

export interface TransactionFilters {
  type?: 'sale' | 'purchase';
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ImportPhaseFilters {
  status?: 'active' | 'completed';
  dateFrom?: string;
  dateTo?: string;
}

// Export types
export interface ExportFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: 'shirt' | 'pants';
  lowStock?: boolean;
  type?: 'sale' | 'purchase';
  productId?: string;
  status?: 'active' | 'completed';
}

export interface ExportOptions {
  filters?: ExportFilters;
  columns?: string[];
  format?: 'xlsx' | 'csv';
  groupBy?: 'day' | 'week' | 'month';
  includeSummary?: boolean;
  includeProducts?: boolean;
}
