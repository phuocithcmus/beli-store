/**
 * ProductVariantList Component
 * Displays and manages product variants for a specific product
 */

'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storageService } from '@/lib/storage';
import type { ProductVariant, Product } from '@/types';

interface ProductVariantListProps {
  productId: string;
  onEditVariant?: (variant: ProductVariant) => void;
  onDeleteVariant?: (variantId: string) => void;
  onAddVariant?: () => void;
  showActions?: boolean;
}

export function ProductVariantList({
  productId,
  onEditVariant,
  onDeleteVariant,
  onAddVariant,
  showActions = true,
}: ProductVariantListProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        setLoading(true);
        const productData = storageService.getProduct(productId);
        const variantData =
          storageService.getProductVariantsByProduct(productId);
        setProduct(productData || null);
        setVariants(variantData);
      } catch (error) {
        console.error('Error loading variants:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId]);

  const handleDeleteClick = (variant: ProductVariant) => {
    if (confirm(`Are you sure you want to delete variant ${variant.sku}?`)) {
      onDeleteVariant?.(variant.id);
      // Trigger a refresh by reloading variants
      const variantData = storageService.getProductVariantsByProduct(productId);
      setVariants(variantData);
    }
  };

  const getAvailableInventory = (variant: ProductVariant) => {
    return variant.inventoryCount - variant.reservedCount - variant.soldCount;
  };

  const getStockStatus = (variant: ProductVariant) => {
    const available = getAvailableInventory(variant);
    if (available <= 0) {
      return {
        status: 'out-of-stock',
        label: 'Out of Stock',
        color: 'bg-red-100 text-red-800',
      };
    }
    if (available <= 5) {
      return {
        status: 'low-stock',
        label: 'Low Stock',
        color: 'bg-yellow-100 text-yellow-800',
      };
    }
    return {
      status: 'in-stock',
      label: 'In Stock',
      color: 'bg-green-100 text-green-800',
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading variants...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">Product not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Product Variants</h3>
          <p className="text-sm text-muted-foreground">
            {product.code} - {product.name}
          </p>
        </div>
        {showActions && onAddVariant && (
          <Button onClick={onAddVariant} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Variant
          </Button>
        )}
      </div>

      {variants.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No variants found</h3>
          <p className="mt-2 text-muted-foreground">
            This product doesn&apos;t have any variants yet.
          </p>
          {showActions && onAddVariant && (
            <Button onClick={onAddVariant} className="mt-4" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add First Variant
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-medium">SKU</th>
                  <th className="p-4 text-left font-medium">Color</th>
                  <th className="p-4 text-left font-medium">Size</th>
                  <th className="p-4 text-left font-medium">Form</th>
                  <th className="p-4 text-right font-medium">Inventory</th>
                  <th className="p-4 text-right font-medium">Reserved</th>
                  <th className="p-4 text-right font-medium">Sold</th>
                  <th className="p-4 text-right font-medium">Available</th>
                  <th className="p-4 text-center font-medium">Status</th>
                  {showActions && (
                    <th className="p-4 text-center font-medium">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => {
                  const available = getAvailableInventory(variant);
                  const stockStatus = getStockStatus(variant);

                  return (
                    <tr key={variant.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-mono text-sm">{variant.sku}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full border"
                            style={{
                              backgroundColor: variant.color.toLowerCase(),
                            }}
                            title={variant.color}
                          />
                          <span>{variant.color}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{variant.size}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{variant.form}</Badge>
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
                        <Badge className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                      </td>
                      {showActions && (
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            {onEditVariant && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditVariant(variant)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                            {onDeleteVariant && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(variant)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
