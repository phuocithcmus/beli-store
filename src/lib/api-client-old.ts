import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type { 
  Product, 
  ProductVariant, 
  ImportPhase, 
  Tr  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      filteredParams[key] = String(value);
    }action, 
  RevenueEntry, 
  SalesChannel, 
  ChannelFeeStructure
} from '@/types';

// Backend API types (matching our backend DTOs)
export interface CreateProductDto {
  code: string;
  name: string;
  category: 'shirt' | 'pants';
  remainingQuantity: number;
  purchasePrice?: number;
  sellingPrice?: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface CreateProductVariantDto {
  productId: string;
  color: string;
  size: 'S' | 'M' | 'L' | 'XL';
  form: 'oversized' | 'fit';
  inventoryCount: number;
  sellingPrice?: number;
}

export interface UpdateProductVariantDto extends Partial<CreateProductVariantDto> {}

export interface CreateImportPhaseDto {
  code: string;
  date: string;
  description?: string;
  totalItems: number;
  totalCost: number;
  totalFees?: number;
}

export interface UpdateImportPhaseDto extends Partial<CreateImportPhaseDto> {}

export interface CreateTransactionDto {
  type: 'sale' | 'purchase';
  productId: string;
  productVariantId?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  date: Date;
  importPhaseId?: string;
  notes?: string;
}

export interface UpdateTransactionDto extends Partial<CreateTransactionDto> {}

export interface CreateRevenueEntryDto {
  productId: string;
  productVariantId?: string;
  importPhaseId?: string;
  productName: string;
  variantDetails?: string;
  amount: number;
  quantity: number;
  unitPrice: number;
  salesChannel: string;
  salesChannelName: string;
  saleDate: Date;
  notes?: string;
}

export interface UpdateRevenueEntryDto extends Partial<CreateRevenueEntryDto> {}

export interface CreateSalesChannelDto {
  name: string;
  type: 'online' | 'manual' | 'partner';
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateSalesChannelDto extends Partial<CreateSalesChannelDto> {}

export interface CreateChannelFeeStructureDto {
  salesChannelId: string;
  feeType: 'percentage' | 'flat' | 'tiered' | 'hybrid';
  calculationType: 'simple' | 'compound' | 'progressive';
  percentageRate?: number;
  flatFee?: number;
  minimumFee?: number;
  maximumFee?: number;
  tiers?: {
    minAmount: number;
    maxAmount?: number;
    rate: number;
    flatFee?: number;
  }[];
  conditions?: {
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: string | number | boolean;
    feeModifier: number;
  }[];
  isActive: boolean;
  tags?: string[];
  description?: string;
}

export interface UpdateChannelFeeStructureDto extends Partial<CreateChannelFeeStructureDto> {}

// Validation response interface
export interface ValidationReport {
  entity: string;
  isHealthy: boolean;
  issues: string[];
  recordCount: number;
  lastUpdated: Date;
}

export interface SystemHealthSummary {
  overall: boolean;
  database: boolean;
  entities: ValidationReport[];
  summary: {
    totalRecords: number;
    healthyEntities: number;
    totalIssues: number;
  };
}

// Utility function to build URLs with query parameters
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
  if (!params) return endpoint;
  
  const filteredParams: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      filteredParams[key] = String(value);
    }
  });
  
  const queryString = new URLSearchParams(filteredParams).toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Generic HTTP methods
  private async get<T>(endpoint: string): Promise<T> {
    const response = await this.client.get<T>(endpoint);
    return response.data;
  }

  private async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await this.client.post<T>(endpoint, data);
    return response.data;
  }

  private async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await this.client.put<T>(endpoint, data);
    return response.data;
  }

  private async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete<T>(endpoint);
    return response.data;
  }

  // Products API
  products = {
    getAll: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
      this.get<Product[]>(buildUrl('/products', params)),
    
    getById: (id: string) =>
      this.get<Product>(`/products/${id}`),
    
    create: (data: CreateProductDto) =>
      this.post<Product>('/products', data),
    
    update: (id: string, data: UpdateProductDto) =>
      this.put<Product>(`/products/${id}`, data),
    
    delete: (id: string) =>
      this.delete<{ message: string }>(`/products/${id}`),
    
    // Bulk operations
    bulkCreate: (data: CreateProductDto[]) =>
      this.post<Product[]>('/products/bulk', data),
    
    // Analytics
    getAnalytics: () =>
      this.get<any>('/products/analytics'),
  };

  // Product Variants API
  variants = {
    getAll: (params?: { page?: number; limit?: number; productId?: string }) =>
      this.get<ProductVariant[]>(`/variants${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
    
    getById: (id: string) =>
      this.get<ProductVariant>(`/variants/${id}`),
    
    getByProductId: (productId: string) =>
      this.get<ProductVariant[]>(`/variants/product/${productId}`),
    
    create: (data: CreateProductVariantDto) =>
      this.post<ProductVariant>('/variants', data),
    
    update: (id: string, data: UpdateProductVariantDto) =>
      this.put<ProductVariant>(`/variants/${id}`, data),
    
    delete: (id: string) =>
      this.delete<{ message: string }>(`/variants/${id}`),
    
    // Inventory operations
    updateInventory: (id: string, quantity: number) =>
      this.put<ProductVariant>(`/variants/${id}/inventory`, { quantity }),
  };

  // Import Phases API
  imports = {
    getAll: (params?: { page?: number; limit?: number; status?: string }) =>
      this.get<ImportPhase[]>(`/imports${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
    
    getById: (id: string) =>
      this.get<ImportPhase>(`/imports/${id}`),
    
    create: (data: CreateImportPhaseDto) =>
      this.post<ImportPhase>('/imports', data),
    
    update: (id: string, data: UpdateImportPhaseDto) =>
      this.put<ImportPhase>(`/imports/${id}`, data),
    
    delete: (id: string) =>
      this.delete<{ message: string }>(`/imports/${id}`),
    
    // Status operations
    updateStatus: (id: string, status: 'active' | 'completed') =>
      this.put<ImportPhase>(`/imports/${id}/status`, { status }),
  };

  // Transactions API
  transactions = {
    getAll: (params?: { page?: number; limit?: number; type?: string; productId?: string }) =>
      this.get<Transaction[]>(`/transactions${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
    
    getById: (id: string) =>
      this.get<Transaction>(`/transactions/${id}`),
    
    create: (data: CreateTransactionDto) =>
      this.post<Transaction>('/transactions', data),
    
    update: (id: string, data: UpdateTransactionDto) =>
      this.put<Transaction>(`/transactions/${id}`, data),
    
    delete: (id: string) =>
      this.delete<{ message: string }>(`/transactions/${id}`),
    
    // Analytics
    getAnalytics: (params?: { dateFrom?: string; dateTo?: string }) =>
      this.get<any>(`/transactions/analytics${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
  };

  // Revenue Entries API
  revenue = {
    getAll: (params?: { page?: number; limit?: number; salesChannel?: string }) =>
      this.get<RevenueEntry[]>(`/revenue${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
    
    getById: (id: string) =>
      this.get<RevenueEntry>(`/revenue/${id}`),
    
    create: (data: CreateRevenueEntryDto) =>
      this.post<RevenueEntry>('/revenue', data),
    
    update: (id: string, data: UpdateRevenueEntryDto) =>
      this.put<RevenueEntry>(`/revenue/${id}`, data),
    
    delete: (id: string) =>
      this.delete<{ message: string }>(`/revenue/${id}`),
    
    // Analytics
    getAnalytics: (params?: { period?: string; salesChannel?: string }) =>
      this.get<any>(`/revenue/analytics${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
    
    // Profit calculations
    getProfitAnalysis: (params?: { dateFrom?: string; dateTo?: string }) =>
      this.get<any>(`/revenue/profit${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
  };

  // Sales Channels API
  channels = {
    getAll: (params?: { page?: number; limit?: number; type?: string; isActive?: boolean }) =>
      this.get<SalesChannel[]>(`/channels/sales-channels${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
    
    getById: (id: string) =>
      this.get<SalesChannel>(`/channels/sales-channels/${id}`),
    
    create: (data: CreateSalesChannelDto) =>
      this.post<SalesChannel>('/channels/sales-channels', data),
    
    update: (id: string, data: UpdateSalesChannelDto) =>
      this.put<SalesChannel>(`/channels/sales-channels/${id}`, data),
    
    delete: (id: string) =>
      this.delete<{ message: string }>(`/channels/sales-channels/${id}`),
    
    // Analytics
    getAnalytics: (id?: string) =>
      this.get<any>(`/channels/sales-channels${id ? `/${id}` : ''}/analytics`),
  };

  // Channel Fee Structures API
  fees = {
    getAll: (params?: { page?: number; limit?: number; salesChannelId?: string; isActive?: boolean }) =>
      this.get<ChannelFeeStructure[]>(`/channels/fee-structures${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
    
    getById: (id: string) =>
      this.get<ChannelFeeStructure>(`/channels/fee-structures/${id}`),
    
    getBySalesChannel: (salesChannelId: string) =>
      this.get<ChannelFeeStructure[]>(`/channels/fee-structures/channel/${salesChannelId}`),
    
    create: (data: CreateChannelFeeStructureDto) =>
      this.post<ChannelFeeStructure>('/channels/fee-structures', data),
    
    update: (id: string, data: UpdateChannelFeeStructureDto) =>
      this.put<ChannelFeeStructure>(`/channels/fee-structures/${id}`, data),
    
    delete: (id: string) =>
      this.delete<{ message: string }>(`/channels/fee-structures/${id}`),
    
    // Fee calculations
    calculateFee: (id: string, amount: number, quantity?: number) =>
      this.post<{ feeAmount: number; netAmount: number }>(`/channels/fee-structures/${id}/calculate`, { amount, quantity }),
    
    // Analytics
    getAnalytics: (id?: string) =>
      this.get<any>(`/channels/fee-structures${id ? `/${id}` : ''}/analytics`),
    
    // Statistics
    getStatistics: (id: string) =>
      this.get<any>(`/channels/fee-structures/${id}/statistics`),
  };

  // Validation & System Health API
  validation = {
    getSystemHealth: () =>
      this.get<SystemHealthSummary>('/validation/health'),
    
    validateEntity: (entity: string) =>
      this.get<ValidationReport>(`/validation/entity/${entity}`),
    
    validateAll: () =>
      this.get<ValidationReport[]>('/validation/all'),
    
    checkConnections: () =>
      this.get<{ [key: string]: boolean }>('/validation/connections'),
  };
}

// Create singleton instance
const apiClient = new ApiClient();

export { apiClient };
export default apiClient;