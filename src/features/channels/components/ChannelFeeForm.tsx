/**
 * ChannelFeeForm Component
 * Form for creating and editing channel fee structures
 * Part of P2 - Sales Channel Fee Configuration feature
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
import { formatVND, parseVND } from '@/lib/currency';
import type {
  ChannelFeeStructure,
  ChannelFeeFormData,
  SalesChannel,
} from '@/types';

interface ChannelFeeFormProps {
  channelFeeStructure?: ChannelFeeStructure;
  salesChannels: SalesChannel[];
  onSubmit: (data: ChannelFeeFormData & { salesChannelId: string }) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function ChannelFeeForm({
  channelFeeStructure,
  salesChannels,
  onSubmit,
  onCancel,
  loading = false,
}: ChannelFeeFormProps) {
  const [formData, setFormData] = useState<
    ChannelFeeFormData & { salesChannelId: string }
  >({
    salesChannelId: channelFeeStructure?.salesChannelId || '',
    percentageRate: channelFeeStructure?.percentageRate?.toString() || '0',
    fixedFee: channelFeeStructure
      ? formatVND(channelFeeStructure.fixedFee, { showSymbol: false })
      : '0',
    minimumFee: channelFeeStructure?.minimumFee
      ? formatVND(channelFeeStructure.minimumFee, { showSymbol: false })
      : '',
    maximumFee: channelFeeStructure?.maximumFee
      ? formatVND(channelFeeStructure.maximumFee, { showSymbol: false })
      : '',
  });

  const [errors, setErrors] = useState<
    Partial<ChannelFeeFormData & { salesChannelId: string }>
  >({});

  // Available sales channels (exclude those that already have fee structures)
  const availableChannels = salesChannels.filter(
    (channel) =>
      channel.isActive &&
      (!channelFeeStructure || // Creating new
        channel.id === channelFeeStructure.salesChannelId) // Editing existing
  );

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<ChannelFeeFormData & { salesChannelId: string }> =
      {};

    if (!formData.salesChannelId) {
      newErrors.salesChannelId = 'Please select a sales channel';
    }

    const percentageRate = parseFloat(formData.percentageRate);
    if (isNaN(percentageRate) || percentageRate < 0 || percentageRate > 100) {
      newErrors.percentageRate = 'Percentage rate must be between 0 and 100';
    }

    const fixedFee = parseVND(formData.fixedFee);
    if (isNaN(fixedFee) || fixedFee < 0) {
      newErrors.fixedFee = 'Fixed fee must be a valid positive number';
    }

    if (formData.minimumFee) {
      const minFee = parseVND(formData.minimumFee);
      if (isNaN(minFee) || minFee < 0) {
        newErrors.minimumFee = 'Minimum fee must be a valid positive number';
      }
    }

    if (formData.maximumFee) {
      const maxFee = parseVND(formData.maximumFee);
      if (isNaN(maxFee) || maxFee < 0) {
        newErrors.maximumFee = 'Maximum fee must be a valid positive number';
      }
    }

    // Validate min <= max
    if (formData.minimumFee && formData.maximumFee) {
      const minFee = parseVND(formData.minimumFee);
      const maxFee = parseVND(formData.maximumFee);
      if (!isNaN(minFee) && !isNaN(maxFee) && minFee > maxFee) {
        newErrors.maximumFee = 'Maximum fee cannot be less than minimum fee';
      }
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

  const handleVNDInput = (field: keyof ChannelFeeFormData, value: string) => {
    // Remove any non-numeric characters except commas
    const cleanValue = value.replace(/[^0-9,]/g, '');

    // Try to parse and reformat if it's a valid number
    const numValue = parseVND(cleanValue);
    if (!isNaN(numValue)) {
      setFormData((prev) => ({
        ...prev,
        [field]: formatVND(numValue, { showSymbol: false }),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: cleanValue }));
    }
  };

  const selectedChannel = salesChannels.find(
    (c) => c.id === formData.salesChannelId
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Sales Channel Selection */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="salesChannelId">Sales Channel *</Label>
          <Select
            value={formData.salesChannelId}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, salesChannelId: value }))
            }
            disabled={!!channelFeeStructure} // Can't change channel when editing
          >
            <SelectTrigger id="salesChannelId">
              <SelectValue placeholder="Select a sales channel" />
            </SelectTrigger>
            <SelectContent>
              {availableChannels.map((channel) => (
                <SelectItem key={channel.id} value={channel.id}>
                  <div className="flex items-center gap-2">
                    <span>{channel.name}</span>
                    <span className="text-xs capitalize text-gray-500">
                      ({channel.type})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.salesChannelId && (
            <p className="text-sm text-red-500">{errors.salesChannelId}</p>
          )}
        </div>

        {/* Percentage Rate */}
        <div className="space-y-2">
          <Label htmlFor="percentageRate">Percentage Rate (%)</Label>
          <Input
            id="percentageRate"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.percentageRate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                percentageRate: e.target.value,
              }))
            }
            placeholder="e.g., 3.5"
            className={errors.percentageRate ? 'border-red-500' : ''}
          />
          {errors.percentageRate && (
            <p className="text-sm text-red-500">{errors.percentageRate}</p>
          )}
          <p className="text-sm text-gray-500">
            Percentage of transaction amount
          </p>
        </div>

        {/* Fixed Fee */}
        <div className="space-y-2">
          <Label htmlFor="fixedFee">Fixed Fee (VND)</Label>
          <Input
            id="fixedFee"
            type="text"
            value={formData.fixedFee}
            onChange={(e) => handleVNDInput('fixedFee', e.target.value)}
            placeholder="e.g., 2,000"
            className={errors.fixedFee ? 'border-red-500' : ''}
          />
          {errors.fixedFee && (
            <p className="text-sm text-red-500">{errors.fixedFee}</p>
          )}
          <p className="text-sm text-gray-500">Fixed amount per transaction</p>
        </div>

        {/* Minimum Fee */}
        <div className="space-y-2">
          <Label htmlFor="minimumFee">Minimum Fee (VND)</Label>
          <Input
            id="minimumFee"
            type="text"
            value={formData.minimumFee || ''}
            onChange={(e) => handleVNDInput('minimumFee', e.target.value)}
            placeholder="Optional minimum fee"
            className={errors.minimumFee ? 'border-red-500' : ''}
          />
          {errors.minimumFee && (
            <p className="text-sm text-red-500">{errors.minimumFee}</p>
          )}
          <p className="text-sm text-gray-500">Optional minimum fee amount</p>
        </div>

        {/* Maximum Fee */}
        <div className="space-y-2">
          <Label htmlFor="maximumFee">Maximum Fee (VND)</Label>
          <Input
            id="maximumFee"
            type="text"
            value={formData.maximumFee || ''}
            onChange={(e) => handleVNDInput('maximumFee', e.target.value)}
            placeholder="Optional maximum fee"
            className={errors.maximumFee ? 'border-red-500' : ''}
          />
          {errors.maximumFee && (
            <p className="text-sm text-red-500">{errors.maximumFee}</p>
          )}
          <p className="text-sm text-gray-500">Optional maximum fee amount</p>
        </div>
      </div>

      {/* Fee Preview */}
      {selectedChannel &&
        (formData.percentageRate !== '0' ||
          parseVND(formData.fixedFee) > 0) && (
          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 font-medium">
              Fee Preview for {selectedChannel.name}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Sample amount:</span>
                <span className="font-medium">100,000 VND</span>
              </div>
              <div className="flex justify-between">
                <span>Percentage fee ({formData.percentageRate}%):</span>
                <span>
                  {formatVND(
                    parseVND('100000') *
                      (parseFloat(formData.percentageRate) / 100)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fixed fee:</span>
                <span>{formatVND(parseVND(formData.fixedFee))}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total fee:</span>
                <span className="text-red-600">
                  {formatVND(
                    parseVND('100000') *
                      (parseFloat(formData.percentageRate) / 100) +
                      parseVND(formData.fixedFee)
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

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
          {loading
            ? 'Saving...'
            : channelFeeStructure
              ? 'Update Fee Structure'
              : 'Create Fee Structure'}
        </Button>
      </div>
    </form>
  );
}
