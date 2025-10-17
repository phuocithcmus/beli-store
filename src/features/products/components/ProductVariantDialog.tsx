/**
 * ProductVariantDialog Component
 * T027 [US1] - Enhanced modal dialog with improved validation and error handling
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVariantOperations } from '@/features/products/hooks/useVariantOperations';
import { storageService } from '@/lib/storage';
import {
  validateVariantForm,
  getUserFriendlyErrorMessage,
  getRecoverySuggestions,
  type ValidationError,
} from '@/features/products/utils/variantErrorHandling';
import type { Product, ProductVariant } from '@/types';
import type { ProductVariantFormData } from '@/features/products/types/variants';

interface ProductVariantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  variant?: ProductVariant; // For editing existing variants
  onSuccess?: () => void; // Callback after successful save
}

export function ProductVariantDialog({
  isOpen,
  onClose,
  productId,
  variant,
  onSuccess,
}: ProductVariantDialogProps) {
  const { createVariantFromForm, updateVariant, saving, error, clearError } =
    useVariantOperations();

  // Form state
  const [formData, setFormData] = useState<ProductVariantFormData>({
    productId,
    color: '',
    size: 'M',
    form: 'fit',
    inventoryCount: 0,
    reservedCount: 0,
    soldCount: 0,
  });

  // Enhanced validation state
  const [validationWarnings, setValidationWarnings] = useState<
    ValidationError[]
  >([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Product info for display
  const [product, setProduct] = useState<Product | null>(null);

  // Load product information
  useEffect(() => {
    if (productId) {
      const productData = storageService.getProduct(productId);
      setProduct(productData || null);
    }
  }, [productId]);

  // Initialize form data when variant changes
  useEffect(() => {
    if (variant) {
      setFormData({
        productId: variant.productId,
        color: variant.color,
        size: variant.size,
        form: variant.form,
        inventoryCount: variant.inventoryCount,
        reservedCount: variant.reservedCount,
        soldCount: variant.soldCount,
      });
    } else {
      setFormData({
        productId,
        color: '',
        size: 'M',
        form: 'fit',
        inventoryCount: 0,
        reservedCount: 0,
        soldCount: 0,
      });
    }
  }, [variant, productId]);

  // Clear error when dialog opens
  useEffect(() => {
    if (isOpen) {
      clearError();
    }
  }, [isOpen, clearError]);

  const handleInputChange = (
    field: keyof ProductVariantFormData,
    value: string | number
  ) => {
    const newFormData = {
      ...formData,
      [field]: value,
    };
    setFormData(newFormData);

    // Real-time validation
    const validation = validateVariantForm(newFormData);
    // TODO: Display validation errors in UI
    setValidationWarnings(validation.warnings);

    // Set field-specific errors
    const newFieldErrors: Record<string, string> = {};
    validation.errors.forEach((error) => {
      if (error.field) {
        newFieldErrors[error.field] = error.message;
      }
    });
    setFieldErrors(newFieldErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let result;

      if (variant) {
        // Update existing variant
        result = await updateVariant(variant.id, {
          color: formData.color,
          size: formData.size,
          form: formData.form,
          inventoryCount: formData.inventoryCount,
          reservedCount: formData.reservedCount,
          soldCount: formData.soldCount,
        });
      } else {
        // Create new variant
        result = await createVariantFromForm(formData);
      }

      if (result) {
        // Success! Close dialog and notify parent
        onClose();
        onSuccess?.();
      }
    } catch (err) {
      // Error is handled by the hook
      console.error('Variant save error:', err);
    }
  };

  const handleClose = () => {
    if (!saving) {
      clearError();
      onClose();
    }
  };

  const isFormValid = () => {
    // First check if all required fields are filled
    const hasRequiredFields =
      formData.color.trim() !== '' &&
      formData.inventoryCount >= 0 &&
      formData.reservedCount >= 0 &&
      formData.soldCount >= 0;

    if (!hasRequiredFields) {
      return false;
    }

    // Then check validation errors
    const validation = validateVariantForm(formData);
    return validation.isValid;
  };

  // Enhanced error message display
  const getDisplayError = () => {
    if (error) {
      const friendlyMessage = getUserFriendlyErrorMessage(error);
      const suggestions = getRecoverySuggestions(error);

      return {
        message: friendlyMessage,
        suggestions: suggestions.slice(0, 2), // Show max 2 suggestions
      };
    }
    return null;
  };

  const displayError = getDisplayError();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {variant ? 'Edit Product Variant' : 'Add New Product Variant'}
          </DialogTitle>
          {product && (
            <p className="text-sm text-gray-600">
              Product: {product.name} ({product.code})
            </p>
          )}
        </DialogHeader>

        {/* Enhanced Error Display */}
        {displayError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <div className="text-sm text-red-700">
              <strong>Error:</strong> {displayError.message}
              {displayError.suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Suggestions:</p>
                  <ul className="mt-1 list-inside list-disc">
                    {displayError.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Validation Warnings */}
        {validationWarnings.length > 0 && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
            <div className="text-sm text-yellow-800">
              <strong>Warnings:</strong>
              <ul className="mt-1 list-inside list-disc">
                {validationWarnings.map((warning, index) => (
                  <li key={index}>{warning.message}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Variant Attributes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Variant Attributes</h3>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color *</Label>
              <Input
                id="color"
                type="text"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="e.g. Red, Blue, White..."
                disabled={saving}
                required
                className={
                  fieldErrors.color ? 'border-red-500 focus:border-red-500' : ''
                }
              />
              {fieldErrors.color && (
                <p className="text-xs text-red-600">{fieldErrors.color}</p>
              )}
              <p className="text-xs text-gray-500">
                Enter the color name (e.g., Red, Blue, Forest Green, etc.)
              </p>
            </div>

            {/* Size */}
            <div className="space-y-2">
              <Label htmlFor="size">Size *</Label>
              <Select
                value={formData.size}
                onValueChange={(value) =>
                  handleInputChange('size', value as 'S' | 'M' | 'L' | 'XL')
                }
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">Small (S)</SelectItem>
                  <SelectItem value="M">Medium (M)</SelectItem>
                  <SelectItem value="L">Large (L)</SelectItem>
                  <SelectItem value="XL">Extra Large (XL)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Form */}
            <div className="space-y-2">
              <Label htmlFor="form">Form *</Label>
              <Select
                value={formData.form}
                onValueChange={(value) =>
                  handleInputChange('form', value as 'oversized' | 'fit')
                }
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fit">Regular Fit</SelectItem>
                  <SelectItem value="oversized">Oversized</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Inventory Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Inventory Information</h3>

            {/* Inventory Count */}
            <div className="space-y-2">
              <Label htmlFor="inventoryCount">Inventory Count *</Label>
              <Input
                id="inventoryCount"
                type="number"
                min="0"
                value={formData.inventoryCount}
                onChange={(e) =>
                  handleInputChange(
                    'inventoryCount',
                    parseInt(e.target.value) || 0
                  )
                }
                disabled={saving}
                required
              />
              <p className="text-xs text-gray-500">
                Total number of items in stock
              </p>
            </div>

            {/* Reserved Count */}
            <div className="space-y-2">
              <Label htmlFor="reservedCount">Reserved Count</Label>
              <Input
                id="reservedCount"
                type="number"
                min="0"
                max={formData.inventoryCount}
                value={formData.reservedCount}
                onChange={(e) =>
                  handleInputChange(
                    'reservedCount',
                    parseInt(e.target.value) || 0
                  )
                }
                disabled={saving}
              />
              <p className="text-xs text-gray-500">
                Number of items reserved for pending orders
              </p>
            </div>

            {/* Sold Count */}
            <div className="space-y-2">
              <Label htmlFor="soldCount">Sold Count</Label>
              <Input
                id="soldCount"
                type="number"
                min="0"
                max={formData.inventoryCount}
                value={formData.soldCount}
                onChange={(e) =>
                  handleInputChange('soldCount', parseInt(e.target.value) || 0)
                }
                disabled={saving}
              />
              <p className="text-xs text-gray-500">
                Number of items already sold
              </p>
            </div>
          </div>

          {/* Available Count Display */}
          <div className="rounded-md bg-gray-50 p-4">
            <div className="text-sm">
              <div className="font-medium">Availability Summary:</div>
              <div className="mt-1 space-y-1 text-gray-600">
                <div>Total Inventory: {formData.inventoryCount}</div>
                <div>Reserved: {formData.reservedCount}</div>
                <div>Sold: {formData.soldCount}</div>
                <div className="font-medium">
                  Available:{' '}
                  {Math.max(
                    0,
                    formData.inventoryCount -
                      formData.reservedCount -
                      formData.soldCount
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !isFormValid()}>
              {saving
                ? 'Saving...'
                : variant
                  ? 'Update Variant'
                  : 'Create Variant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
