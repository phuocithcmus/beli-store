/**
 * ProductVariantCard Component
 * Displays a single product variant in a card format with key information
 */

'use client';

import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ProductVariant } from '@/types';

interface ProductVariantCardProps {
  variant: ProductVariant;
  onEdit?: (variant: ProductVariant) => void;
  onDelete?: (variantId: string) => void;
  showActions?: boolean;
}

export function ProductVariantCard({
  variant,
  onEdit,
  onDelete,
  showActions = true,
}: ProductVariantCardProps) {
  const getAvailableInventory = () => {
    return variant.inventoryCount - variant.reservedCount - variant.soldCount;
  };

  const getStockStatus = () => {
    const available = getAvailableInventory();
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

  const handleDeleteClick = () => {
    if (confirm(`Are you sure you want to delete variant ${variant.sku}?`)) {
      onDelete?.(variant.id);
    }
  };

  const available = getAvailableInventory();
  const stockStatus = getStockStatus();

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium" title={variant.sku}>
                {variant.sku}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
              </div>
            </div>
            {showActions && (
              <div className="ml-2 flex items-center gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(variant)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="sm" onClick={handleDeleteClick}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Variant Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Color:</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border"
                  style={{ backgroundColor: variant.color.toLowerCase() }}
                  title={variant.color}
                />
                <span className="text-sm font-medium">{variant.color}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Size:</span>
                <Badge variant="outline">{variant.size}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Form:</span>
                <Badge variant="outline">{variant.form}</Badge>
              </div>
            </div>
          </div>

          {/* Inventory Information */}
          <div className="space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total:</span>
                <span className="ml-2 font-medium">
                  {variant.inventoryCount}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Available:</span>
                <span
                  className={`ml-2 font-medium ${
                    available <= 0
                      ? 'text-red-600'
                      : available <= 5
                        ? 'text-yellow-600'
                        : 'text-green-600'
                  }`}
                >
                  {available}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Reserved:</span>
                <span className="ml-2 font-medium text-orange-600">
                  {variant.reservedCount}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Sold:</span>
                <span className="ml-2 font-medium text-green-600">
                  {variant.soldCount}
                </span>
              </div>
            </div>

            {/* Inventory Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Inventory Usage</span>
                <span>
                  {variant.inventoryCount > 0
                    ? Math.round(
                        ((variant.reservedCount + variant.soldCount) /
                          variant.inventoryCount) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="flex h-full">
                  <div
                    className="bg-green-500"
                    style={{
                      width:
                        variant.inventoryCount > 0
                          ? `${(variant.soldCount / variant.inventoryCount) * 100}%`
                          : '0%',
                    }}
                  />
                  <div
                    className="bg-orange-500"
                    style={{
                      width:
                        variant.inventoryCount > 0
                          ? `${(variant.reservedCount / variant.inventoryCount) * 100}%`
                          : '0%',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t pt-3 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Created: {variant.createdAt.toLocaleDateString()}</span>
              <span>Updated: {variant.updatedAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
