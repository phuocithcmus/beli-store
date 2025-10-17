/**
 * Quick Actions for Product Variants
 * Floating action buttons or quick access to variant features
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateVariantDialog } from './ProductVariantDialog';
import { Plus, Boxes } from 'lucide-react';

interface ProductVariantQuickActionsProps {
  productId: string;
  productName?: string;
  onVariantAdded?: () => void;
  className?: string;
}

export function ProductVariantQuickActions({
  productId,
  onVariantAdded,
  className = '',
}: ProductVariantQuickActionsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleVariantSaved = () => {
    setShowCreateDialog(false);
    onVariantAdded?.();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowCreateDialog(true)}
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Variant
      </Button>

      <CreateVariantDialog
        productId={productId}
        onSave={handleVariantSaved}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        trigger={null}
      />
    </div>
  );
}

/**
 * Variant Status Indicator
 * Shows variant count and status for a product
 */
interface VariantStatusIndicatorProps {
  variantCount: number;
  hasLowStock?: boolean;
  hasOutOfStock?: boolean;
  className?: string;
}

export function VariantStatusIndicator({
  variantCount,
  hasLowStock = false,
  hasOutOfStock = false,
  className = '',
}: VariantStatusIndicatorProps) {
  if (variantCount === 0) {
    return (
      <div
        className={`flex items-center gap-1 text-muted-foreground ${className}`}
      >
        <Boxes className="h-4 w-4" />
        <span className="text-xs">No variants</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Boxes className="h-4 w-4" />
      <span className="text-xs font-medium">{variantCount}</span>
      {hasOutOfStock && (
        <span className="text-xs font-medium text-red-600">Out</span>
      )}
      {hasLowStock && !hasOutOfStock && (
        <span className="text-xs font-medium text-yellow-600">Low</span>
      )}
    </div>
  );
}
