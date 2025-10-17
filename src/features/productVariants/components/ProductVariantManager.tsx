/**
 * ProductVariantManager Component
 * Complete product variant management interface
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Grid, List, Package } from 'lucide-react';
import { ProductVariantCard } from './ProductVariantCard';
import { ProductVariantDialog } from './ProductVariantDialog';
import { storageService } from '@/lib/storage';
import type { ProductVariant, Product } from '@/types';

interface ProductVariantManagerProps {
  /**
   * Product ID to manage variants for
   */
  productId: string;

  /**
   * Display mode preference
   */
  defaultView?: 'list' | 'grid';

  /**
   * Callback when variants are updated
   */
  onVariantsChange?: (variants: ProductVariant[]) => void;
}

type SortOption =
  | 'sku'
  | 'color'
  | 'size'
  | 'inventory'
  | 'created'
  | 'updated';
type FilterOption = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';

export function ProductVariantManager({
  productId,
  defaultView = 'list',
  onVariantsChange,
}: ProductVariantManagerProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [filteredVariants, setFilteredVariants] = useState<ProductVariant[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  // UI State
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(defaultView);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('sku');

  // Load data
  useEffect(() => {
    loadData();
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter and sort variants
  useEffect(() => {
    let filtered = [...variants];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (variant) =>
          variant.sku.toLowerCase().includes(query) ||
          variant.color.toLowerCase().includes(query) ||
          variant.size.toLowerCase().includes(query) ||
          variant.form.toLowerCase().includes(query)
      );
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
        case 'updated':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        default:
          return 0;
      }
    });

    setFilteredVariants(filtered);
  }, [variants, searchQuery, sortBy, filterBy]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading variants for product:', productId);
      const [productData, variantData] = await Promise.all([
        Promise.resolve(storageService.getProduct(productId)),
        Promise.resolve(storageService.getProductVariantsByProduct(productId)),
      ]);

      setProduct(productData || null);
      setVariants(variantData);
      onVariantsChange?.(variantData);
    } catch (error) {
      console.error('Error loading product variant data:', error);
    } finally {
      setLoading(false);
    }
  }, [productId, onVariantsChange]);

  const handleVariantSave = () => {
    loadData(); // Reload to get fresh data
  };

  const handleVariantDelete = (variantId: string) => {
    try {
      storageService.deleteProductVariant(variantId);
      const updatedVariants = variants.filter((v) => v.id !== variantId);
      setVariants(updatedVariants);
      onVariantsChange?.(updatedVariants);

      // Clear selected variant if it was deleted
      if (selectedVariant?.id === variantId) {
        setSelectedVariant(null);
      }
    } catch (error) {
      console.error('Error deleting variant:', error);
      alert('Failed to delete variant. Please try again.');
    }
  };

  const getStockStatusCounts = () => {
    return variants.reduce(
      (acc, variant) => {
        const available =
          variant.inventoryCount - variant.reservedCount - variant.soldCount;
        if (available <= 0) {
          acc.outOfStock++;
        } else if (available <= 5) {
          acc.lowStock++;
        } else {
          acc.inStock++;
        }
        return acc;
      },
      { inStock: 0, lowStock: 0, outOfStock: 0 }
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <div className="text-center">
            <Package className="mx-auto mb-2 h-8 w-8 animate-pulse text-muted-foreground" />
            <p>Loading variants...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!product) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <p className="text-muted-foreground">Product not found</p>
        </CardContent>
      </Card>
    );
  }

  const stockCounts = getStockStatusCounts();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Product Variants</CardTitle>
              <p className="mt-1 text-muted-foreground">
                Managing variants for {product.name}
              </p>
            </div>
            <ProductVariantDialog
              productId={productId}
              mode="create"
              onSave={handleVariantSave}
              trigger={
                <Button>
                  <Package className="mr-2 h-4 w-4" />
                  Add Variant
                </Button>
              }
            />
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold">{variants.length}</p>
              <p className="text-sm text-muted-foreground">Total Variants</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {stockCounts.inStock}
              </p>
              <p className="text-sm text-muted-foreground">In Stock</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {stockCounts.lowStock}
              </p>
              <p className="text-sm text-muted-foreground">Low Stock</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center">
              <p className="text-2xl font-bold text-red-600">
                {stockCounts.outOfStock}
              </p>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="max-w-sm flex-1">
              <Label htmlFor="search" className="sr-only">
                Search variants
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by SKU, color, size..."
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
                  <SelectItem value="color">Sort by Color</SelectItem>
                  <SelectItem value="size">Sort by Size</SelectItem>
                  <SelectItem value="inventory">Sort by Stock</SelectItem>
                  <SelectItem value="created">Recently Added</SelectItem>
                  <SelectItem value="updated">Recently Updated</SelectItem>
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

      {/* Main Content */}
      <div className="space-y-4">
        {/* Variant Display */}
        {filteredVariants.length === 0 ? (
          <Card>
            <CardContent className="flex h-48 flex-col items-center justify-center">
              <Package className="mb-4 h-12 w-12 text-muted-foreground" />
              {variants.length === 0 ? (
                <div className="text-center">
                  <p className="mb-2 text-lg font-medium">No variants yet</p>
                  <p className="mb-4 text-muted-foreground">
                    Create your first product variant to get started
                  </p>
                  <ProductVariantDialog
                    productId={productId}
                    mode="create"
                    onSave={handleVariantSave}
                    trigger={
                      <Button size="lg">
                        <Package className="mr-2 h-4 w-4" />
                        Create First Variant
                      </Button>
                    }
                  />
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
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredVariants.map((variant) => (
              <ProductVariantCard
                key={variant.id}
                variant={variant}
                onEdit={(variant: ProductVariant) => {
                  setSelectedVariant(variant);
                }}
                onDelete={handleVariantDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
