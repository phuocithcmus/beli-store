/**
 * VariantInventoryManager Component
 * Manages inventory operations for product variants
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { storageService } from '@/lib/storage';
import type { ProductVariant } from '@/types';

const inventoryUpdateSchema = z.object({
  inventoryCount: z.number().min(0, 'Inventory count must be non-negative'),
  reservedCount: z.number().min(0, 'Reserved count must be non-negative'),
  soldCount: z.number().min(0, 'Sold count must be non-negative'),
});

type InventoryUpdateData = z.infer<typeof inventoryUpdateSchema>;

interface VariantInventoryManagerProps {
  variant: ProductVariant;
  onUpdate?: (updatedVariant: ProductVariant) => void;
  readOnly?: boolean;
}

export function VariantInventoryManager({
  variant,
  onUpdate,
  readOnly = false,
}: VariantInventoryManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<InventoryUpdateData>({
    resolver: zodResolver(inventoryUpdateSchema),
    defaultValues: {
      inventoryCount: variant.inventoryCount,
      reservedCount: variant.reservedCount,
      soldCount: variant.soldCount,
    },
  });

  const watchedValues = watch();
  const getAvailableInventory = (
    values: InventoryUpdateData = watchedValues
  ) => {
    return values.inventoryCount - values.reservedCount - values.soldCount;
  };

  const getStockStatus = (available: number) => {
    if (available <= 0) {
      return {
        status: 'out-of-stock',
        label: 'Out of Stock',
        color: 'bg-red-100 text-red-800',
      };
    }
    if (available <= 5) {
      return {
        status: 'low-stock',
        label: 'Low Stock',
        color: 'bg-yellow-100 text-yellow-800',
      };
    }
    return {
      status: 'in-stock',
      label: 'In Stock',
      color: 'bg-green-100 text-green-800',
    };
  };

  const onSubmit = async (data: InventoryUpdateData) => {
    try {
      setLoading(true);
      const updatedVariant = storageService.updateProductVariant(
        variant.id,
        data
      );
      onUpdate?.(updatedVariant);
      setIsEditing(false);
      reset(data); // Reset form with new values
    } catch (error) {
      console.error('Error updating variant inventory:', error);
      alert('Failed to update inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset({
      inventoryCount: variant.inventoryCount,
      reservedCount: variant.reservedCount,
      soldCount: variant.soldCount,
    });
    setIsEditing(false);
  };

  const available = getAvailableInventory();
  const stockStatus = getStockStatus(available);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Inventory Management</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
            {!readOnly && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage inventory levels for {variant.sku}
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Current Status Display */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-sm text-muted-foreground">Total Inventory</p>
              <p className="text-2xl font-bold">
                {isEditing
                  ? watchedValues.inventoryCount
                  : variant.inventoryCount}
              </p>
            </div>
            <div className="rounded-lg bg-orange-50 p-3 text-center">
              <p className="text-sm text-muted-foreground">Reserved</p>
              <p className="text-2xl font-bold text-orange-600">
                {isEditing
                  ? watchedValues.reservedCount
                  : variant.reservedCount}
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-sm text-muted-foreground">Sold</p>
              <p className="text-2xl font-bold text-green-600">
                {isEditing ? watchedValues.soldCount : variant.soldCount}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <p className="text-sm text-muted-foreground">Available</p>
              <p
                className={`text-2xl font-bold ${
                  available <= 0
                    ? 'text-red-600'
                    : available <= 5
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                }`}
              >
                {available}
              </p>
            </div>
          </div>

          {/* Inventory Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Inventory Allocation</span>
              <span>
                {(isEditing
                  ? watchedValues.inventoryCount
                  : variant.inventoryCount) > 0
                  ? Math.round(
                      (((isEditing
                        ? watchedValues.reservedCount
                        : variant.reservedCount) +
                        (isEditing
                          ? watchedValues.soldCount
                          : variant.soldCount)) /
                        (isEditing
                          ? watchedValues.inventoryCount
                          : variant.inventoryCount)) *
                        100
                    )
                  : 0}
                % allocated
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="flex h-full">
                <div
                  className="bg-green-500"
                  style={{
                    width:
                      (isEditing
                        ? watchedValues.inventoryCount
                        : variant.inventoryCount) > 0
                        ? `${
                            ((isEditing
                              ? watchedValues.soldCount
                              : variant.soldCount) /
                              (isEditing
                                ? watchedValues.inventoryCount
                                : variant.inventoryCount)) *
                            100
                          }%`
                        : '0%',
                  }}
                />
                <div
                  className="bg-orange-500"
                  style={{
                    width:
                      (isEditing
                        ? watchedValues.inventoryCount
                        : variant.inventoryCount) > 0
                        ? `${
                            ((isEditing
                              ? watchedValues.reservedCount
                              : variant.reservedCount) /
                              (isEditing
                                ? watchedValues.inventoryCount
                                : variant.inventoryCount)) *
                            100
                          }%`
                        : '0%',
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>🟢 Sold</span>
              <span>🟠 Reserved</span>
              <span>⚪ Available</span>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="space-y-4 rounded-lg bg-muted/25 p-4">
              <h4 className="font-medium">Update Inventory Levels</h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="inventoryCount">Total Inventory</Label>
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

              {/* Validation Warnings */}
              {available < 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-600">
                    ⚠️ Warning: Available inventory is negative ({available}).
                    Reserved + Sold exceeds total inventory.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isDirty || loading || available < 0}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {/* Historical Information */}
          <div className="border-t pt-4">
            <h4 className="mb-2 font-medium">Last Updated</h4>
            <p className="text-sm text-muted-foreground">
              {variant.updatedAt.toLocaleString()}
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
