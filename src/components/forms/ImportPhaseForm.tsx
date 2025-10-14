'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ImportPhaseFormSchema,
  type ImportPhaseFormData,
} from '@/lib/validations/schemas';
import { FormField, FormTextarea } from './FormFields';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImportPhaseFormProps {
  initialData?: Partial<ImportPhaseFormData>;
  onSubmit: (data: ImportPhaseFormData) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitText?: string;
}

export function ImportPhaseForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitText = 'Create Import Phase',
}: ImportPhaseFormProps) {
  const { toast } = useToast();

  const form = useForm<ImportPhaseFormData>({
    resolver: zodResolver(ImportPhaseFormSchema),
    defaultValues: {
      code: initialData?.code || '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
      description: initialData?.description || '',
    },
  });

  const handleSubmit = async (data: ImportPhaseFormData) => {
    try {
      await onSubmit(data);
      toast({
        title: 'Success',
        description: 'Import phase saved successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to save import phase',
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
            label="Phase Code"
            placeholder="e.g., IMP001"
            required
            disabled={isLoading}
          />

          <FormField
            name="date"
            label="Import Date"
            type="date"
            required
            disabled={isLoading}
          />
        </div>

        <FormTextarea
          name="description"
          label="Description"
          placeholder="Optional description of this import phase..."
          disabled={isLoading}
          rows={3}
        />

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
            {isLoading ? 'Creating...' : submitText}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
