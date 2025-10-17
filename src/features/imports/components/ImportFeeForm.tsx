/**
 * ImportFeeForm Component
 * Form for creating and editing import fees
 * Part of P1 - Import Fee Management feature
 */

'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { formatVND, parseVND } from '@/lib/currency';
import type { ImportFee, ImportFeeFormData } from '@/types';

interface ImportFeeFormProps {
  importFee?: ImportFee;
  onSubmit: (data: ImportFeeFormData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

const FEE_TYPES = [
  { value: 'shipping', label: 'Shipping Fee' },
  { value: 'customs', label: 'Customs Fee' },
  { value: 'handling', label: 'Handling Fee' },
  { value: 'storage', label: 'Storage Fee' },
  { value: 'other', label: 'Other Fee' },
] as const;

export function ImportFeeForm({
  importFee,
  onSubmit,
  onCancel,
  loading = false,
}: ImportFeeFormProps) {
  const [formData, setFormData] = useState<ImportFeeFormData>({
    type: importFee?.type || 'shipping',
    name: importFee?.name || '',
    amount: importFee ? formatVND(importFee.amount, { showSymbol: false }) : '',
    description: importFee?.description || '',
  });

  const [errors, setErrors] = useState<Partial<ImportFeeFormData>>({});

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<ImportFeeFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Fee name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Fee name must be 100 characters or less';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const numAmount = parseVND(formData.amount);
      if (isNaN(numAmount) || numAmount < 0) {
        newErrors.amount = 'Amount must be a valid positive number';
      }
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
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

  const handleAmountChange = (value: string) => {
    // Allow only numbers and commas for VND formatting
    const cleanValue = value.replace(/[^\d,]/g, '');
    const numValue = parseVND(cleanValue);

    if (!isNaN(numValue)) {
      setFormData((prev) => ({
        ...prev,
        amount: numValue.toString(),
      }));
    } else {
      setFormData((prev) => ({ ...prev, amount: cleanValue }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Fee Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Fee Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value: ImportFeeFormData['type']) =>
              setFormData((prev) => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Select fee type" />
            </SelectTrigger>
            <SelectContent>
              {FEE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fee Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Fee Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g., International Shipping"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (VND) *</Label>
        <div className="relative">
          <Input
            id="amount"
            value={formData.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="e.g., 500,000"
            className={`pr-12 ${errors.amount ? 'border-red-500' : ''}`}
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-sm text-gray-500">VND</span>
          </div>
        </div>
        {errors.amount && (
          <p className="text-sm text-red-500">{errors.amount}</p>
        )}
        {formData.amount && !errors.amount && (
          <p className="text-sm text-gray-600">
            Amount: {formatVND(parseVND(formData.amount))}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Optional description for this fee..."
          rows={3}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description}</p>
        )}
        <p className="text-sm text-gray-500">
          {(formData.description || '').length}/500 characters
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
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
          {loading ? 'Saving...' : importFee ? 'Update Fee' : 'Add Fee'}
        </Button>
      </div>
    </form>
  );
}
