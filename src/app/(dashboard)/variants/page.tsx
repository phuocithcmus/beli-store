/**
 * Product Variants Page - Connected to Backend API
 * Global view of all product variants across all products
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  useVariants,
  useProducts,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
} from '@/hooks/use-api';
import {
  ResponsiveWrapper,
  ResponsiveGrid,
} from '@/components/layout/ResponsiveWrapper';
import { useIsMobile } from '@/hooks/useResponsive';
import { ProductVariantCard } from '@/features/productVariants/components/ProductVariantCard';
import { ProductVariantDialog } from '@/features/productVariants/components/ProductVariantDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Grid,
  List,
  Package,
  Boxes,
  TrendingUp,
  AlertTriangle,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { ProductVariant } from '@/types';

type ViewMode = 'grid' | 'list';
type FilterOption = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
type SortOption =
  | 'sku'
  | 'product'
  | 'color'
  | 'size'
  | 'inventory'
  | 'created';

export default function VariantsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [filteredVariants, setFilteredVariants] = useState<ProductVariant[]>(
    []
  );

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('sku');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // API Hooks
  const {
    data: variantsResponse,
    isLoading: variantsLoading,
    error: variantsError,
    refetch: refetchVariants,
  } = useVariants();

  const {
    data: productsResponse,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts();

  const createVariantMutation = useCreateVariant();
  const updateVariantMutation = useUpdateVariant();
  const deleteVariantMutation = useDeleteVariant();

  const variants = variantsResponse?.data || [];
  const products = productsResponse?.data || [];

  const isLoading = variantsLoading || productsLoading;
  const error = variantsError || productsError;

  const filterAndSortVariants = useCallback(() => {
    const variants = variantsResponse?.data || [];
    const products = productsResponse?.data || [];
    let filtered = [...variants];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((variant) => {
        const product = products.find((p) => p.id === variant.productId);
        return (
          variant.sku.toLowerCase().includes(query) ||
          variant.color.toLowerCase().includes(query) ||
          variant.size.toLowerCase().includes(query) ||
          variant.form.toLowerCase().includes(query) ||
          product?.name.toLowerCase().includes(query) ||
          product?.code.toLowerCase().includes(query)
        );
      });
    }

    // Apply stock filter
    if (filterBy !== 'all') {
      filtered = filtered.filter((variant) => {
        const available =
          variant.inventoryCount - variant.reservedCount - variant.soldCount;
        switch (filterBy) {
          case 'in-stock':
            return available > 5;
          case 'low-stock':
            return available > 0 && available <= 5;
          case 'out-of-stock':
            return available <= 0;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'sku':
          return a.sku.localeCompare(b.sku);
        case 'product':
          const productA = products.find((p) => p.id === a.productId);
          const productB = products.find((p) => p.id === b.productId);
          return (productA?.name || '').localeCompare(productB?.name || '');
        case 'color':
          return a.color.localeCompare(b.color);
        case 'size':
          const sizeOrder = ['S', 'M', 'L', 'XL'];
          return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
        case 'inventory':
          return (
            b.inventoryCount -
            b.reservedCount -
            b.soldCount -
            (a.inventoryCount - a.reservedCount - a.soldCount)
          );
        case 'created':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredVariants(filtered);
  }, [variantsResponse, productsResponse, searchQuery, filterBy, sortBy]);

  useEffect(() => {
    filterAndSortVariants();
  }, [filterAndSortVariants]);

  const handleRefresh = () => {
    refetchVariants();
    refetchProducts();
  };

  const handleVariantEdit = (variant: ProductVariant) => {
    router.push(`/products/${variant.productId}#variant-${variant.id}`);
  };

  const handleVariantDelete = async (variantId: string) => {
    const variantToDelete = variants.find((v) => v.id === variantId);
    if (!variantToDelete) {
      alert('Variant not found');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete variant ${variantToDelete.sku}?`
      )
    ) {
      return;
    }

    try {
      await deleteVariantMutation.mutateAsync(variantId);
    } catch (error) {
      console.error('Error deleting variant:', error);
      alert('Failed to delete variant. Please try again.');
    }
  };

  const handleVariantSave = () => {
    setSelectedProductId(''); // Clear selection after creating
  };

  // Calculate statistics
  const totalVariants = variants.length;
  const totalInventory = variants.reduce((sum, v) => sum + v.inventoryCount, 0);
  const totalAvailable = variants.reduce(
    (sum, v) => sum + (v.inventoryCount - v.reservedCount - v.soldCount),
    0
  );
  const lowStockCount = variants.filter((v) => {
    const available = v.inventoryCount - v.reservedCount - v.soldCount;
    return available > 0 && available <= 5;
  }).length;
  const outOfStockCount = variants.filter(
    (v) => v.inventoryCount - v.reservedCount - v.soldCount <= 0
  ).length;

  // Error handling
  if (error) {
    return (
      <ResponsiveWrapper className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <div className="flex-1">
                <p className="font-medium">Failed to load variants</p>
                <p className="text-sm text-red-600">
                  Please check your connection and try again.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="mr-1 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </ResponsiveWrapper>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <ResponsiveWrapper>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading variants...</p>
          </div>
        </div>
      </ResponsiveWrapper>
    );
  }

  return (
    <ResponsiveWrapper
      className={`${isMobile ? 'flex flex-col gap-4' : 'flex flex-col gap-4'}`}
    >
      {/* Header */}
      <div
        className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}
      >
        <div>
          <h1
            className={`font-bold tracking-tight ${isMobile ? 'text-2xl' : 'text-3xl'}`}
          >
            Product Variants
          </h1>
          <p className="text-muted-foreground">
            Manage variants across all products with backend API integration
          </p>
        </div>
        <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'items-center'}`}>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {products.length > 0 && (
            <div
              className={`flex gap-2 ${isMobile ? 'flex-col' : 'items-center'}`}
            >
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger className={isMobile ? 'w-full' : 'w-48'}>
                  <SelectValue placeholder="Select product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProductId && (
                <ProductVariantDialog
                  productId={selectedProductId}
                  mode="create"
                  onSave={handleVariantSave}
                  trigger={
                    <Button disabled={createVariantMutation.isPending}>
                      <Package className="mr-2 h-4 w-4" />
                      Add Variant
                    </Button>
                  }
                />
              )}
            </div>
          )}
          <Button onClick={() => router.push('/products')} variant="outline">
            <Package className="mr-2 h-4 w-4" />
            View Products
          </Button>
        </div>
      </div>

      {/* API Status Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex h-2 w-2 rounded-full bg-green-500"></div>
        <span className="text-muted-foreground">Connected to Backend API</span>
        {(createVariantMutation.isPending ||
          updateVariantMutation.isPending ||
          deleteVariantMutation.isPending) && (
          <span className="flex items-center gap-1 text-blue-600">
            <div className="h-3 w-3 animate-spin rounded-full border border-blue-600 border-t-transparent"></div>
            Processing...
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <ResponsiveGrid columns={{ xs: 2, md: 4 }} className="gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Boxes className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Variants</p>
                <p className="text-2xl font-bold">{totalVariants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <Package className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Available Stock</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalAvailable}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {totalInventory} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {lowStockCount}
                </p>
                <p className="text-xs text-muted-foreground">≤ 5 units</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <TrendingUp className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {outOfStockCount}
                </p>
                <p className="text-xs text-muted-foreground">0 units</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </ResponsiveGrid>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={`flex gap-4 ${isMobile ? 'flex-col' : 'flex-row items-center justify-between'}`}
          >
            {/* Search */}
            <div className={`${isMobile ? 'w-full' : 'max-w-sm flex-1'}`}>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search variants, products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Filters and Controls */}
            <div
              className={`flex gap-2 ${isMobile ? 'flex-wrap' : 'items-center'}`}
            >
              {/* Stock Filter */}
              <Select
                value={filterBy}
                onValueChange={(value) => setFilterBy(value as FilterOption)}
              >
                <SelectTrigger
                  className={isMobile ? 'w-full min-w-[140px]' : 'w-32'}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger
                  className={isMobile ? 'w-full min-w-[140px]' : 'w-32'}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sku">Sort by SKU</SelectItem>
                  <SelectItem value="product">Sort by Product</SelectItem>
                  <SelectItem value="color">Sort by Color</SelectItem>
                  <SelectItem value="size">Sort by Size</SelectItem>
                  <SelectItem value="inventory">Sort by Stock</SelectItem>
                  <SelectItem value="created">Recently Added</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div
                className={`flex rounded-md border ${isMobile ? 'w-full' : ''}`}
              >
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`${isMobile ? 'flex-1' : 'px-3'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`${isMobile ? 'flex-1' : 'px-3'}`}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filter badges */}
          {(searchQuery || filterBy !== 'all') && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filters:</span>
              {searchQuery && (
                <Badge variant="secondary">Search: {searchQuery}</Badge>
              )}
              {filterBy !== 'all' && (
                <Badge variant="secondary">
                  Stock: {filterBy.replace('-', ' ')}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterBy('all');
                }}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variants Display */}
      {filteredVariants.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center">
            <Boxes className="mb-4 h-12 w-12 text-muted-foreground" />
            {variants.length === 0 ? (
              <div className="text-center">
                <p className="mb-2 text-lg font-medium">No variants found</p>
                <p className="mb-4 text-muted-foreground">
                  Create your first product variant to get started
                </p>
                <div className="flex flex-col items-center gap-2">
                  {products.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedProductId}
                        onValueChange={setSelectedProductId}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select product..." />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedProductId && (
                        <ProductVariantDialog
                          productId={selectedProductId}
                          mode="create"
                          onSave={handleVariantSave}
                          trigger={
                            <Button disabled={createVariantMutation.isPending}>
                              <Package className="mr-2 h-4 w-4" />
                              Create First Variant
                            </Button>
                          }
                        />
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="mb-2 text-muted-foreground">
                        You need to create a product first
                      </p>
                      <Button onClick={() => router.push('/products')}>
                        <Package className="mr-2 h-4 w-4" />
                        Create Product
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="mb-2 text-lg font-medium">No matches found</p>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left font-medium">Product</th>
                    <th className="p-4 text-left font-medium">SKU</th>
                    <th className="p-4 text-left font-medium">Variant</th>
                    <th className="p-4 text-right font-medium">Inventory</th>
                    <th className="p-4 text-right font-medium">Reserved</th>
                    <th className="p-4 text-right font-medium">Sold</th>
                    <th className="p-4 text-right font-medium">Available</th>
                    <th className="p-4 text-center font-medium">Status</th>
                    <th className="p-4 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVariants.map((variant) => {
                    const product = products.find(
                      (p) => p.id === variant.productId
                    );
                    const available =
                      variant.inventoryCount -
                      variant.reservedCount -
                      variant.soldCount;
                    const stockStatus =
                      available <= 0
                        ? {
                            label: 'Out of Stock',
                            color: 'bg-red-100 text-red-800',
                          }
                        : available <= 5
                          ? {
                              label: 'Low Stock',
                              color: 'bg-yellow-100 text-yellow-800',
                            }
                          : {
                              label: 'In Stock',
                              color: 'bg-green-100 text-green-800',
                            };

                    return (
                      <tr
                        key={variant.id}
                        className="border-b hover:bg-muted/25"
                      >
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {product?.name || 'Unknown Product'}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {product?.code}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <code className="rounded bg-muted px-2 py-1 text-sm">
                            {variant.sku}
                          </code>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded-full border border-gray-300"
                              style={{
                                backgroundColor: variant.color.toLowerCase(),
                              }}
                              title={variant.color}
                            />
                            <span className="text-sm">
                              {variant.color} / {variant.size} / {variant.form}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-medium">
                          {variant.inventoryCount}
                        </td>
                        <td className="p-4 text-right text-orange-600">
                          {variant.reservedCount}
                        </td>
                        <td className="p-4 text-right text-green-600">
                          {variant.soldCount}
                        </td>
                        <td className="p-4 text-right font-medium">
                          <span
                            className={`${
                              available <= 0
                                ? 'text-red-600'
                                : available <= 5
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                            }`}
                          >
                            {available}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Badge
                            className={stockStatus.color}
                            variant="secondary"
                          >
                            {stockStatus.label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVariantEdit(variant)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVariantDelete(variant.id)}
                              disabled={deleteVariantMutation.isPending}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}
        >
          {filteredVariants.map((variant) => {
            const product = products.find((p) => p.id === variant.productId);
            return (
              <div key={variant.id} className="space-y-2">
                {product && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      {product.name} ({product.code})
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/products/${product.id}`)}
                      className="text-xs"
                    >
                      View Product
                    </Button>
                  </div>
                )}
                <ProductVariantCard
                  variant={variant}
                  onEdit={handleVariantEdit}
                  onDelete={handleVariantDelete}
                />
              </div>
            );
          })}
        </div>
      )}
    </ResponsiveWrapper>
  );
}
