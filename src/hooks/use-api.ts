import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  apiClient,
  type CreateProductDto,
  type UpdateProductDto,
  type CreateProductVariantDto,
  type UpdateProductVariantDto,
  type UpdateImportPhaseDto,
} from '@/lib/api-client';

// Query Keys
export const queryKeys = {
  products: ['products'] as const,
  product: (id: string) => ['products', id] as const,
  productAnalytics: ['products', 'analytics'] as const,

  variants: ['variants'] as const,
  variant: (id: string) => ['variants', id] as const,
  variantsByProduct: (productId: string) =>
    ['variants', 'product', productId] as const,

  imports: ['imports'] as const,
  import: (id: string) => ['imports', id] as const,

  transactions: ['transactions'] as const,
  transaction: (id: string) => ['transactions', id] as const,
  transactionAnalytics: ['transactions', 'analytics'] as const,

  revenue: ['revenue'] as const,
  revenueEntry: (id: string) => ['revenue', id] as const,
  revenueAnalytics: ['revenue', 'analytics'] as const,
  revenueProfitAnalysis: ['revenue', 'profit'] as const,

  channels: ['channels'] as const,
  channel: (id: string) => ['channels', id] as const,
  channelAnalytics: ['channels', 'analytics'] as const,

  fees: ['fees'] as const,
  fee: (id: string) => ['fees', id] as const,
  feesByChannel: (channelId: string) => ['fees', 'channel', channelId] as const,
  feeAnalytics: ['fees', 'analytics'] as const,

  validation: ['validation'] as const,
  systemHealth: ['validation', 'health'] as const,
};

// Products Hooks
export const useProducts = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}) => {
  return useQuery({
    queryKey: [...queryKeys.products, params],
    queryFn: () => apiClient.products.getAll(params),
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => apiClient.products.getById(id),
    enabled: !!id,
  });
};

export const useProductAnalytics = () => {
  return useQuery({
    queryKey: queryKeys.productAnalytics,
    queryFn: () => apiClient.products.getAnalytics(),
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductDto) => apiClient.products.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.productAnalytics });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
      apiClient.products.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.product(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.productAnalytics });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.products.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.productAnalytics });
    },
  });
};

// Product Variants Hooks
export const useVariants = (params?: {
  page?: number;
  limit?: number;
  productId?: string;
}) => {
  return useQuery({
    queryKey: [...queryKeys.variants, params],
    queryFn: () => apiClient.variants.getAll(params),
  });
};

export const useVariant = (id: string) => {
  return useQuery({
    queryKey: queryKeys.variant(id),
    queryFn: () => apiClient.variants.getById(id),
    enabled: !!id,
  });
};

export const useVariantsByProduct = (productId: string) => {
  return useQuery({
    queryKey: queryKeys.variantsByProduct(productId),
    queryFn: () => apiClient.variants.getByProductId(productId),
    enabled: !!productId,
  });
};

export const useCreateVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductVariantDto) =>
      apiClient.variants.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.variants });
      queryClient.invalidateQueries({
        queryKey: queryKeys.variantsByProduct(data.productId),
      });
    },
  });
};

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductVariantDto }) =>
      apiClient.variants.update(id, data),
    onSuccess: (result, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.variants });
      queryClient.invalidateQueries({ queryKey: queryKeys.variant(id) });
      if (result.productId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.variantsByProduct(result.productId),
        });
      }
    },
  });
};

export const useDeleteVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.variants.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.variants });
    },
  });
};

// Import Phases Hooks
export const useImports = (params?: {
  page?: number;
  limit?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: [...queryKeys.imports, params],
    queryFn: () => apiClient.imports.getAll(params),
  });
};

export const useImport = (id: string) => {
  return useQuery({
    queryKey: queryKeys.import(id),
    queryFn: () => apiClient.imports.getById(id),
    enabled: !!id,
  });
};

export const useCreateImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      code: string;
      date: string;
      description?: string;
      totalItems: number;
      totalCost: number;
      totalFees?: number;
    }) => apiClient.imports.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.imports });
    },
  });
};

export const useUpdateImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateImportPhaseDto }) =>
      apiClient.imports.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.imports });
      queryClient.invalidateQueries({ queryKey: queryKeys.import(id) });
    },
  });
};

export const useUpdateImportStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'active' | 'completed';
    }) => apiClient.imports.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.imports });
      queryClient.invalidateQueries({ queryKey: queryKeys.import(id) });
    },
  });
};

// Revenue Hooks
export const useRevenue = (params?: {
  page?: number;
  limit?: number;
  salesChannel?: string;
}) => {
  return useQuery({
    queryKey: [...queryKeys.revenue, params],
    queryFn: () => apiClient.revenue.getAll(params),
  });
};

export const useRevenueEntry = (id: string) => {
  return useQuery({
    queryKey: queryKeys.revenueEntry(id),
    queryFn: () => apiClient.revenue.getById(id),
    enabled: !!id,
  });
};

export const useRevenueAnalytics = (params?: {
  period?: string;
  salesChannel?: string;
}) => {
  return useQuery({
    queryKey: [...queryKeys.revenueAnalytics, params],
    queryFn: () => apiClient.revenue.getAnalytics(params),
  });
};

export const useRevenueProfitAnalysis = (params?: {
  dateFrom?: string;
  dateTo?: string;
}) => {
  return useQuery({
    queryKey: [...queryKeys.revenueProfitAnalysis, params],
    queryFn: () => apiClient.revenue.getProfitAnalysis(params),
  });
};

export const useCreateRevenueEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
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
    }) => apiClient.revenue.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.revenue });
      queryClient.invalidateQueries({ queryKey: queryKeys.revenueAnalytics });
      queryClient.invalidateQueries({
        queryKey: queryKeys.revenueProfitAnalysis,
      });
    },
  });
};

// Sales Channels Hooks
export const useChannels = (params?: {
  page?: number;
  limit?: number;
  type?: string;
  isActive?: boolean;
}) => {
  return useQuery({
    queryKey: [...queryKeys.channels, params],
    queryFn: () => apiClient.channels.getAll(params),
  });
};

export const useChannel = (id: string) => {
  return useQuery({
    queryKey: queryKeys.channel(id),
    queryFn: () => apiClient.channels.getById(id),
    enabled: !!id,
  });
};

export const useCreateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      type: 'online' | 'manual' | 'partner';
      isActive: boolean;
      metadata?: Record<string, unknown>;
    }) => apiClient.channels.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.channels });
    },
  });
};

// Fee Structures Hooks
export const useFees = (params?: {
  page?: number;
  limit?: number;
  salesChannelId?: string;
  isActive?: boolean;
}) => {
  return useQuery({
    queryKey: [...queryKeys.fees, params],
    queryFn: () => apiClient.fees.getAll(params),
  });
};

export const useFee = (id: string) => {
  return useQuery({
    queryKey: queryKeys.fee(id),
    queryFn: () => apiClient.fees.getById(id),
    enabled: !!id,
  });
};

export const useFeesByChannel = (salesChannelId: string) => {
  return useQuery({
    queryKey: queryKeys.feesByChannel(salesChannelId),
    queryFn: () => apiClient.fees.getBySalesChannel(salesChannelId),
    enabled: !!salesChannelId,
  });
};

export const useCreateFee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
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
    }) => apiClient.fees.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fees });
    },
  });
};

export const useCalculateFee = () => {
  return useMutation({
    mutationFn: ({
      id,
      amount,
      quantity,
    }: {
      id: string;
      amount: number;
      quantity?: number;
    }) => apiClient.fees.calculateFee(id, amount, quantity),
  });
};

// System Health Hooks
export const useSystemHealth = () => {
  return useQuery({
    queryKey: queryKeys.systemHealth,
    queryFn: () => apiClient.validation.getSystemHealth(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useValidateEntity = (entity: string) => {
  return useQuery({
    queryKey: [...queryKeys.validation, 'entity', entity],
    queryFn: () => apiClient.validation.validateEntity(entity),
    enabled: !!entity,
  });
};

export const useValidateAll = () => {
  return useQuery({
    queryKey: [...queryKeys.validation, 'all'],
    queryFn: () => apiClient.validation.validateAll(),
  });
};
