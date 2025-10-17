/**
 * ProductVariantDialog Component
 * Modal dialog for creating and editing product variants
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { ProductVariantForm } from './ProductVariantForm';
import type { ProductVariant } from '@/types';

interface ProductVariantDialogProps {
  /**
   * Product ID for creating new variants
   */
  productId?: string;

  /**
   * Existing variant for editing (optional)
   */
  variant?: ProductVariant;

  /**
   * Dialog mode - determines whether this is for creating or editing
   */
  mode?: 'create' | 'edit';

  /**
   * Callback when variant is saved (created or updated)
   */
  onSave?: (variant: ProductVariant) => void;

  /**
   * Custom trigger element (optional)
   */
  trigger?: React.ReactNode;

  /**
   * Whether the dialog should be open by default
   */
  defaultOpen?: boolean;

  /**
   * Controlled open state
   */
  open?: boolean;

  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void;
}

export function ProductVariantDialog({
  productId,
  variant,
  mode = variant ? 'edit' : 'create',
  onSave,
  trigger,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: ProductVariantDialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  // Use controlled or uncontrolled state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleSave = (savedVariant: ProductVariant) => {
    onSave?.(savedVariant);
    setOpen(false);
  };

  const isCreateMode = mode === 'create';
  const title = isCreateMode
    ? 'Create Product Variant'
    : 'Edit Product Variant';
  const description = isCreateMode
    ? 'Add a new variant to this product with unique attributes and inventory.'
    : 'Update the variant details and inventory information.';

  // Default trigger buttons
  const defaultCreateTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Add Variant
    </Button>
  );

  const defaultEditTrigger = (
    <Button variant="outline" size="sm">
      <Edit className="mr-2 h-4 w-4" />
      Edit
    </Button>
  );

  const triggerElement =
    trigger || (isCreateMode ? defaultCreateTrigger : defaultEditTrigger);

  // Validation for create mode
  if (isCreateMode && !productId) {
    console.error(
      'ProductVariantDialog: productId is required for create mode'
    );
    return null;
  }

  // Validation for edit mode
  if (!isCreateMode && !variant) {
    console.error('ProductVariantDialog: variant is required for edit mode');
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerElement}</DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <ProductVariantForm
            productId={productId || ''}
            variant={variant}
            onSubmit={handleSave}
            onCancel={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Convenience component for creating new variants
 */
export function CreateVariantDialog({
  productId,
  onSave,
  trigger,
  ...props
}: Omit<ProductVariantDialogProps, 'mode' | 'variant'>) {
  return (
    <ProductVariantDialog
      mode="create"
      productId={productId}
      onSave={onSave}
      trigger={trigger}
      {...props}
    />
  );
}

/**
 * Convenience component for editing existing variants
 */
export function EditVariantDialog({
  variant,
  onSave,
  trigger,
  ...props
}: Omit<ProductVariantDialogProps, 'mode' | 'productId'>) {
  return (
    <ProductVariantDialog
      mode="edit"
      variant={variant}
      onSave={onSave}
      trigger={trigger}
      {...props}
    />
  );
}
