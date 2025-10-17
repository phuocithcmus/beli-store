/**
 * Import Phase Details Page
 * Detailed view for a specific import phase
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { ImportPhaseDetails } from '@/features/imports/components/ImportPhaseDetails';
import { ImportPhaseForm } from '@/features/imports/components/ImportPhaseForm';
import { AddProductsDialog } from '@/features/imports/components/AddProductsDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { storageService } from '@/lib/storage';
import type {
  ImportPhase,
  ImportFee,
  ImportFeeFormData,
  Product,
  ProductVariant,
} from '@/types';

interface ImportPhaseWithProducts extends ImportPhase {
  products?: (Product & {
    quantity: number;
    unitCost: number;
    variant?: ProductVariant;
    importPhaseProductId: string;
  })[];
  fees?: ImportFee[];
}

interface ImportPhasePageProps {
  params: {
    id: string;
  };
}

export default function ImportPhasePage({ params }: ImportPhasePageProps) {
  const router = useRouter();
  const [importPhase, setImportPhase] =
    useState<ImportPhaseWithProducts | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddProductsDialog, setShowAddProductsDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadImportPhase = useCallback(async () => {
    try {
      setLoading(true);

      // Get import phase
      const phase = storageService.getImportPhase(params.id);
      if (!phase) {
        notFound();
        return;
      }

      // Get phase products and fees
      const phaseProducts = storageService.getImportPhaseProducts(params.id);
      const phaseFees = storageService.getImportFees(params.id);
      const allProducts = storageService.getProductsWithVariants();

      // Map phase products to include product and variant details
      const productsWithDetails = phaseProducts
        .map((phaseProduct) => {
          const product = allProducts.find(
            (p) => p.id === phaseProduct.productId
          );
          if (!product) {
            return null;
          }

          let variant: ProductVariant | undefined;
          if (phaseProduct.productVariantId) {
            variant = storageService
              .getProductVariantsByProduct(product.id)
              .find((v) => v.id === phaseProduct.productVariantId);
          }

          return {
            ...product,
            quantity: phaseProduct.quantity,
            unitCost: phaseProduct.unitCost,
            variant,
            importPhaseProductId: phaseProduct.id,
          };
        })
        .filter(Boolean) as (Product & {
        quantity: number;
        unitCost: number;
        variant?: ProductVariant;
        importPhaseProductId: string;
      })[];

      setImportPhase({
        ...phase,
        products: productsWithDetails,
        fees: phaseFees,
      });

      setAvailableProducts(allProducts);
    } catch (error) {
      console.error('Failed to load import phase:', error);
      notFound();
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadImportPhase();
  }, [loadImportPhase]);

  const handleEditPhase = async (data: {
    code: string;
    date: string;
    description?: string;
  }) => {
    if (!importPhase) {
      return;
    }

    try {
      const updatedPhase = storageService.updateImportPhase(importPhase.id, {
        code: data.code,
        date: new Date(data.date),
        description: data.description,
      });

      setImportPhase((prev) => (prev ? { ...prev, ...updatedPhase } : null));
      setShowEditForm(false);
    } catch (error) {
      console.error('Failed to update import phase:', error);
      throw error;
    }
  };

  const handleCompletePhase = async (phaseId: string) => {
    try {
      storageService.completeImportPhase(phaseId);
      await loadImportPhase(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to complete import phase:', error);
      alert(
        `Failed to complete import phase: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleAddProductsToPhase = async (
    phaseId: string,
    selections: {
      productId: string;
      productVariantId?: string;
      quantity: number;
      unitCost: number;
    }[]
  ) => {
    try {
      for (const selection of selections) {
        storageService.addProductToImportPhase(phaseId, selection);
      }
      await loadImportPhase(); // Reload to get updated data
      setShowAddProductsDialog(false);
    } catch (error) {
      console.error('Failed to add products to import phase:', error);
      throw error;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRemoveProduct = async (_phaseId: string, _productId: string) => {
    try {
      // For now, we'll show an alert that this feature needs implementation
      alert('Remove product feature will be implemented in the next update');
      // TODO: Implement removeProductFromImportPhase in storage service
    } catch (error) {
      console.error('Failed to remove product:', error);
      alert('Failed to remove product from import phase');
    }
  };

  const handleEditProduct = (productId: string) => {
    // Navigate to product edit page
    router.push(`/products/${productId}`);
  };

  // Fee management handlers
  const handleAddFee = async (feeData: ImportFeeFormData) => {
    if (!importPhase) {
      return;
    }

    try {
      storageService.saveImportFee({
        importPhaseId: importPhase.id,
        type: feeData.type,
        name: feeData.name,
        amount: parseFloat(feeData.amount.replace(/,/g, '')),
        description: feeData.description,
      });
      await loadImportPhase(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to add fee:', error);
      throw error;
    }
  };

  const handleUpdateFee = async (feeId: string, feeData: ImportFeeFormData) => {
    try {
      storageService.updateImportFee(feeId, {
        type: feeData.type,
        name: feeData.name,
        amount: parseFloat(feeData.amount.replace(/,/g, '')),
        description: feeData.description,
      });
      await loadImportPhase(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to update fee:', error);
      throw error;
    }
  };

  const handleDeleteFee = async (feeId: string) => {
    try {
      storageService.deleteImportFee(feeId);
      await loadImportPhase(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to delete fee:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading import phase...</p>
        </div>
      </div>
    );
  }

  if (!importPhase) {
    notFound();
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <ImportPhaseDetails
        importPhase={importPhase}
        onBack={() => router.push('/imports')}
        onEditPhase={() => setShowEditForm(true)}
        onCompletePhase={handleCompletePhase}
        onAddProducts={() => setShowAddProductsDialog(true)}
        onEditProduct={handleEditProduct}
        onRemoveProduct={handleRemoveProduct}
        onAddFee={handleAddFee}
        onUpdateFee={handleUpdateFee}
        onDeleteFee={handleDeleteFee}
        loading={loading}
      />

      {/* Edit Phase Form Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Import Phase</DialogTitle>
          </DialogHeader>
          <ImportPhaseForm
            importPhase={importPhase}
            onSubmit={handleEditPhase}
            onCancel={() => setShowEditForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Products Dialog */}
      <AddProductsDialog
        isOpen={showAddProductsDialog}
        onClose={() => setShowAddProductsDialog(false)}
        importPhase={importPhase}
        availableProducts={availableProducts}
        onAddProducts={handleAddProductsToPhase}
      />
    </div>
  );
}
