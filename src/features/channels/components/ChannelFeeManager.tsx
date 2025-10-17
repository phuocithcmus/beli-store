/**
 * ChannelFeeManager Component
 * Displays and manages channel fee structures
 * Part of P2 - Sales Channel Fee Configuration feature
 */

'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Percent, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChannelFeeForm } from './ChannelFeeForm';
import { formatVND } from '@/lib/currency';
import type {
  ChannelFeeStructure,
  ChannelFeeFormData,
  SalesChannel,
} from '@/types';

interface ChannelFeeManagerProps {
  channelFeeStructures: ChannelFeeStructure[];
  salesChannels: SalesChannel[];
  canEdit?: boolean;
  onAddFeeStructure?: (
    feeStructureData: ChannelFeeFormData & { salesChannelId: string }
  ) => void;
  onUpdateFeeStructure?: (
    feeStructureId: string,
    feeStructureData: ChannelFeeFormData
  ) => void;
  onDeleteFeeStructure?: (feeStructureId: string) => void;
  loading?: boolean;
}

const CHANNEL_TYPE_COLORS = {
  online: 'bg-blue-100 text-blue-800',
  manual: 'bg-green-100 text-green-800',
  partner: 'bg-purple-100 text-purple-800',
} as const;

export function ChannelFeeManager({
  channelFeeStructures,
  salesChannels,
  canEdit = true,
  onAddFeeStructure,
  onUpdateFeeStructure,
  onDeleteFeeStructure,
  loading = false,
}: ChannelFeeManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingFeeStructure, setEditingFeeStructure] =
    useState<ChannelFeeStructure | null>(null);

  const handleAddFeeStructure = (
    feeStructureData: ChannelFeeFormData & { salesChannelId: string }
  ) => {
    onAddFeeStructure?.(feeStructureData);
    setShowAddDialog(false);
  };

  const handleUpdateFeeStructure = (feeStructureData: ChannelFeeFormData) => {
    if (editingFeeStructure) {
      onUpdateFeeStructure?.(editingFeeStructure.id, feeStructureData);
      setEditingFeeStructure(null);
    }
  };

  const handleDeleteFeeStructure = (feeStructure: ChannelFeeStructure) => {
    const channel = salesChannels.find(
      (c) => c.id === feeStructure.salesChannelId
    );
    const channelName = channel?.name || 'Unknown Channel';

    if (
      confirm(
        `Are you sure you want to delete the fee structure for "${channelName}"? This action cannot be undone.`
      )
    ) {
      onDeleteFeeStructure?.(feeStructure.id);
    }
  };

  // Get channels with fee structures
  const channelsWithFees = channelFeeStructures
    .map((fee) => {
      const channel = salesChannels.find((c) => c.id === fee.salesChannelId);
      return { fee, channel };
    })
    .filter((item) => item.channel);

  // Get available channels for adding new fee structures
  const availableChannels = salesChannels.filter(
    (channel) =>
      channel.isActive &&
      !channelFeeStructures.some((fee) => fee.salesChannelId === channel.id)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Channel Fee Structures
            {channelFeeStructures.length > 0 && (
              <Badge variant="secondary">{channelFeeStructures.length}</Badge>
            )}
          </CardTitle>
          {canEdit && availableChannels.length > 0 && (
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Fee Structure
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {channelsWithFees.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <DollarSign className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">No fee structures configured</p>
            <p className="text-sm">
              {canEdit
                ? 'Add fee structures to automatically calculate fees for your sales channels'
                : 'No fee structures have been configured for sales channels'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {channelsWithFees.map(({ fee, channel }) => (
              <div
                key={fee.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h4 className="font-medium">{channel?.name}</h4>
                    <Badge
                      className={`${CHANNEL_TYPE_COLORS[channel?.type || 'manual']} border-0`}
                    >
                      {channel?.type}
                    </Badge>
                    {!fee.isActive && (
                      <Badge variant="outline" className="text-gray-500">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                    <div>
                      <span className="text-gray-500">Percentage Rate:</span>
                      <p className="font-medium">{fee.percentageRate}%</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Fixed Fee:</span>
                      <p className="font-medium">{formatVND(fee.fixedFee)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Fee Range:</span>
                      <p className="font-medium">
                        {fee.minimumFee || fee.maximumFee ? (
                          <>
                            {fee.minimumFee
                              ? formatVND(fee.minimumFee)
                              : 'No min'}
                            {' - '}
                            {fee.maximumFee
                              ? formatVND(fee.maximumFee)
                              : 'No max'}
                          </>
                        ) : (
                          'No limits'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Fee Preview */}
                  <div className="mt-3 rounded bg-gray-50 p-2 text-sm">
                    <span className="text-gray-500">
                      Sample fee (100,000 VND):{' '}
                    </span>
                    <span className="font-medium text-red-600">
                      {formatVND(
                        Math.max(
                          fee.minimumFee || 0,
                          Math.min(
                            fee.maximumFee || Infinity,
                            (100000 * fee.percentageRate) / 100 + fee.fixedFee
                          )
                        )
                      )}
                    </span>
                  </div>
                </div>

                {canEdit && (
                  <div className="ml-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingFeeStructure(fee)}
                      disabled={loading}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFeeStructure(fee)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {availableChannels.length === 0 &&
          canEdit &&
          channelsWithFees.length > 0 && (
            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              All active sales channels have fee structures configured.
            </div>
          )}
      </CardContent>

      {/* Add Fee Structure Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Channel Fee Structure</DialogTitle>
          </DialogHeader>
          <ChannelFeeForm
            salesChannels={availableChannels}
            onSubmit={handleAddFeeStructure}
            onCancel={() => setShowAddDialog(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Fee Structure Dialog */}
      <Dialog
        open={!!editingFeeStructure}
        onOpenChange={(open) => !open && setEditingFeeStructure(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Channel Fee Structure</DialogTitle>
          </DialogHeader>
          {editingFeeStructure && (
            <ChannelFeeForm
              channelFeeStructure={editingFeeStructure}
              salesChannels={salesChannels}
              onSubmit={handleUpdateFeeStructure}
              onCancel={() => setEditingFeeStructure(null)}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
