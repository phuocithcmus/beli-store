/**
 * ImportFeeList Component
 * Displays and manages import fees for an import phase
 * Part of P1 - Import Fee Management feature
 */

'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImportFeeForm } from './ImportFeeForm';
import { formatVND } from '@/lib/currency';
import type { ImportFee, ImportFeeFormData } from '@/types';

interface ImportFeeListProps {
  importPhaseId: string;
  fees: ImportFee[];
  canEdit?: boolean; // Whether fees can be edited (false for completed phases)
  onAddFee?: (feeData: ImportFeeFormData) => void;
  onUpdateFee?: (feeId: string, feeData: ImportFeeFormData) => void;
  onDeleteFee?: (feeId: string) => void;
  loading?: boolean;
}

const FEE_TYPE_LABELS = {
  shipping: 'Shipping',
  customs: 'Customs',
  handling: 'Handling',
  storage: 'Storage',
  other: 'Other',
} as const;

const FEE_TYPE_COLORS = {
  shipping: 'bg-blue-100 text-blue-800',
  customs: 'bg-red-100 text-red-800',
  handling: 'bg-green-100 text-green-800',
  storage: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
} as const;

export function ImportFeeList({
  importPhaseId: _importPhaseId, // eslint-disable-line @typescript-eslint/no-unused-vars
  fees,
  canEdit = true,
  onAddFee,
  onUpdateFee,
  onDeleteFee,
  loading = false,
}: ImportFeeListProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingFee, setEditingFee] = useState<ImportFee | null>(null);

  const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);

  const handleAddFee = (feeData: ImportFeeFormData) => {
    onAddFee?.(feeData);
    setShowAddDialog(false);
  };

  const handleUpdateFee = (feeData: ImportFeeFormData) => {
    if (editingFee) {
      onUpdateFee?.(editingFee.id, feeData);
      setEditingFee(null);
    }
  };

  const handleDeleteFee = (fee: ImportFee) => {
    if (
      confirm(
        `Are you sure you want to delete the fee "${fee.name}"? This action cannot be undone.`
      )
    ) {
      onDeleteFee?.(fee.id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Import Fees
            {fees.length > 0 && (
              <Badge variant="secondary">{fees.length}</Badge>
            )}
          </CardTitle>
          {canEdit && (
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Fee
            </Button>
          )}
        </div>
        {totalFees > 0 && (
          <div className="text-sm text-gray-600">
            Total Fees:{' '}
            <span className="font-semibold">{formatVND(totalFees)}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {fees.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <DollarSign className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">No fees added yet</p>
            <p className="text-sm">
              {canEdit
                ? 'Add fees like shipping, customs, or handling costs'
                : 'No fees were added to this import phase'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {fees.map((fee) => (
              <div
                key={fee.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge className={`${FEE_TYPE_COLORS[fee.type]} border-0`}>
                      {FEE_TYPE_LABELS[fee.type]}
                    </Badge>
                    <h4 className="font-medium">{fee.name}</h4>
                  </div>
                  {fee.description && (
                    <p className="mb-2 text-sm text-gray-600">
                      {fee.description}
                    </p>
                  )}
                  <div className="text-lg font-semibold text-green-600">
                    {formatVND(fee.amount)}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingFee(fee)}
                      disabled={loading}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFee(fee)}
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
      </CardContent>

      {/* Add Fee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Import Fee</DialogTitle>
          </DialogHeader>
          <ImportFeeForm
            onSubmit={handleAddFee}
            onCancel={() => setShowAddDialog(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Fee Dialog */}
      <Dialog
        open={!!editingFee}
        onOpenChange={(open) => !open && setEditingFee(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Import Fee</DialogTitle>
          </DialogHeader>
          {editingFee && (
            <ImportFeeForm
              importFee={editingFee}
              onSubmit={handleUpdateFee}
              onCancel={() => setEditingFee(null)}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
