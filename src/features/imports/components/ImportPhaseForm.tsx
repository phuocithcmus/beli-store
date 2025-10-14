/**
 * ImportPhaseForm Component
 * Form for creating and editing import phases
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ImportPhase } from '@/types';

interface ImportPhaseFormData {
  code: string;
  date: string; // ISO date string for form input
  description: string;
}

interface ImportPhaseFormProps {
  importPhase?: ImportPhase;
  onSubmit: (data: ImportPhaseFormData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function ImportPhaseForm({
  importPhase,
  onSubmit,
  onCancel,
  loading = false,
}: ImportPhaseFormProps) {
  const [formData, setFormData] = useState<ImportPhaseFormData>({
    code: importPhase?.code || '',
    date: importPhase?.date ? importPhase.date.toISOString().split('T')[0] : '',
    description: importPhase?.description || '',
  });

  const [errors, setErrors] = useState<Partial<ImportPhaseFormData>>({});

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<ImportPhaseFormData> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Import phase code is required';
    } else if (!/^[A-Z0-9]{3,}$/.test(formData.code)) {
      newErrors.code =
        'Code must be at least 3 characters, uppercase letters and numbers only';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field: keyof ImportPhaseFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
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
            <Label htmlFor="code">Import Phase Code *</Label>
            <Input
              id="code"
              type="text"
              placeholder="e.g., IMP001"
              value={formData.code}
              onChange={(e) =>
                handleChange('code', e.target.value.toUpperCase())
              }
              disabled={loading || !!importPhase} // Disable code editing for existing phases
              className={errors.code ? 'border-red-500' : ''}
              required
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code}</p>
            )}
          </div>

          <div>
            <Label htmlFor="date">Import Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              disabled={loading}
              className={errors.date ? 'border-red-500' : ''}
              required
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="Brief description of this import phase"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Import Phase Information (for editing existing phases) */}
        {importPhase && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Import Phase Details</h3>

            <div className="space-y-2 rounded-lg bg-muted/50 p-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Status:</span>
                <span
                  className={`rounded-full px-2 py-1 text-sm font-medium ${
                    importPhase.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {importPhase.status}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Items:</span>
                <span className="text-sm">{importPhase.totalItems}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Cost:</span>
                <span className="font-mono text-sm">
                  ${importPhase.totalCost.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm font-medium">Created:</span>
                <span className="text-sm">
                  {importPhase.createdAt.toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm font-medium">Updated:</span>
                <span className="text-sm">
                  {importPhase.updatedAt.toLocaleDateString()}
                </span>
              </div>
            </div>

            {importPhase.status === 'completed' && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This import phase is completed and
                  cannot be modified.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 border-t pt-4">
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
        <Button
          type="submit"
          disabled={loading || importPhase?.status === 'completed'}
        >
          {loading
            ? 'Saving...'
            : importPhase
              ? 'Update Import Phase'
              : 'Create Import Phase'}
        </Button>
      </div>
    </form>
  );
}
