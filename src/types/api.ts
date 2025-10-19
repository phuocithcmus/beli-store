// Base API Response types matching backend BaseResponseDto

export interface BaseResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version: string;
  };
}

export interface SuccessResponse<T = unknown> extends BaseResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse extends BaseResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// API Error type for client-side error handling
export interface ApiError {
  message: string;
  statusCode: number;
  error: string;
  code?: string;
  details?: unknown;
}

// Pagination types - matching backend PaginationDto structure
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string; // Additional frontend search param
}

// Pagination meta - matching backend PaginationMeta interface
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Pagination response - matching backend PaginationResponse interface
export interface PaginationResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Combined response for paginated data with BaseResponse wrapper
export interface PaginatedResponse<T>
  extends BaseResponse<PaginationResponse<T>> {
  success: true;
  data: PaginationResponse<T>;
}

// Request/Response transformation utilities
export type RequestPayload<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePayload<T> = Partial<RequestPayload<T>>;

// API method types
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API endpoint configuration
export interface ApiEndpoint {
  method: ApiMethod;
  url: string;
  requiresAuth?: boolean;
}
