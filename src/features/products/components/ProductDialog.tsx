/**
 * ProductDialog Component
 * Modal dialog for adding and editing products
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductForm } from './ProductForm';
import { storageService } from '@/lib/storage';
import type { Product } from '@/types';

interface ProductFormData {
  code: string;
  name: string;
  category: 'shirt' | 'pants';
  remainingQuantity: number;
  soldQuantity: number;
  purchasePrice: number;
  sellingPrice: number;
}

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product; // For editing existing products
  onSuccess?: () => void; // Callback after successful save
}

export function ProductDialog({
  isOpen,
  onClose,
  product,
  onSuccess,
}: ProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ProductFormData) => {
    setLoading(true);
    setError(null);

    try {
      if (product) {
        // Update existing product
        await storageService.updateProduct(product.id, {
          code: data.code,
          name: data.name,
          category: data.category,
          remainingQuantity: data.remainingQuantity,
          soldQuantity: data.soldQuantity,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
        });
      } else {
        // Create new product
        await storageService.saveProduct({
          code: data.code,
          name: data.name,
          category: data.category,
          remainingQuantity: data.remainingQuantity,
          soldQuantity: data.soldQuantity,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
        });
      }

      // Success! Close dialog and notify parent
      onClose();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <div className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        <ProductForm
          product={product}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}
