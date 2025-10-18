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
import { storageService } from '@/lib/storage';
import { formatVND } from '@/lib/currency';
import { ImportPhaseSelector } from './ImportPhaseSelector';
import { ProfitDisplay } from './ProfitDisplay';
import { useAvailableImportPhases } from '../hooks/useAvailableImportPhases';

// Simple date formatter
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Form validation schema
const revenueFormSchema = z
  .object({
    productId: z.string().min(1, 'Product is required'),
    productVariantId: z.string().optional(),
    importPhaseId: z.string().optional(),
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
  })
  .refine(
    (data) => {
      // Validate import phase if provided
      if (data.importPhaseId && data.productId) {
        try {
          // Check if import phase exists and is available for the product
          const availablePhases = storageService.getAvailableImportPhases(
            data.productId
          );
          const selectedPhase = availablePhases.find(
            (phase) => phase.id === data.importPhaseId
          );

          if (!selectedPhase) {
            return false; // Import phase not found or not available for this product
          }

          return true;
        } catch (error) {
          return false; // Error accessing import phase data
        }
      }
      return true; // No import phase specified, validation passes
    },
    {
      message:
        'Selected import phase is not available or has insufficient quantity',
      path: ['importPhaseId'],
    }
  );

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
      importPhaseId: '',
      amount: '',
      quantity: '',
      salesChannel: '',
      saleDate: formatDate(new Date()),
      notes: '',
    },
  });

  const watchedProductId = watch('productId');

  // Get available import phases for the selected product
  const { availablePhases } = useAvailableImportPhases({
    productId: watchedProductId,
    enabled: !!watchedProductId,
  });

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
      setValue('importPhaseId', editingEntry.importPhaseId || '');
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
      // and handle empty importPhaseId
      const processedData = {
        ...data,
        productVariantId:
          data.productVariantId === 'none' ? '' : data.productVariantId,
        importPhaseId: data.importPhaseId || undefined,
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
                      <div className="flex flex-col items-start justify-start">
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

          {/* Import Phase Selection */}
          {watchedProductId && (
            <div className="space-y-2">
              <ImportPhaseSelector
                productId={watchedProductId}
                value={watch('importPhaseId') || ''}
                onChange={(value) => setValue('importPhaseId', value)}
                availablePhases={availablePhases}
              />
              {errors.importPhaseId && (
                <p className="text-sm text-red-500">
                  {errors.importPhaseId.message}
                </p>
              )}
              <div className="text-xs text-muted-foreground">
                Link this sale to a specific import phase for accurate profit
                calculation. Leave empty if import phase tracking is not needed.
              </div>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Price *</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
                VND
              </span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                className="pl-12 "
                {...register('amount')}
              />
            </div>

            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
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

          {/* Channel Fee Preview */}
          {(() => {
            const amount = watch('amount');
            const selectedChannelId = watch('salesChannel');

            if (amount && selectedChannelId && !isNaN(parseFloat(amount))) {
              const grossAmount = parseFloat(amount);
              const channelFee = storageService.calculateChannelFee(
                selectedChannelId,
                grossAmount
              );
              const netAmount = grossAmount - channelFee;
              const selectedChannel = salesChannels.find(
                (c) => c.id === selectedChannelId
              );

              if (channelFee > 0) {
                return (
                  <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                    <h4 className="mb-2 font-medium text-blue-900">
                      Fee Calculation - {selectedChannel?.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Gross Revenue:</span>
                        <span className="font-medium">
                          {formatVND(grossAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Channel Fee:</span>
                        <span className="font-medium text-red-600">
                          -{formatVND(channelFee)}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-between border-t border-blue-200 pt-1">
                        <span className="font-medium text-green-700">
                          Net Revenue:
                        </span>
                        <span className="font-bold text-green-600">
                          {formatVND(netAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            }
            return null;
          })()}

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

        {/* Profit Breakdown Section - Shows for existing entries with import phase data */}
        {editingEntry && editingEntry.importPhaseId && (
          <div className="mt-6 border-t pt-6">
            <h3 className="mb-4 text-lg font-semibold">Profit Analysis</h3>
            <ProfitDisplay
              entry={editingEntry}
              variant="detailed"
              showBreakdown={true}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
