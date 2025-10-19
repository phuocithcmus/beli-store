/**
 * Products Page - Connected to Backend API
 * T026 [US1] - Enhanced product inventory management interface with variant support
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/use-api';
import { ProductList } from '@/features/products/components/ProductList';
import { ProductDialog } from '@/features/products/components/ProductDialog';
import { ExportButton } from '@/features/export/components/ExportButton';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ResponsiveWrapper,
  ResponsiveGrid,
  ResponsiveStack,
} from '@/components/layout/ResponsiveWrapper';
import { useIsMobile } from '@/hooks/useResponsive';
import { touchOptimized } from '@/lib/utils/responsive';
import {
  Plus,
  Upload,
  Package,
  TrendingDown,
  Eye,
  DollarSign,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { formatVND } from '@/lib/currency';

export default function ProductsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'shirt' | 'pants' | ''>('');

  // API Hooks
  const { 
    data: products = [], 
    isLoading, 
    error, 
    refetch 
  } = useProducts({ 
    search: searchQuery || undefined,
    category: categoryFilter || undefined 
  });

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await deleteProductMutation.mutateAsync(productId);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. It may have existing dependencies.');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleViewProduct = (product: Product) => {
    router.push(`/products/${product.id}`);
  };

  const handleDialogSuccess = () => {
    setShowAddDialog(false);
    setEditingProduct(null);
    refetch(); // Refresh data
  };

  // Calculate summary statistics
  const totalProducts = products.length;
  const lowStockCount = products.filter(
    (p) => p.remainingQuantity <= 10
  ).length;
  const totalValue = products.reduce(
    (sum, p) => sum + p.remainingQuantity * (p.sellingPrice || 0),
    0
  );
  const totalSold = products.reduce((sum, p) => sum + p.soldQuantity, 0);

  // Error handling
  if (error) {
    return (
      <ResponsiveWrapper className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <div className="flex-1">
                <p className="font-medium">Failed to load products</p>
                <p className="text-sm text-red-600">Please check your connection and try again.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
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
      <ResponsiveWrapper className="space-y-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </ResponsiveWrapper>
    );
  }

  return (
    <ResponsiveWrapper className="space-y-6">
      {/* Header */}
      <ResponsiveStack spacing={isMobile ? 'sm' : 'md'}>
        <div>
          <h1
            className={`font-bold tracking-tight ${isMobile ? 'text-2xl' : 'text-3xl'}`}
          >
            Products
          </h1>
          <p className="text-muted-foreground">
            Manage your product inventory with backend API integration
          </p>
        </div>

        {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
        {isMobile ? (
          <ResponsiveStack spacing="sm">
            <Button
              onClick={() => setShowAddDialog(true)}
              disabled={createProductMutation.isPending}
              className={touchOptimized('w-full', {
                touchClasses: 'min-h-[48px]',
              })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <ExportButton variant="outline" className="w-full" />
              <Button variant="outline" className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </div>
          </ResponsiveStack>
        ) : (
          <div className="ml-auto flex gap-2">
            <Button 
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <ExportButton variant="outline" />
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button 
              onClick={() => setShowAddDialog(true)}
              disabled={createProductMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        )}
      </ResponsiveStack>

      {/* API Status Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex h-2 w-2 rounded-full bg-green-500"></div>
        <span className="text-muted-foreground">Connected to Backend API</span>
        {(createProductMutation.isPending || updateProductMutation.isPending || deleteProductMutation.isPending) && (
          <span className="text-blue-600 flex items-center gap-1">
            <div className="h-3 w-3 animate-spin rounded-full border border-blue-600 border-t-transparent"></div>
            Processing...
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <ResponsiveGrid columns={{ xs: 1, sm: 2, md: 3, lg: 5 }} gap="md">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Eye className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Units Sold</p>
                <p className="text-2xl font-bold">{totalSold}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {lowStockCount}
                </p>
                <p className="text-xs text-muted-foreground">products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                <Package className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Inventory Value</p>
                <p className="text-xl font-bold">{formatVND(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Avg. Selling Price</p>
                <p className="text-xl font-bold">
                  {totalProducts > 0 
                    ? formatVND(products.reduce((sum, p) => sum + (p.sellingPrice || 0), 0) / totalProducts)
                    : formatVND(0)
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </ResponsiveGrid>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as 'shirt' | 'pants' | '')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">All Categories</option>
          <option value="shirt">Shirts</option>
          <option value="pants">Pants</option>
        </select>
      </div>

      {/* Products List with built-in filtering */}
      <ProductList
        products={products}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDeleteProduct}
        onViewProduct={handleViewProduct}
      />

      {/* Add Product Dialog */}
      <ProductDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handleDialogSuccess}
      />

      {/* Edit Product Dialog */}
      <ProductDialog
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct || undefined}
        onSuccess={handleDialogSuccess}
      />
    </ResponsiveWrapper>
  );
}