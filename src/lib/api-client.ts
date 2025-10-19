import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosRequestConfig,
  type AxiosError,
} from 'axios';
import type {
  Product,
  ProductVariant,
  ImportPhase,
  Transaction,
  RevenueEntry,
  SalesChannel,
  ChannelFeeStructure,
} from '@/types';
import type { AuthResponse, User } from '@/types/auth';
import type {
  BaseResponse,
  ApiError,
  PaginationParams,
  PaginationResponse,
} from '@/types/api';
import {
  getStoredToken,
  setStoredSession,
  clearStoredSession,
  isTokenExpired,
} from '@/lib/token-storage';

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

export interface UpdateProductVariantDto
  extends Partial<CreateProductVariantDto> {}

export interface CreateImportPhaseDto {
  code: string;
  date: string;
  description?: string;
  totalItems: number;
  totalCost: number;
  totalFees?: number;
}

export interface UpdateImportPhaseDto extends Partial<CreateImportPhaseDto> {}

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
  isActive: boolean;
  tags?: string[];
  description?: string;
}

export interface UpdateChannelFeeStructureDto
  extends Partial<CreateChannelFeeStructureDto> {}

// Analytics interfaces
export interface AnalyticsData {
  [key: string]: unknown;
}

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
function buildUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  if (!params) {
    return endpoint;
  }

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
      baseURL:
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = getStoredToken();
        if (token && !isTokenExpired(token)) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh token using the existing access token as refresh token
            // (This backend implementation uses the same token for refresh)
            const accessToken = getStoredToken();
            if (accessToken) {
              const baseURL = this.client.defaults.baseURL || '';
              const refreshResponse = await axios.post(
                `${baseURL}/auth/refresh`,
                {
                  refresh_token: accessToken,
                }
              );

              // Extract data from base response format
              const responseData =
                this.extractResponseData<AuthResponse>(refreshResponse);
              const { access_token, user } = responseData;
              setStoredSession(access_token, user);

              // Retry original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
              }

              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear session and redirect to login
            clearStoredSession();

            // Trigger logout event for cross-tab sync
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('auth:logout', {
                  detail: { reason: 'token_refresh_failed' },
                })
              );

              // Redirect to login if we're not already there
              if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login?reason=session_expired';
              }
            }
          }
        }

        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(this.formatApiError(error));
      }
    );
  }

  // Helper function to format API errors consistently
  private formatApiError(error: AxiosError): ApiError {
    if (error.response?.data && typeof error.response.data === 'object') {
      const errorData = error.response.data as BaseResponse;

      // Handle BaseResponse error format
      if ('success' in errorData && !errorData.success && errorData.error) {
        return {
          message:
            errorData.error.message || errorData.message || 'An error occurred',
          statusCode: error.response.status,
          error: errorData.error.code || 'API Error',
          code: errorData.error.code,
          details: errorData.error.details,
        };
      }

      // Handle legacy error format
      const legacyError = errorData as unknown as Record<string, unknown>;
      return {
        message:
          (legacyError.message as string) ||
          error.message ||
          'An error occurred',
        statusCode: error.response.status,
        error: (legacyError.error as string) || 'API Error',
      };
    }

    return {
      message: error.message || 'Network error occurred',
      statusCode: error.response?.status || 0,
      error: 'Network Error',
    };
  }

  // Helper function to extract data from BaseResponse
  private extractResponseData<T>(response: AxiosResponse): T {
    const data = response.data;

    // Check if response follows BaseResponse format
    if (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      'data' in data
    ) {
      const baseResponse = data as BaseResponse<T>;
      if (baseResponse.success && baseResponse.data !== undefined) {
        return baseResponse.data;
      }
      if (!baseResponse.success) {
        throw new Error(
          baseResponse.error?.message ||
            baseResponse.message ||
            'API request failed'
        );
      }
    }

    // For legacy responses or direct data, return as-is
    return data as T;
  }

  // Generic HTTP methods
  private async get<T>(endpoint: string): Promise<T> {
    const response = await this.client.get(endpoint);

    return this.extractResponseData<T>(response);
  }

  private async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await this.client.post(endpoint, data);
    return this.extractResponseData<T>(response);
  }

  private async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await this.client.put(endpoint, data);
    return this.extractResponseData<T>(response);
  }

  private async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete(endpoint);
    return this.extractResponseData<T>(response);
  }

  // Products API
  products = {
    getAll: (
      params?: PaginationParams & {
        search?: string;
        category?: string;
      }
    ) =>
      this.get<PaginationResponse<Product>>(
        buildUrl(
          '/products',
          params as Record<string, string | number | boolean | undefined>
        )
      ),

    getById: (id: string) => this.get<Product>(`/products/${id}`),

    create: (data: CreateProductDto) => this.post<Product>('/products', data),

    update: (id: string, data: UpdateProductDto) =>
      this.put<Product>(`/products/${id}`, data),

    delete: (id: string) => this.delete<{ message: string }>(`/products/${id}`),

    bulkCreate: (data: CreateProductDto[]) =>
      this.post<Product[]>('/products/bulk', data),

    getAnalytics: () => this.get<AnalyticsData>('/products/analytics'),
  };

  // Product Variants API
  variants = {
    getAll: (params?: PaginationParams & { productId?: string }) =>
      this.get<PaginationResponse<ProductVariant>>(
        buildUrl(
          '/variants',
          params as Record<string, string | number | boolean | undefined>
        )
      ),

    getById: (id: string) => this.get<ProductVariant>(`/variants/${id}`),

    getByProductId: (productId: string) =>
      this.get<ProductVariant[]>(`/variants/product/${productId}`),

    create: (data: CreateProductVariantDto) =>
      this.post<ProductVariant>('/variants', data),

    update: (id: string, data: UpdateProductVariantDto) =>
      this.put<ProductVariant>(`/variants/${id}`, data),

    delete: (id: string) => this.delete<{ message: string }>(`/variants/${id}`),

    updateInventory: (id: string, quantity: number) =>
      this.put<ProductVariant>(`/variants/${id}/inventory`, { quantity }),
  };

  // Import Phases API
  imports = {
    getAll: (params?: PaginationParams & { status?: string }) =>
      this.get<PaginationResponse<ImportPhase>>(
        buildUrl(
          '/imports',
          params as Record<string, string | number | boolean | undefined>
        )
      ),

    getById: (id: string) => this.get<ImportPhase>(`/imports/${id}`),

    create: (data: CreateImportPhaseDto) =>
      this.post<ImportPhase>('/imports', data),

    update: (id: string, data: UpdateImportPhaseDto) =>
      this.put<ImportPhase>(`/imports/${id}`, data),

    delete: (id: string) => this.delete<{ message: string }>(`/imports/${id}`),

    updateStatus: (id: string, status: 'active' | 'completed') =>
      this.put<ImportPhase>(`/imports/${id}/status`, { status }),
  };

  // Transactions API
  transactions = {
    getAll: (
      params?: PaginationParams & {
        type?: string;
        productId?: string;
      }
    ) =>
      this.get<PaginationResponse<Transaction>>(
        buildUrl(
          '/transactions',
          params as Record<string, string | number | boolean | undefined>
        )
      ),

    getById: (id: string) => this.get<Transaction>(`/transactions/${id}`),

    create: (data: Omit<Transaction, 'id' | 'createdAt'>) =>
      this.post<Transaction>('/transactions', data),

    update: (id: string, data: Partial<Transaction>) =>
      this.put<Transaction>(`/transactions/${id}`, data),

    delete: (id: string) =>
      this.delete<{ message: string }>(`/transactions/${id}`),

    getAnalytics: (params?: { dateFrom?: string; dateTo?: string }) =>
      this.get<AnalyticsData>(buildUrl('/transactions/analytics', params)),
  };

  // Revenue Entries API
  revenue = {
    getAll: (
      params?: PaginationParams & {
        salesChannel?: string;
      }
    ) =>
      this.get<PaginationResponse<RevenueEntry>>(
        buildUrl(
          '/revenue',
          params as Record<string, string | number | boolean | undefined>
        )
      ),

    getById: (id: string) => this.get<RevenueEntry>(`/revenue/${id}`),

    create: (data: CreateRevenueEntryDto) =>
      this.post<RevenueEntry>('/revenue', data),

    update: (id: string, data: UpdateRevenueEntryDto) =>
      this.put<RevenueEntry>(`/revenue/${id}`, data),

    delete: (id: string) => this.delete<{ message: string }>(`/revenue/${id}`),

    getAnalytics: (params?: { period?: string; salesChannel?: string }) =>
      this.get<AnalyticsData>(buildUrl('/revenue/analytics', params)),

    getProfitAnalysis: (params?: { dateFrom?: string; dateTo?: string }) =>
      this.get<AnalyticsData>(buildUrl('/revenue/profit', params)),
  };

  // Sales Channels API
  channels = {
    getAll: (
      params?: PaginationParams & {
        type?: string;
        isActive?: boolean;
      }
    ) =>
      this.get<PaginationResponse<SalesChannel>>(
        buildUrl(
          '/channels/sales-channels',
          params as Record<string, string | number | boolean | undefined>
        )
      ),

    getById: (id: string) =>
      this.get<SalesChannel>(`/channels/sales-channels/${id}`),

    create: (data: CreateSalesChannelDto) =>
      this.post<SalesChannel>('/channels/sales-channels', data),

    update: (id: string, data: UpdateSalesChannelDto) =>
      this.put<SalesChannel>(`/channels/sales-channels/${id}`, data),

    delete: (id: string) =>
      this.delete<{ message: string }>(`/channels/sales-channels/${id}`),

    getAnalytics: (id?: string) =>
      this.get<AnalyticsData>(
        `/channels/sales-channels${id ? `/${id}` : ''}/analytics`
      ),
  };

  // Channel Fee Structures API
  fees = {
    getAll: (
      params?: PaginationParams & {
        salesChannelId?: string;
        isActive?: boolean;
      }
    ) =>
      this.get<PaginationResponse<ChannelFeeStructure>>(
        buildUrl(
          '/channels/fee-structures',
          params as Record<string, string | number | boolean | undefined>
        )
      ),

    getById: (id: string) =>
      this.get<ChannelFeeStructure>(`/channels/fee-structures/${id}`),

    getBySalesChannel: (salesChannelId: string) =>
      this.get<ChannelFeeStructure[]>(
        `/channels/fee-structures/channel/${salesChannelId}`
      ),

    create: (data: CreateChannelFeeStructureDto) =>
      this.post<ChannelFeeStructure>('/channels/fee-structures', data),

    update: (id: string, data: UpdateChannelFeeStructureDto) =>
      this.put<ChannelFeeStructure>(`/channels/fee-structures/${id}`, data),

    delete: (id: string) =>
      this.delete<{ message: string }>(`/channels/fee-structures/${id}`),

    calculateFee: (id: string, amount: number, quantity?: number) =>
      this.post<{ feeAmount: number; netAmount: number }>(
        `/channels/fee-structures/${id}/calculate`,
        { amount, quantity }
      ),

    getAnalytics: (id?: string) =>
      this.get<AnalyticsData>(
        `/channels/fee-structures${id ? `/${id}` : ''}/analytics`
      ),

    getStatistics: (id: string) =>
      this.get<AnalyticsData>(`/channels/fee-structures/${id}/statistics`),
  };

  // Validation & System Health API
  validation = {
    getSystemHealth: () => this.get<SystemHealthSummary>('/validation/health'),

    validateEntity: (entity: string) =>
      this.get<ValidationReport>(`/validation/entity/${entity}`),

    validateAll: () => this.get<ValidationReport[]>('/validation/all'),

    checkConnections: () =>
      this.get<Record<string, boolean>>('/validation/connections'),
  };

  // Authentication API
  auth = {
    login: async (credentials: {
      username: string;
      password: string;
    }): Promise<AuthResponse> => {
      const response = await this.client.post('/auth/login', credentials);
      return this.extractResponseData<AuthResponse>(response);
    },

    register: async (data: {
      email: string;
      name: string;
      password: string;
      role?: string;
    }): Promise<AuthResponse> => {
      const response = await this.client.post('/auth/register', data);
      return this.extractResponseData<AuthResponse>(response);
    },

    logout: async (): Promise<void> => {
      const response = await this.client.post('/auth/logout');
      this.extractResponseData<{ message: string }>(response);
    },

    refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
      const response = await this.client.post('/auth/refresh', {
        refresh_token: refreshToken,
      });
      return this.extractResponseData<AuthResponse>(response);
    },

    validateToken: async (): Promise<{ valid: boolean; user: User }> => {
      const response = await this.client.get('/auth/validate');
      return this.extractResponseData<{ valid: boolean; user: User }>(response);
    },

    getProfile: async (): Promise<User> => {
      const response = await this.client.get('/auth/me');
      return this.extractResponseData<User>(response);
    },

    seedUsers: async (): Promise<{ message: string }> => {
      const response = await this.client.post('/auth/seed');
      return this.extractResponseData<{ message: string }>(response);
    },
  };
}

// Create singleton instance
const apiClient = new ApiClient();

export { apiClient };
export default apiClient;
