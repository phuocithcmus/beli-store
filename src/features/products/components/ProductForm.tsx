/**
 * ProductForm Component
 * Reusable form for creating and editing products with validation
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Product } from '@/types';

interface ProductFormData {
  code: string;
  name: string;
  category: 'shirt' | 'pants';
  remainingQuantity: number;
  soldQuantity: number;
  purchasePrice: number;
  sellingPrice: number;
}

interface ProductFormProps {
  product?: Product; // For editing existing products
  onSubmit: (data: ProductFormData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function ProductForm({
  product,
  onSubmit,
  onCancel,
  loading,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    code: product?.code || '',
    name: product?.name || '',
    category: product?.category || 'shirt',
    remainingQuantity: product?.remainingQuantity || 0,
    soldQuantity: product?.soldQuantity || 0,
    purchasePrice: product?.purchasePrice || 0,
    sellingPrice: product?.sellingPrice || 0,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductFormData, string>>
  >({});

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Product code is required';
    } else if (formData.code.length > 50) {
      newErrors.code = 'Product code must be 50 characters or less';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Product name must be 100 characters or less';
    }

    if (formData.remainingQuantity < 0) {
      newErrors.remainingQuantity = 'Quantity cannot be negative';
    }

    if (formData.soldQuantity < 0) {
      newErrors.soldQuantity = 'Sold quantity cannot be negative';
    }

    if (formData.purchasePrice <= 0) {
      newErrors.purchasePrice = 'Purchase price must be positive';
    }

    if (formData.sellingPrice <= 0) {
      newErrors.sellingPrice = 'Selling price must be positive';
    } else if (formData.sellingPrice <= formData.purchasePrice) {
      newErrors.sellingPrice =
        'Selling price must be greater than purchase price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (
    field: keyof ProductFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>

          <div>
            <Label htmlFor="code">Product Code *</Label>
            <Input
              id="code"
              placeholder="e.g., SHIRT001"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              required
              disabled={loading}
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code}</p>
            )}
          </div>

          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Blue Cotton Shirt"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              disabled={loading}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) =>
                handleChange('category', e.target.value as 'shirt' | 'pants')
              }
              required
              disabled={loading}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="shirt">Shirt</option>
              <option value="pants">Pants</option>
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>
        </div>

        {/* Inventory & Pricing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Inventory & Pricing</h3>

          <div>
            <Label htmlFor="remainingQuantity">Remaining Quantity *</Label>
            <Input
              id="remainingQuantity"
              type="number"
              placeholder="0"
              value={formData.remainingQuantity}
              onChange={(e) =>
                handleChange('remainingQuantity', parseInt(e.target.value) || 0)
              }
              min={0}
              required
              disabled={loading}
              className={errors.remainingQuantity ? 'border-red-500' : ''}
            />
            {errors.remainingQuantity && (
              <p className="mt-1 text-sm text-red-600">
                {errors.remainingQuantity}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="soldQuantity">Sold Quantity *</Label>
            <Input
              id="soldQuantity"
              type="number"
              placeholder="0"
              value={formData.soldQuantity}
              onChange={(e) =>
                handleChange('soldQuantity', parseInt(e.target.value) || 0)
              }
              min={0}
              required
              disabled={loading}
              className={errors.soldQuantity ? 'border-red-500' : ''}
            />
            {errors.soldQuantity && (
              <p className="mt-1 text-sm text-red-600">{errors.soldQuantity}</p>
            )}
          </div>

          <div>
            <Label htmlFor="purchasePrice">Purchase Price *</Label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="purchasePrice"
                type="number"
                placeholder="0.00"
                value={formData.purchasePrice}
                onChange={(e) =>
                  handleChange('purchasePrice', parseFloat(e.target.value) || 0)
                }
                min={0}
                step={0.01}
                required
                disabled={loading}
                className={`pl-8 ${errors.purchasePrice ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.purchasePrice && (
              <p className="mt-1 text-sm text-red-600">
                {errors.purchasePrice}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="sellingPrice">Selling Price *</Label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="sellingPrice"
                type="number"
                placeholder="0.00"
                value={formData.sellingPrice}
                onChange={(e) =>
                  handleChange('sellingPrice', parseFloat(e.target.value) || 0)
                }
                min={0}
                step={0.01}
                required
                disabled={loading}
                className={`pl-8 ${errors.sellingPrice ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.sellingPrice && (
              <p className="mt-1 text-sm text-red-600">{errors.sellingPrice}</p>
            )}
          </div>
        </div>
      </div>

      {/* Profit Margin Display */}
      {formData.purchasePrice > 0 &&
        formData.sellingPrice > formData.purchasePrice && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="font-medium text-green-800">
                  Profit per unit:
                </span>
                <span className="ml-1 text-green-700">
                  ${(formData.sellingPrice - formData.purchasePrice).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="font-medium text-green-800">Margin:</span>
                <span className="ml-1 text-green-700">
                  {(
                    ((formData.sellingPrice - formData.purchasePrice) /
                      formData.sellingPrice) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>
        )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 border-t pt-6">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading
            ? 'Saving...'
            : product
              ? 'Update Product'
              : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}
