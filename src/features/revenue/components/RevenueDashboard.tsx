/**
 * RevenueDashboard Component - Connected to Backend API
 * Main dashboard for revenue tracking with comprehensive analytics using API
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, BarChart3, TrendingUp, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { RevenueDialog } from './RevenueDialog';
import { RevenueList } from './RevenueList';
import { useIsMobile } from '@/hooks/useResponsive';
import { ResponsiveGrid } from '@/components/layout/ResponsiveWrapper';
import {
  useRevenue,
  useProducts,
  useChannels,
  useCreateRevenueEntry,

} from '@/hooks/use-api';
import type {
  RevenueEntry,
  RevenueEntryFormData,
} from '@/types';

import { formatVND } from '@/lib/currency';

export function RevenueDashboard() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'entries' | 'analytics'
  >('overview');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RevenueEntry | undefined>();


  // API Hooks
  const {
    data: entries = [],
    isLoading: entriesLoading,
    error: entriesError,
    refetch: refetchEntries,
  } = useRevenue();

  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
  } = useProducts();

  const {
    data: salesChannels = [],
    isLoading: channelsLoading,
    error: channelsError,
  } = useChannels();



  // Mutations
  const createEntryMutation = useCreateRevenueEntry();

  const isLoading = entriesLoading || productsLoading || channelsLoading;
  const error = entriesError || productsError || channelsError;

  // Handle revenue entry save
  const handleSaveEntry = async (data: RevenueEntryFormData) => {
    try {
      if (editingEntry) {
        // Note: Update functionality not implemented in backend yet
        alert('Update functionality will be implemented with the backend API. This feature is coming soon!');
        return;
      } else {
        // Find the product and selected variant for additional details
        const selectedProduct = products.find(p => p.id === data.productId);
        const selectedChannel = salesChannels.find(c => c.id === data.salesChannel);
        
        const amount = parseFloat(data.amount);
        const quantity = parseInt(data.quantity);
        const unitPrice = amount / quantity;

        await createEntryMutation.mutateAsync({
          productId: data.productId,
          productVariantId: data.productVariantId,
          importPhaseId: data.importPhaseId,
          productName: selectedProduct?.name || 'Unknown Product',
          variantDetails: data.productVariantId ? 'Variant Details' : undefined,
          amount,
          quantity,
          unitPrice,
          salesChannel: data.salesChannel,
          salesChannelName: selectedChannel?.name || 'Unknown Channel',
          saleDate: new Date(data.saleDate),
          notes: data.notes,
        });
      }
      setIsDialogOpen(false);
      setEditingEntry(undefined);
    } catch (error) {
      console.error('Failed to save revenue entry:', error);
      alert('Failed to save revenue entry. Please try again.');
    }
  };

  // Handle edit entry
  const handleEditEntry = (entry: RevenueEntry) => {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  };

  // Handle delete entry
  const handleDeleteEntry = async (entryId: string) => {
    const entryToDelete = entries.find((e: RevenueEntry) => e.id === entryId);
    if (!entryToDelete) {
      alert('Revenue entry not found');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete this revenue entry for ${entryToDelete.productName}?`
      )
    ) {
      return;
    }

    // Note: Delete functionality not implemented in backend yet
    alert('Delete functionality will be implemented with the backend API. This feature is coming soon!');
  };

  // Handle view entry (for now, same as edit)
  const handleViewEntry = (entry: RevenueEntry) => {
    handleEditEntry(entry);
  };

  const handleRefresh = () => {
    refetchEntries();
  };

  // Calculate summary stats
  const totalRevenue = entries.reduce((sum: number, entry: RevenueEntry) => sum + entry.amount, 0);
  const totalEntries = entries.length;
  const totalQuantity = entries.reduce((sum: number, entry: RevenueEntry) => sum + entry.quantity, 0);
  const averageOrderValue = totalEntries > 0 ? totalRevenue / totalEntries : 0;

  // Error handling
  if (error) {
    return (
      <div className={`space-y-6 ${isMobile ? 'p-4' : 'p-6'}`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <div className="flex-1">
                <p className="font-medium">Failed to load revenue data</p>
                <p className="text-sm text-red-600">Please check your connection and try again.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading revenue data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isMobile ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div
        className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}
      >
        <div>
          <h1
            className={`font-bold tracking-tight ${isMobile ? 'text-2xl' : 'text-3xl'}`}
          >
            Revenue Tracking
          </h1>
          <p className="text-muted-foreground">
            Track sales performance across all channels with backend API integration
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
            onClick={() => setIsDialogOpen(true)}
            disabled={createEntryMutation.isPending}
            className={isMobile ? 'w-full' : ''}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Revenue Entry
          </Button>
        </div>
      </div>

      {/* API Status Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex h-2 w-2 rounded-full bg-green-500"></div>
        <span className="text-muted-foreground">Connected to Backend API</span>
        {createEntryMutation.isPending && (
          <span className="text-blue-600 flex items-center gap-1">
            <div className="h-3 w-3 animate-spin rounded-full border border-blue-600 border-t-transparent"></div>
            Processing...
          </span>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 rounded-lg bg-muted p-1">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          size={isMobile ? 'sm' : 'sm'}
          onClick={() => setActiveTab('overview')}
          className={`flex-1 ${isMobile ? 'px-2' : ''}`}
        >
          <BarChart3 className={`h-4 w-4 ${isMobile ? '' : 'mr-2'}`} />
          {!isMobile && 'Overview'}
        </Button>
        <Button
          variant={activeTab === 'entries' ? 'default' : 'ghost'}
          size={isMobile ? 'sm' : 'sm'}
          onClick={() => setActiveTab('entries')}
          className={`flex-1 ${isMobile ? 'px-2' : ''}`}
        >
          <Filter className={`h-4 w-4 ${isMobile ? '' : 'mr-2'}`} />
          {!isMobile && 'Entries'}
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'ghost'}
          size={isMobile ? 'sm' : 'sm'}
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 ${isMobile ? 'px-2' : ''}`}
        >
          <TrendingUp className={`h-4 w-4 ${isMobile ? '' : 'mr-2'}`} />
          {!isMobile && 'Analytics'}
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <ResponsiveGrid columns={{ xs: 2, md: 4 }} className="gap-4">
            <Card>
              <CardHeader className={`pb-2 ${isMobile ? 'p-3' : ''}`}>
                <CardTitle
                  className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}
                >
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? 'p-3 pt-0' : ''}>
                <div
                  className={`font-bold text-green-600 ${isMobile ? 'text-lg' : 'text-2xl'}`}
                >
                  {formatVND(totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  API Connected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={`pb-2 ${isMobile ? 'p-3' : ''}`}>
                <CardTitle
                  className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}
                >
                  Total Entries
                </CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? 'p-3 pt-0' : ''}>
                <div
                  className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}
                >
                  {totalEntries}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sales Records
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={`pb-2 ${isMobile ? 'p-3' : ''}`}>
                <CardTitle
                  className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}
                >
                  Items Sold
                </CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? 'p-3 pt-0' : ''}>
                <div
                  className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}
                >
                  {totalQuantity}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Units
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={`pb-2 ${isMobile ? 'p-3' : ''}`}>
                <CardTitle
                  className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}
                >
                  Avg Order Value
                </CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? 'p-3 pt-0' : ''}>
                <div
                  className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}
                >
                  {formatVND(averageOrderValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per Transaction
                </p>
              </CardContent>
            </Card>
          </ResponsiveGrid>

          {/* Recent Entries */}
          <Card>
            <CardHeader className={isMobile ? 'p-4' : ''}>
              <div
                className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}
              >
                <CardTitle className={isMobile ? 'text-lg' : ''}>
                  Recent Revenue Entries
                </CardTitle>
                <Button
                  variant="outline"
                  size={isMobile ? 'sm' : 'sm'}
                  onClick={() => setActiveTab('entries')}
                  className={isMobile ? 'w-full' : ''}
                >
                  View All ({totalEntries})
                </Button>
              </div>
            </CardHeader>
            <CardContent className={isMobile ? 'p-4 pt-0' : ''}>
              <RevenueList
                entries={entries.slice(0, 5)}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
                onView={handleViewEntry}
                loading={false}
                error={undefined}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Entries Tab */}
      {activeTab === 'entries' && (
        <RevenueList
          entries={entries}
          onEdit={handleEditEntry}
          onDelete={handleDeleteEntry}
          onView={handleViewEntry}
          loading={false}
          error={undefined}
        />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">Analytics Coming Soon</p>
          <p>Advanced revenue analytics will be available once the backend API is fully integrated.</p>
          <p className="text-sm mt-2">Backend Connection: ✅ Connected</p>
        </div>
      )}

      {/* Revenue Dialog */}
      <RevenueDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingEntry(undefined);
        }}
        onSave={handleSaveEntry}
        editingEntry={editingEntry}
        products={products}
        salesChannels={salesChannels}
      />
    </div>
  );
}