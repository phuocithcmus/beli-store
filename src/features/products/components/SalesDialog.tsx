/**
 * Sales Dialog Component
 * Dialog for recording sales transactions for product variants
 * Updated to use proper Dialog component and VND currency
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCurrency } from '@/hooks/useCurrency';
import type { ProductVariant, SaleTransaction } from '@/types';
import {
  calculateAvailableInventory,
  validateSaleQuantity,
} from '@/lib/utils/inventoryCalculations';

// Validation schema
const saleFormSchema = z.object({
  variantId: z.string().min(1, 'Variant is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0.01, 'Unit price must be greater than 0'),
  saleDate: z.string().min(1, 'Sale date is required'),
  customerId: z.string().optional(),
  notes: z.string().optional(),
});

type SaleFormData = z.infer<typeof saleFormSchema>;

interface SalesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleRecorded: (sale: SaleTransaction) => void;
  variants: ProductVariant[];
  selectedVariantId?: string;
  className?: string;
}

export function SalesDialog({
  isOpen,
  onClose,
  onSaleRecorded,
  variants,
  selectedVariantId,
  className: _className, // eslint-disable-line @typescript-eslint/no-unused-vars
}: SalesDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      variantId: selectedVariantId || '',
      quantity: 1,
      unitPrice: 0,
      saleDate: new Date().toISOString().split('T')[0],
      customerId: '',
      notes: '',
    },
  });

  const watchedVariantId = watch('variantId');
  const watchedQuantity = watch('quantity');
  const watchedUnitPrice = watch('unitPrice');

  // Get selected variant
  const selectedVariant = variants.find((v) => v.id === watchedVariantId);

  // Calculate availability and validation
  const availabilityInfo = selectedVariant
    ? (() => {
        const available = calculateAvailableInventory(selectedVariant);
        const validation = validateSaleQuantity(
          selectedVariant,
          watchedQuantity || 0
        );
        return { available, validation };
      })()
    : null;

  // Calculate total amount
  const totalAmount = (watchedQuantity || 0) * (watchedUnitPrice || 0);

  // Set default selling price when variant changes
  React.useEffect(() => {
    if (selectedVariant?.sellingPrice) {
      setValue('unitPrice', selectedVariant.sellingPrice);
    }
  }, [selectedVariant, setValue]);

  const onSubmit = useCallback(
    async (data: SaleFormData) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const selectedVar = variants.find((v) => v.id === data.variantId);
        if (!selectedVar) {
          throw new Error('Selected variant not found');
        }

        // Validate inventory
        const validation = validateSaleQuantity(selectedVar, data.quantity);
        if (!validation.isValid) {
          throw new Error(validation.errorMessage);
        }

        const transaction: SaleTransaction = {
          variantId: data.variantId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          totalAmount: data.quantity * data.unitPrice,
          saleDate: new Date(data.saleDate),
          customerId: data.customerId || undefined,
          notes: data.notes || undefined,
        };

        onSaleRecorded(transaction);
        reset();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to record sale');
      } finally {
        setIsSubmitting(false);
      }
    },
    [variants, onSaleRecorded, reset, onClose]
  );

  const handleClose = useCallback(() => {
    reset();
    setError(null);
    onClose();
  }, [reset, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] w-full max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Sale</DialogTitle>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Variant Selection */}
          <div>
            <Label htmlFor="variantId">Product Variant *</Label>
            <select
              {...register('variantId')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="">Select a variant</option>
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.sku} - {variant.color} • {variant.size} •{' '}
                  {variant.form}
                </option>
              ))}
            </select>
            {errors.variantId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.variantId.message}
              </p>
            )}
          </div>

          {/* Variant Info */}
          {selectedVariant && availabilityInfo && (
            <div className="rounded-md bg-gray-50 p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Available:</span>{' '}
                  {availabilityInfo.available}
                </div>
                <div>
                  <span className="font-medium">Reserved:</span>{' '}
                  {selectedVariant.reservedCount}
                </div>
                <div>
                  <span className="font-medium">Total Stock:</span>{' '}
                  {selectedVariant.inventoryCount}
                </div>
                <div>
                  <span className="font-medium">Sold:</span>{' '}
                  {selectedVariant.soldCount}
                </div>
              </div>
              {selectedVariant.sellingPrice && (
                <div className="mt-2">
                  <span className="font-medium">Suggested Price:</span>{' '}
                  {formatCurrency(selectedVariant.sellingPrice)}
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              {...register('quantity', { valueAsNumber: true })}
              type="number"
              min="1"
              max={
                selectedVariant
                  ? calculateAvailableInventory(selectedVariant)
                  : undefined
              }
              disabled={isSubmitting}
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">
                {errors.quantity.message}
              </p>
            )}
            {availabilityInfo && !availabilityInfo.validation.isValid && (
              <p className="mt-1 text-sm text-red-600">
                {availabilityInfo.validation.errorMessage}
              </p>
            )}
          </div>

          {/* Unit Price */}
          <div>
            <Label htmlFor="unitPrice">Unit Price *</Label>
            <Input
              {...register('unitPrice', { valueAsNumber: true })}
              type="number"
              step="1000"
              min="1000"
              placeholder="Enter price in VND"
              disabled={isSubmitting}
            />
            {errors.unitPrice && (
              <p className="mt-1 text-sm text-red-600">
                {errors.unitPrice.message}
              </p>
            )}
          </div>

          {/* Total Amount Display */}
          {totalAmount > 0 && (
            <div className="rounded-md bg-blue-50 p-3">
              <div className="text-sm font-medium text-blue-800">
                Total Amount: {formatCurrency(totalAmount)}
              </div>
            </div>
          )}

          {/* Sale Date */}
          <div>
            <Label htmlFor="saleDate">Sale Date *</Label>
            <Input
              {...register('saleDate')}
              type="date"
              disabled={isSubmitting}
            />
            {errors.saleDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.saleDate.message}
              </p>
            )}
          </div>

          {/* Customer ID */}
          <div>
            <Label htmlFor="customerId">Customer ID</Label>
            <Input
              {...register('customerId')}
              type="text"
              placeholder="Optional customer identifier"
              disabled={isSubmitting}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input
              {...register('notes')}
              placeholder="Optional sale notes..."
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (availabilityInfo
                  ? !availabilityInfo.validation.isValid
                  : false)
              }
            >
              {isSubmitting ? 'Recording...' : 'Record Sale'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
