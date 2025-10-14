/**
 * Imports Page
 * Main page for managing import phases
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportPhaseList } from '@/features/imports/components/ImportPhaseList';
import { ImportPhaseForm } from '@/features/imports/components/ImportPhaseForm';
import { AddProductsDialog } from '@/features/imports/components/AddProductsDialog';
import { storageService } from '@/lib/storage';
import type { ImportPhase, Product } from '@/types';

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
        storageService.getProducts(),
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
    selections: Array<{ productId: string; quantity: number; unitCost: number }>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Management</h1>
          <p className="text-muted-foreground">
            Manage import phases and track inventory acquisitions
          </p>
        </div>

        <Button onClick={() => setShowNewPhaseForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Import Phase
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{importPhases.length}</div>
          <div className="text-sm text-muted-foreground">Total Phases</div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">
            {importPhases.filter((p) => p.status === 'active').length}
          </div>
          <div className="text-sm text-muted-foreground">Active Phases</div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">
            ${importPhases.reduce((sum, p) => sum + p.totalCost, 0).toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">Total Investment</div>
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
      {showNewPhaseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowNewPhaseForm(false)}
          />
          <div className="relative w-full max-w-md rounded-lg bg-white shadow-lg">
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold">
                Create New Import Phase
              </h2>
              <ImportPhaseForm
                onSubmit={handleCreatePhase}
                onCancel={() => setShowNewPhaseForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Phase Form Dialog */}
      {editingPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setEditingPhase(null)}
          />
          <div className="relative w-full max-w-md rounded-lg bg-white shadow-lg">
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Edit Import Phase</h2>
              <ImportPhaseForm
                importPhase={editingPhase}
                onSubmit={(data) => handleUpdatePhase(editingPhase.id, data)}
                onCancel={() => setEditingPhase(null)}
              />
            </div>
          </div>
        </div>
      )}

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
