/**
 * ProductList Component
 * Displays a filterable and searchable list of products with management actions
 */

'use client';

import { useState } from 'react';
import { Search, Edit2, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatVND } from '@/lib/currency';
import type { Product } from '@/types';

interface ProductFilters {
  category: 'all' | 'shirt' | 'pants';
  lowStock: boolean;
  search: string;
}

interface ProductListProps {
  products: Product[];
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onViewProduct?: (product: Product) => void;
}

export function ProductList({
  products,
  onEditProduct,
  onDeleteProduct,
  onViewProduct,
}: ProductListProps) {
  const [filters, setFilters] = useState<ProductFilters>({
    category: 'all',
    lowStock: false,
    search: '',
  });

  // Filter products based on current filters
  const filteredProducts = products.filter((product) => {
    // Category filter
    if (filters.category !== 'all' && product.category !== filters.category) {
      return false;
    }

    // Low stock filter (≤ 10 items)
    if (filters.lowStock && product.remainingQuantity > 10) {
      return false;
    }

    // Search filter (name or code)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.code.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const handleDeleteClick = (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      onDeleteProduct?.(product.id);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4 sm:flex-row">
        <div className="flex-1">
          <Label htmlFor="search">Search products</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name or code..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={filters.category}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                category: e.target.value as ProductFilters['category'],
              }))
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="all">All Categories</option>
            <option value="shirt">Shirts</option>
            <option value="pants">Pants</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.lowStock}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, lowStock: e.target.checked }))
              }
              className="rounded"
            />
            <span className="text-sm">Low stock only</span>
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h3 className="font-semibold">
            Products ({filteredProducts.length})
          </h3>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
              <Eye className="h-full w-full" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">No products found</h3>
            <p className="text-muted-foreground">
              {products.length === 0
                ? 'Get started by adding your first product'
                : 'Try adjusting your filters or search terms'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-medium">Code</th>
                  <th className="p-4 text-left font-medium">Name</th>
                  <th className="p-4 text-left font-medium">Category</th>
                  <th className="p-4 text-right font-medium">Stock</th>
                  <th className="p-4 text-right font-medium">Purchase Price</th>
                  <th className="p-4 text-right font-medium">Selling Price</th>
                  <th className="p-4 text-right font-medium">Total Value</th>
                  <th className="p-4 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-mono text-sm">{product.code}</td>
                    <td className="p-4 font-medium">{product.name}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span
                        className={`font-medium ${
                          product.remainingQuantity <= 10
                            ? 'text-red-600'
                            : product.remainingQuantity <= 20
                              ? 'text-yellow-600'
                              : 'text-green-600'
                        }`}
                      >
                        {product.remainingQuantity}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono">
                      {formatVND(product.purchasePrice)}
                    </td>
                    <td className="p-4 text-right font-mono">
                      {product.sellingPrice ? (
                        formatVND(product.sellingPrice)
                      ) : (
                        <span className="italic text-muted-foreground">
                          Not set
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono font-medium">
                      {product.sellingPrice ? (
                        formatVND(
                          product.remainingQuantity * product.sellingPrice
                        )
                      ) : (
                        <span className="italic text-muted-foreground">
                          Cost:{' '}
                          {formatVND(
                            product.remainingQuantity * product.purchasePrice
                          )}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        {onViewProduct && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewProduct(product)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {onEditProduct && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditProduct(product)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {onDeleteProduct && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(product)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
