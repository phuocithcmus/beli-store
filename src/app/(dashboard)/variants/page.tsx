/**
 * Product Variants Page
 * Global view of all product variants across all products
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { storageService } from '@/lib/storage';
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
} from 'lucide-react';
import type { ProductVariant, Product } from '@/types';

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
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredVariants, setFilteredVariants] = useState<ProductVariant[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('sku');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const filterAndSortVariants = useCallback(() => {
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
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return 0;
      }
    });

    setFilteredVariants(filtered);
  }, [variants, products, searchQuery, filterBy, sortBy]);

  useEffect(() => {
    filterAndSortVariants();
  }, [filterAndSortVariants]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allVariants, allProducts] = await Promise.all([
        Promise.resolve(storageService.getProductVariants()),
        Promise.resolve(storageService.getProductsWithVariants()),
      ]);

      setVariants(allVariants);
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVariantEdit = (variant: ProductVariant) => {
    router.push(`/products/${variant.productId}#variant-${variant.id}`);
  };

  const handleVariantDelete = (variantId: string) => {
    try {
      const variantToDelete = variants.find((v) => v.id === variantId);
      if (!variantToDelete) {
        alert('Variant not found');
        return;
      }

      if (
        confirm(
          `Are you sure you want to delete variant ${variantToDelete.sku}?`
        )
      ) {
        storageService.deleteProductVariant(variantId);
        loadData(); // Refresh data - this will also update product quantities
      }
    } catch (error) {
      console.error('Error deleting variant:', error);
      alert('Failed to delete variant. Please try again.');
    }
  };

  const handleVariantSave = (variant: ProductVariant) => {
    try {
      storageService.saveProductVariant(variant);
      loadData(); // Refresh data - this will also update product quantities
      setSelectedProductId(''); // Clear selection after creating
    } catch (error) {
      console.error('Error saving variant:', error);
      alert('Failed to save variant. Please try again.');
    }
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

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading variants...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">
            Product Variants
          </h1>
          <p className="text-muted-foreground">
            Manage variants across all products in your inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          {products.length > 0 && (
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
                    <Button>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="max-w-sm flex-1">
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
            <div className="flex items-center gap-2">
              {/* Stock Filter */}
              <Select
                value={filterBy}
                onValueChange={(value) => setFilterBy(value as FilterOption)}
              >
                <SelectTrigger className="w-32">
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
                <SelectTrigger className="w-32">
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
              <div className="flex rounded-md border">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-3"
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
                            <Button>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
