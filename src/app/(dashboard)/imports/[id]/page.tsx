/**
 * Import Phase Details Page
 * Detailed view for a specific import phase
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { ImportPhaseDetails } from '@/features/imports/components/ImportPhaseDetails';
import { ImportPhaseForm } from '@/features/imports/components/ImportPhaseForm';
import { AddProductsDialog } from '@/features/imports/components/AddProductsDialog';
import { storageService } from '@/lib/storage';
import type { ImportPhase, Product, ImportPhaseProduct } from '@/types';

interface ImportPhaseWithProducts extends ImportPhase {
  products?: (Product & { quantity: number; unitCost: number })[];
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

  useEffect(() => {
    loadImportPhase();
  }, [params.id]);

  const loadImportPhase = async () => {
    try {
      setLoading(true);

      // Get import phase
      const phase = storageService.getImportPhase(params.id);
      if (!phase) {
        notFound();
        return;
      }

      // Get phase products
      const phaseProducts = storageService.getImportPhaseProducts(params.id);
      const allProducts = storageService.getProducts();

      // Map phase products to include product details
      const productsWithDetails = phaseProducts
        .map((phaseProduct) => {
          const product = allProducts.find(
            (p) => p.id === phaseProduct.productId
          );
          if (!product) return null;

          return {
            ...product,
            quantity: phaseProduct.quantity,
            unitCost: phaseProduct.unitCost,
          };
        })
        .filter(Boolean) as (Product & {
        quantity: number;
        unitCost: number;
      })[];

      setImportPhase({
        ...phase,
        products: productsWithDetails,
      });

      setAvailableProducts(allProducts);
    } catch (error) {
      console.error('Failed to load import phase:', error);
      notFound();
    } finally {
      setLoading(false);
    }
  };

  const handleEditPhase = async (data: {
    code: string;
    date: string;
    description?: string;
  }) => {
    if (!importPhase) return;

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
    selections: Array<{ productId: string; quantity: number; unitCost: number }>
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

  const handleRemoveProduct = async (phaseId: string, productId: string) => {
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
    <div className="space-y-6">
      <ImportPhaseDetails
        importPhase={importPhase}
        onBack={() => router.push('/imports')}
        onEditPhase={() => setShowEditForm(true)}
        onCompletePhase={handleCompletePhase}
        onAddProducts={() => setShowAddProductsDialog(true)}
        onEditProduct={handleEditProduct}
        onRemoveProduct={handleRemoveProduct}
      />

      {/* Edit Phase Form Dialog */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowEditForm(false)}
          />
          <div className="relative w-full max-w-md rounded-lg bg-white shadow-lg">
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Edit Import Phase</h2>
              <ImportPhaseForm
                importPhase={importPhase}
                onSubmit={handleEditPhase}
                onCancel={() => setShowEditForm(false)}
              />
            </div>
          </div>
        </div>
      )}

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
