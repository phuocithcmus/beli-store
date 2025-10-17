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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RevenueDialogProps } from '@/features/revenue/types/revenue';
import type { ProductVariant } from '@/types';

// Simple date formatter
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Form validation schema
const revenueFormSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  productVariantId: z.string().optional(),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  quantity: z
    .string()
    .min(1, 'Quantity is required')
    .regex(/^\d+$/, 'Quantity must be a whole number'),
  salesChannel: z.string().min(1, 'Sales channel is required'),
  saleDate: z.string().min(1, 'Sale date is required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof revenueFormSchema>;

/**
 * Dialog component for creating and editing revenue entries
 * Supports both new revenue creation and editing existing entries
 */
export function RevenueDialog({
  isOpen,
  onClose,
  onSave,
  editingEntry,
  products,
  salesChannels,
}: RevenueDialogProps) {
  const [saving, setSaving] = useState(false);
  const [availableVariants, setAvailableVariants] = useState<ProductVariant[]>(
    []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(revenueFormSchema),
    defaultValues: {
      productId: '',
      productVariantId: 'none',
      amount: '',
      quantity: '',
      salesChannel: '',
      saleDate: formatDate(new Date()),
      notes: '',
    },
  });

  const watchedProductId = watch('productId');

  // Update available variants when product changes
  useEffect(() => {
    if (watchedProductId) {
      const product = products.find((p) => p.id === watchedProductId);
      if (product && product.variants) {
        setAvailableVariants(product.variants);
      } else {
        setAvailableVariants([]);
      }
      // Reset variant selection when product changes
      setValue('productVariantId', 'none');
    }
  }, [watchedProductId, products, setValue]);

  // Populate form when editing
  useEffect(() => {
    if (editingEntry) {
      setValue('productId', editingEntry.productId);
      setValue('productVariantId', editingEntry.productVariantId || 'none');
      setValue('amount', editingEntry.amount.toString());
      setValue('quantity', editingEntry.quantity.toString());
      setValue('salesChannel', editingEntry.salesChannel);
      setValue('saleDate', formatDate(editingEntry.saleDate));
      setValue('notes', editingEntry.notes || '');
    }
  }, [editingEntry, setValue]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setAvailableVariants([]);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);

      // Convert "none" back to empty string for productVariantId
      const processedData = {
        ...data,
        productVariantId:
          data.productVariantId === 'none' ? '' : data.productVariantId,
      };

      await onSave(processedData);
      onClose();
    } catch (error) {
      console.error('Failed to save revenue entry:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingEntry ? 'Edit Revenue Entry' : 'Add Revenue Entry'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* No Products Warning */}
          {(!products || products.length === 0) && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex">
                <div className="text-sm text-yellow-700">
                  <strong>No products available!</strong>
                  <p className="mt-1">
                    You need to add products before creating revenue entries.{' '}
                    <a
                      href="/products"
                      className="underline hover:text-yellow-800"
                      onClick={(e) => {
                        e.preventDefault();
                        onClose();
                        window.location.href = '/products';
                      }}
                    >
                      Go to Products page
                    </a>{' '}
                    to add products first.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="productId">Product</Label>
            <Select
              value={watchedProductId || ''}
              onValueChange={(value) => {
                setValue('productId', value);
                setValue('productVariantId', 'none'); // Reset variant when product changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.length === 0 ? (
                  <SelectItem value="no-products" disabled>
                    No products available
                  </SelectItem>
                ) : (
                  products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.productId && (
              <p className="text-sm text-red-500">{errors.productId.message}</p>
            )}
          </div>

          {/* Product Variant Selection */}
          {availableVariants.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="productVariantId">Product Variant</Label>
              <Select
                value={watch('productVariantId') || 'none'}
                onValueChange={(value) => setValue('productVariantId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a variant (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific variant</SelectItem>
                  {availableVariants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {variant.color} / {variant.size} / {variant.form}
                        </span>
                        <span className="text-xs text-gray-500">
                          SKU: {variant.sku} • Available:{' '}
                          {variant.inventoryCount}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Variant Info */}
          {availableVariants.length > 0 && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
              This product has {availableVariants.length} variant(s). Select a
              specific variant for more accurate tracking or leave unselected
              for general product sales.
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="text"
              placeholder="0.00"
              {...register('amount')}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="text"
              placeholder="1"
              {...register('quantity')}
            />
            {errors.quantity && (
              <p className="text-sm text-red-600">{errors.quantity.message}</p>
            )}
          </div>

          {/* Sales Channel */}
          <div className="space-y-2">
            <Label htmlFor="salesChannel">Sales Channel *</Label>
            <Select
              value={watch('salesChannel') || ''}
              onValueChange={(value) => setValue('salesChannel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a sales channel" />
              </SelectTrigger>
              <SelectContent>
                {salesChannels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.salesChannel && (
              <p className="text-sm text-red-600">
                {errors.salesChannel.message}
              </p>
            )}
          </div>

          {/* Sale Date */}
          <div className="space-y-2">
            <Label htmlFor="saleDate">Sale Date *</Label>
            <Input id="saleDate" type="date" {...register('saleDate')} />
            {errors.saleDate && (
              <p className="text-sm text-red-600">{errors.saleDate.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              placeholder="Additional notes about this sale..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('notes')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !products || products.length === 0}
              className="flex-1"
            >
              {saving ? 'Saving...' : editingEntry ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
