// Core entity types for the clothing store management system

export interface Product {
  id: string;
  code: string;
  name: string;
  category: 'shirt' | 'pants';
  remainingQuantity: number;
  soldQuantity: number;
  purchasePrice: number;
  sellingPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportPhase {
  id: string;
  code: string;
  date: Date;
  description?: string;
  status: 'active' | 'completed';
  totalItems: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportPhaseProduct {
  id: string;
  importPhaseId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'purchase';
  productId: string;
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
  sellingPrice: number;
}

export interface ImportPhaseFormData {
  code: string;
  date: string; // ISO string
  description?: string;
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
  metadata: {
    version: string;
    lastBackup: Date;
    recordCounts: Record<string, number>;
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
  render?: (value: any, row: T) => React.ReactNode;
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
