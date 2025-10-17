/**
 * ProductVariantForm Component
 * Form for creating and editing product variants with SKU generation
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateSKU } from '@/lib/utils/skuGenerator';
import { validateVariantUniqueness } from '@/lib/utils/variantValidation';
import { storageService } from '@/lib/storage';
import type { ProductVariant, Product } from '@/types';

const variantSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  color: z.string().min(1, 'Color is required'),
  size: z.enum(['S', 'M', 'L', 'XL'], {
    required_error: 'Size is required',
  }),
  form: z.enum(['oversized', 'fit'], {
    required_error: 'Form is required',
  }),
  inventoryCount: z.number().min(0, 'Inventory count must be non-negative'),
  reservedCount: z.number().min(0, 'Reserved count must be non-negative'),
  soldCount: z.number().min(0, 'Sold count must be non-negative'),
});

type VariantFormData = z.infer<typeof variantSchema>;

interface ProductVariantFormProps {
  productId: string;
  variant?: ProductVariant;
  onSubmit: (variant: ProductVariant) => void;
  onCancel: () => void;
}

export function ProductVariantForm({
  productId,
  variant,
  onSubmit,
  onCancel,
}: ProductVariantFormProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [generatedSKU, setGeneratedSKU] = useState('');
  const [skuError, setSKUError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      productId,
      color: variant?.color || '',
      size: variant?.size || 'M',
      form: variant?.form || 'fit',
      inventoryCount: variant?.inventoryCount || 0,
      reservedCount: variant?.reservedCount || 0,
      soldCount: variant?.soldCount || 0,
    },
  });

  const watchedFields = watch(['color', 'size', 'form']);

  useEffect(() => {
    // Load product data
    const productData = storageService.getProduct(productId);
    setProduct(productData || null);
  }, [productId]);

  useEffect(() => {
    // Generate SKU when variant details change
    if (product && watchedFields[0] && watchedFields[1] && watchedFields[2]) {
      const sku = generateSKU({
        productCode: product.code,
        color: watchedFields[0],
        size: watchedFields[1],
        form: watchedFields[2],
      });
      setGeneratedSKU(sku);

      // Validate SKU uniqueness (skip if editing existing variant)
      if (!variant || sku !== variant.sku) {
        const validationResult = validateVariantUniqueness(
          {
            productId,
            color: watchedFields[0],
            size: watchedFields[1],
            form: watchedFields[2],
          },
          storageService.getProductVariants()
        );
        setSKUError(
          validationResult.isValid
            ? ''
            : validationResult.error ||
                'This variant combination already exists'
        );
      } else {
        setSKUError('');
      }
    }
  }, [product, watchedFields, variant, productId]);

  const onFormSubmit = async (data: VariantFormData) => {
    try {
      const variantData = {
        ...data,
        sku: generatedSKU,
      };

      let savedVariant: ProductVariant;

      if (variant) {
        // Update existing variant
        savedVariant = storageService.updateProductVariant(
          variant.id,
          variantData
        );
      } else {
        // Create new variant
        savedVariant = storageService.saveProductVariant(variantData);
      }

      onSubmit(savedVariant);
    } catch (error) {
      console.error('Error saving variant:', error);
      setSKUError(
        error instanceof Error ? error.message : 'Failed to save variant'
      );
    }
  };

  if (!product) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="product">Product</Label>
          <Input
            id="product"
            value={`${product.code} - ${product.name}`}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              {...register('color')}
              placeholder="e.g., Red, Blue, Black"
            />
            {errors.color && (
              <p className="mt-1 text-sm text-red-600">
                {errors.color.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="size">Size</Label>
            <select
              id="size"
              {...register('size')}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="S">Small (S)</option>
              <option value="M">Medium (M)</option>
              <option value="L">Large (L)</option>
              <option value="XL">Extra Large (XL)</option>
            </select>
            {errors.size && (
              <p className="mt-1 text-sm text-red-600">{errors.size.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="form">Form</Label>
            <select
              id="form"
              {...register('form')}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="fit">Fit</option>
              <option value="oversized">Oversized</option>
            </select>
            {errors.form && (
              <p className="mt-1 text-sm text-red-600">{errors.form.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="sku">Generated SKU</Label>
          <Input
            id="sku"
            value={generatedSKU}
            disabled
            className="bg-muted font-mono"
          />
          {skuError && <p className="mt-1 text-sm text-red-600">{skuError}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="inventoryCount">Inventory Count</Label>
            <Input
              id="inventoryCount"
              type="number"
              min="0"
              {...register('inventoryCount', { valueAsNumber: true })}
            />
            {errors.inventoryCount && (
              <p className="mt-1 text-sm text-red-600">
                {errors.inventoryCount.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reservedCount">Reserved Count</Label>
            <Input
              id="reservedCount"
              type="number"
              min="0"
              {...register('reservedCount', { valueAsNumber: true })}
            />
            {errors.reservedCount && (
              <p className="mt-1 text-sm text-red-600">
                {errors.reservedCount.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="soldCount">Sold Count</Label>
            <Input
              id="soldCount"
              type="number"
              min="0"
              {...register('soldCount', { valueAsNumber: true })}
            />
            {errors.soldCount && (
              <p className="mt-1 text-sm text-red-600">
                {errors.soldCount.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !!skuError}>
          {isSubmitting
            ? 'Saving...'
            : variant
              ? 'Update Variant'
              : 'Create Variant'}
        </Button>
      </div>
    </form>
  );
}
