/**
 * Imports Page
 * Main page for managing import phases
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Package, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImportPhaseList } from '@/features/imports/components/ImportPhaseList';
import { ImportPhaseForm } from '@/features/imports/components/ImportPhaseForm';
import { AddProductsDialog } from '@/features/imports/components/AddProductsDialog';
import { storageService } from '@/lib/storage';
import type { ImportPhase, Product } from '@/types';
import { formatVND } from '@/lib/currency';

export default function ImportsPage() {
  const router = useRouter();
  const [importPhases, setImportPhases] = useState<ImportPhase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showNewPhaseForm, setShowNewPhaseForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState<ImportPhase | null>(null);
  const [showAddProductsDialog, setShowAddProductsDialog] = useState(false);
  const [selectedPhaseForProducts, setSelectedPhaseForProducts] =
    useState<ImportPhase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [phasesData, productsData] = await Promise.all([
        storageService.getImportPhases(),
        storageService.getProductsWithVariants(),
      ]);

      setImportPhases(phasesData);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load import phases');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePhase = async (data: {
    code: string;
    date: string;
    description?: string;
  }) => {
    try {
      const newPhase = storageService.saveImportPhase({
        code: data.code,
        date: new Date(data.date),
        description: data.description,
        totalFees: 0, // P1: Initialize with zero fees
        finalCost: 0, // P1: Initialize with zero final cost
      });
      setImportPhases((prev) => [newPhase, ...prev]);
      setShowNewPhaseForm(false);
    } catch (error) {
      console.error('Failed to create import phase:', error);
      throw error;
    }
  };

  const handleUpdatePhase = async (
    phaseId: string,
    data: { code: string; date: string; description?: string }
  ) => {
    try {
      const updatedPhase = storageService.updateImportPhase(phaseId, {
        code: data.code,
        date: new Date(data.date),
        description: data.description,
      });
      setImportPhases((prev) =>
        prev.map((phase) => (phase.id === phaseId ? updatedPhase : phase))
      );
      setEditingPhase(null);
    } catch (error) {
      console.error('Failed to update import phase:', error);
      throw error;
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    try {
      storageService.deleteImportPhase(phaseId);
      setImportPhases((prev) => prev.filter((phase) => phase.id !== phaseId));
    } catch (error) {
      console.error('Failed to delete import phase:', error);
      alert(
        `Failed to delete import phase: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleCompletePhase = async (phaseId: string) => {
    try {
      storageService.completeImportPhase(phaseId);
      await loadData(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to complete import phase:', error);
      alert(
        `Failed to complete import phase: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleViewPhase = (phase: ImportPhase) => {
    router.push(`/imports/${phase.id}`);
  };

  const handleAddProducts = (phase: ImportPhase) => {
    setSelectedPhaseForProducts(phase);
    setShowAddProductsDialog(true);
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
      await loadData(); // Reload to get updated data
      setShowAddProductsDialog(false);
      setSelectedPhaseForProducts(null);
    } catch (error) {
      console.error('Failed to add products to import phase:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading import phases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Import Management
          </h1>
          <p className="text-muted-foreground">
            Manage import phases and track inventory acquisitions with product
            variants
          </p>
        </div>

        <Button
          onClick={() => setShowNewPhaseForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Import Phase
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {importPhases.length}
              </div>
              <div className="text-sm font-medium text-blue-700">
                Total Phases
              </div>
            </div>
            <div className="rounded-full bg-blue-200 p-3">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-gradient-to-r from-green-50 to-emerald-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-900">
                {importPhases.filter((p) => p.status === 'active').length}
              </div>
              <div className="text-sm font-medium text-green-700">
                Active Phases
              </div>
            </div>
            <div className="rounded-full bg-green-200 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-gradient-to-r from-purple-50 to-pink-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-900">
                {formatVND(
                  importPhases.reduce((sum, p) => sum + p.totalCost, 0)
                )}
              </div>
              <div className="text-sm font-medium text-purple-700">
                Total Investment
              </div>
            </div>
            <div className="rounded-full bg-purple-200 p-3">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Import Phases List */}
      <ImportPhaseList
        importPhases={importPhases}
        onEditPhase={setEditingPhase}
        onDeletePhase={handleDeletePhase}
        onViewPhase={handleViewPhase}
        onCompletePhase={handleCompletePhase}
        onAddProducts={handleAddProducts}
      />

      {/* New Phase Form Dialog */}
      <Dialog
        open={showNewPhaseForm}
        onOpenChange={(open) => !open && setShowNewPhaseForm(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Create New Import Phase
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ImportPhaseForm
              onSubmit={handleCreatePhase}
              onCancel={() => setShowNewPhaseForm(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Phase Form Dialog */}
      <Dialog
        open={!!editingPhase}
        onOpenChange={(open) => !open && setEditingPhase(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Edit Import Phase
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {editingPhase && (
              <ImportPhaseForm
                importPhase={editingPhase}
                onSubmit={(data) => handleUpdatePhase(editingPhase.id, data)}
                onCancel={() => setEditingPhase(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Products Dialog */}
      {showAddProductsDialog && selectedPhaseForProducts && (
        <AddProductsDialog
          isOpen={showAddProductsDialog}
          onClose={() => {
            setShowAddProductsDialog(false);
            setSelectedPhaseForProducts(null);
          }}
          importPhase={selectedPhaseForProducts}
          availableProducts={products}
          onAddProducts={handleAddProductsToPhase}
        />
      )}
    </div>
  );
}
