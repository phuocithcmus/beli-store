/**
 * ProductVariantsSummary Component
 * Shows a summary of product variants in the products list
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Boxes, Eye } from 'lucide-react';
import { storageService } from '@/lib/storage';
import type { ProductVariant } from '@/types';

interface ProductVariantsSummaryProps {
  productId: string;
  onViewDetails?: () => void;
  compact?: boolean;
}

export function ProductVariantsSummary({
  productId,
  onViewDetails,
  compact = false,
}: ProductVariantsSummaryProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVariants = useCallback(async () => {
    try {
      const variantData = storageService.getProductVariantsByProduct(productId);
      setVariants(variantData);
    } catch (error) {
      console.error('Error loading variants:', error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-b border-muted-foreground"></div>
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Boxes className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">No variants</span>
      </div>
    );
  }

  const totalInventory = variants.reduce(
    (sum, variant) => sum + variant.inventoryCount,
    0
  );

  const availableStock = variants.reduce(
    (sum, variant) =>
      sum +
      (variant.inventoryCount - variant.reservedCount - variant.soldCount),
    0
  );

  const stockStatus =
    availableStock <= 0
      ? 'out-of-stock'
      : availableStock <= 5
        ? 'low-stock'
        : 'in-stock';
  const stockColor =
    stockStatus === 'out-of-stock'
      ? 'destructive'
      : stockStatus === 'low-stock'
        ? 'secondary'
        : 'default';

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-xs">
          {variants.length} variants
        </Badge>
        <Badge variant={stockColor} className="text-xs">
          {availableStock} available
        </Badge>
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            className="h-6 w-6 p-0"
          >
            <Eye className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {variants.length} Variants
          </span>
        </div>
        {onViewDetails && (
          <Button variant="ghost" size="sm" onClick={onViewDetails}>
            <Eye className="mr-1 h-3 w-3" />
            Details
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Total Stock:</span>
          <span className="ml-1 font-medium">{totalInventory}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Available:</span>
          <span
            className={`ml-1 font-medium ${
              stockStatus === 'out-of-stock'
                ? 'text-red-600'
                : stockStatus === 'low-stock'
                  ? 'text-yellow-600'
                  : 'text-green-600'
            }`}
          >
            {availableStock}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {variants.slice(0, 3).map((variant) => (
          <Badge key={variant.id} variant="outline" className="text-xs">
            {variant.color} {variant.size}
          </Badge>
        ))}
        {variants.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{variants.length - 3} more
          </Badge>
        )}
      </div>
    </div>
  );
}
