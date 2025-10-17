'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ProductFormSchema,
  type ProductFormData,
} from '@/lib/validations/schemas';
import { FormField, FormSelect } from './FormFields';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitText?: string;
}

const categoryOptions = [
  { value: 'shirt', label: 'Shirt' },
  { value: 'pants', label: 'Pants' },
];

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitText = 'Save Product',
}: ProductFormProps) {
  const { toast } = useToast();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      code: initialData?.code || '',
      name: initialData?.name || '',
      category: initialData?.category || 'shirt',
      remainingQuantity: initialData?.remainingQuantity || 0,
      purchasePrice: initialData?.purchasePrice || 0,
      sellingPrice: initialData?.sellingPrice || 0,
    },
  });

  const handleSubmit = async (data: ProductFormData) => {
    try {
      await onSubmit(data);
      toast({
        title: 'Success',
        description: 'Product saved successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to save product',
        variant: 'destructive',
      });
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            name="code"
            label="Product Code"
            placeholder="e.g., SH001"
            required
            disabled={isLoading}
          />

          <FormSelect
            name="category"
            label="Category"
            options={categoryOptions}
            required
            disabled={isLoading}
          />

          <FormField
            name="name"
            label="Product Name"
            placeholder="e.g., Blue Cotton Shirt"
            required
            disabled={isLoading}
            className="md:col-span-2"
          />

          <FormField
            name="remainingQuantity"
            label="Initial Quantity"
            type="number"
            placeholder="0"
            required
            disabled={isLoading}
          />

          <div className="space-y-4">
            <FormField
              name="purchasePrice"
              label="Purchase Price (VND)"
              type="number"
              step="1"
              placeholder="0"
              required
              disabled={isLoading}
            />

            <FormField
              name="sellingPrice"
              label="Selling Price (VND)"
              type="number"
              step="1"
              placeholder="0"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : submitText}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
