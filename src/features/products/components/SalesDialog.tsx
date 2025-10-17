/**
 * Sales Dialog Component
 * Dialog for recording sales transactions for product variants
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  className,
}: SalesDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${className || ''}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-lg font-semibold">Record Sale</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
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
            <label
              htmlFor="variantId"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Product Variant *
            </label>
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
                  <span className="font-medium">Suggested Price:</span> $
                  {selectedVariant.sellingPrice.toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <div>
            <label
              htmlFor="quantity"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Quantity *
            </label>
            <input
              {...register('quantity', { valueAsNumber: true })}
              type="number"
              min="1"
              max={
                selectedVariant
                  ? calculateAvailableInventory(selectedVariant)
                  : undefined
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label
              htmlFor="unitPrice"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Unit Price *
            </label>
            <input
              {...register('unitPrice', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0.01"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                Total Amount: ${totalAmount.toFixed(2)}
              </div>
            </div>
          )}

          {/* Sale Date */}
          <div>
            <label
              htmlFor="saleDate"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Sale Date *
            </label>
            <input
              {...register('saleDate')}
              type="date"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label
              htmlFor="customerId"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Customer ID
            </label>
            <input
              {...register('customerId')}
              type="text"
              placeholder="Optional customer identifier"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Optional sale notes..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={
                isSubmitting ||
                (availabilityInfo
                  ? !availabilityInfo.validation.isValid
                  : false)
              }
            >
              {isSubmitting ? 'Recording...' : 'Record Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
