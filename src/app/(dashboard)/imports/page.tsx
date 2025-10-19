/**
 * Imports Page - Connected to Backend API
 * Main page for managing import phases with API integration
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Package,
  TrendingUp,
  DollarSign,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ResponsiveWrapper,
  ResponsiveGrid,
} from '@/components/layout/ResponsiveWrapper';
import { useIsMobile } from '@/hooks/useResponsive';
import { touchOptimized } from '@/lib/utils/responsive';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useImports,
  useProducts,
  useCreateImport,
  useUpdateImport,
} from '@/hooks/use-api';
import { ImportPhaseList } from '@/features/imports/components/ImportPhaseList';
import { ImportPhaseForm } from '@/features/imports/components/ImportPhaseForm';
import { AddProductsDialog } from '@/features/imports/components/AddProductsDialog';
import type { ImportPhase } from '@/types';
import { formatVND } from '@/lib/currency';

export default function ImportsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [showNewPhaseForm, setShowNewPhaseForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState<ImportPhase | null>(null);
  const [showAddProductsDialog, setShowAddProductsDialog] = useState(false);
  const [selectedPhaseForProducts, setSelectedPhaseForProducts] =
    useState<ImportPhase | null>(null);

  // API Hooks
  const {
    data: importPhases = [],
    isLoading: phasesLoading,
    error: phasesError,
    refetch: refetchPhases,
  } = useImports();

  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
  } = useProducts();

  const createPhaseMutation = useCreateImport();
  const updatePhaseMutation = useUpdateImport();

  const isLoading = phasesLoading || productsLoading;
  const error = phasesError || productsError;

  const handleCreatePhase = async (data: {
    code: string;
    date: string;
    description?: string;
  }) => {
    try {
      await createPhaseMutation.mutateAsync({
        code: data.code,
        date: data.date,
        description: data.description,
        totalItems: 0,
        totalCost: 0,
        totalFees: 0,
      });
      setShowNewPhaseForm(false);
    } catch (error) {
      console.error('Failed to create import phase:', error);
      alert('Failed to create import phase. Please try again.');
    }
  };

  const handleUpdatePhase = async (
    phaseId: string,
    data: { code: string; date: string; description?: string }
  ) => {
    try {
      await updatePhaseMutation.mutateAsync({
        id: phaseId,
        data: {
          code: data.code,
          date: data.date,
          description: data.description,
        },
      });
      setEditingPhase(null);
    } catch (error) {
      console.error('Failed to update import phase:', error);
      alert('Failed to update import phase. Please try again.');
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    const phaseToDelete = importPhases.find(
      (p: ImportPhase) => p.id === phaseId
    );
    if (!phaseToDelete) {
      alert('Import phase not found');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete import phase "${phaseToDelete.code}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    // Note: Delete functionality not implemented in backend yet
    alert(
      'Delete functionality will be implemented with the backend API. This feature is coming soon!'
    );
  };

  const handleCompletePhase = async (phaseId: string) => {
    const phaseToComplete = importPhases.find((p) => p.id === phaseId);
    if (!phaseToComplete) {
      alert('Import phase not found');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to complete import phase "${phaseToComplete.code}"? This will finalize all calculations and mark it as completed.`
      )
    ) {
      return;
    }

    try {
      await updatePhaseMutation.mutateAsync({
        id: phaseId,
        data: {
          // Note: Status updates need to be implemented in the backend
        },
      });
    } catch (error) {
      console.error('Failed to complete import phase:', error);
      alert('Failed to complete import phase. Please try again.');
    }
  };

  const handleViewPhase = (phase: ImportPhase) => {
    router.push(`/imports/${phase.id}`);
  };

  const handleAddProducts = (phase: ImportPhase) => {
    setSelectedPhaseForProducts(phase);
    setShowAddProductsDialog(true);
  };

  const handleAddProductsToPhase = async () => {
    try {
      // Note: This would need to be implemented as an API endpoint
      // For now, we'll show a message that this feature needs backend implementation
      alert(
        'Adding products to import phases will be implemented with the backend API. This feature is coming soon!'
      );
      setShowAddProductsDialog(false);
      setSelectedPhaseForProducts(null);
    } catch (error) {
      console.error('Failed to add products to import phase:', error);
      alert('Failed to add products to import phase. Please try again.');
    }
  };

  const handleRefresh = () => {
    refetchPhases();
  };

  // Calculate statistics
  const totalPhases = importPhases.length;
  const activePhases = importPhases.filter(
    (p: ImportPhase) => p.status === 'active'
  ).length;
  const totalInvestment = importPhases.reduce(
    (sum: number, p: ImportPhase) => sum + (p.totalCost || 0),
    0
  );

  // Error handling
  if (error) {
    return (
      <ResponsiveWrapper className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <div className="flex-1">
                <p className="font-medium">Failed to load import phases</p>
                <p className="text-sm text-red-600">
                  Please check your connection and try again.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="mr-1 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </ResponsiveWrapper>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <ResponsiveWrapper className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading import phases...</p>
        </div>
      </ResponsiveWrapper>
    );
  }

  return (
    <ResponsiveWrapper className="space-y-6">
      {/* Header */}
      <div
        className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}
      >
        <div>
          <h1
            className={`font-bold tracking-tight ${isMobile ? 'text-2xl' : 'text-3xl'}`}
          >
            Import Management
          </h1>
          <p className="text-muted-foreground">
            Manage import phases and track inventory acquisitions with backend
            API integration
          </p>
        </div>
        <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'items-center'}`}>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowNewPhaseForm(true)}
            disabled={createPhaseMutation.isPending}
            className={`bg-blue-600 hover:bg-blue-700 ${isMobile ? 'w-full' : 'max-w-content'} ${touchOptimized('', { touchClasses: 'min-h-[48px]' })}`}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Import Phase
          </Button>
        </div>
      </div>

      {/* API Status Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex h-2 w-2 rounded-full bg-green-500"></div>
        <span className="text-muted-foreground">Connected to Backend API</span>
        {(createPhaseMutation.isPending || updatePhaseMutation.isPending) && (
          <span className="flex items-center gap-1 text-blue-600">
            <div className="h-3 w-3 animate-spin rounded-full border border-blue-600 border-t-transparent"></div>
            Processing...
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <ResponsiveGrid columns={{ xs: 1, md: 3 }} gap="lg">
        <div className="rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {totalPhases}
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
                {activePhases}
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
                {formatVND(totalInvestment)}
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
      </ResponsiveGrid>

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
    </ResponsiveWrapper>
  );
}
