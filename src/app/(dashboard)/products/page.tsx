/**
 * Products Page
 * T026 [US1] - Enhanced product inventory management interface with variant support
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storageService } from '@/lib/storage';
import { ProductList } from '@/features/products/components/ProductList';
import { ProductDialog } from '@/features/products/components/ProductDialog';
import { ExportButton } from '@/features/export/components/ExportButton';
import { useAllVariantSales } from '@/features/products/hooks/useVariantSales';
import type { Product, ProductVariant } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Upload,
  Package,
  TrendingDown,
  Eye,
  Layers,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Get sales data
  const { allSales } = useAllVariantSales();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      setLoading(true);
      const productData = storageService.getProducts();
      const variantData = storageService.getProductVariants();

      setProducts(productData);
      setVariants(variantData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await storageService.deleteProduct(productId);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. It may have existing transactions.');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleViewProduct = (product: Product) => {
    router.push(`/products/${product.id}`);
  };

  const handleDialogSuccess = () => {
    loadData(); // Reload data after successful save
  };

  // Calculate summary statistics
  const totalProducts = products.length;
  const totalVariants = variants.length;
  const lowStockCount = products.filter(
    (p) => p.remainingQuantity <= 10
  ).length;
  const totalValue = products.reduce(
    (sum, p) => sum + p.remainingQuantity * p.sellingPrice,
    0
  );
  const totalVariantValue = variants.reduce((sum, v) => {
    const availableCount = v.inventoryCount - v.reservedCount - v.soldCount;
    // Estimate variant value based on parent product selling price
    const product = products.find((p) => p.id === v.productId);
    const productValue = product ? product.sellingPrice : 0;
    return sum + availableCount * productValue;
  }, 0);

  // Calculate sales statistics
  const totalSalesRevenue = allSales.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );
  const totalUnitsSold = allSales.reduce((sum, sale) => sum + sale.quantity, 0);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory with variant support for colors,
            sizes, and forms
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton variant="outline" />
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Layers className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Product Variants</p>
                <p className="text-2xl font-bold">{totalVariants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Sales Revenue</p>
                <p className="text-2xl font-bold">
                  ${totalSalesRevenue.toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Units Sold</p>
                <p className="text-2xl font-bold">{totalUnitsSold}</p>
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
                <p className="text-xl font-bold">${totalValue.toFixed(0)}</p>
                {totalVariantValue > 0 && (
                  <p className="text-xs text-muted-foreground">
                    +${totalVariantValue.toFixed(0)} variants
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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
    </div>
  );
}
