/**
 * RevenueDashboard Component
 * Main dashboard for revenue tracking with comprehensive analytics
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, BarChart3, TrendingUp, Filter } from 'lucide-react';
import { RevenueDialog } from './RevenueDialog';
import { RevenueList } from './RevenueList';
import { RevenueAnalytics } from './RevenueAnalytics';
import { useRevenue } from '@/features/revenue/hooks/useRevenue';
import { useRevenueAnalytics } from '@/features/revenue/hooks/useRevenueAnalytics';
import { useSalesChannels } from '@/features/revenue/hooks/useSalesChannels';
import { useIsMobile } from '@/hooks/useResponsive';
import { ResponsiveGrid } from '@/components/layout/ResponsiveWrapper';
import { storageService } from '@/lib/storage';
import type {
  RevenueEntry,
  RevenueEntryFormData,
  Product,
  ProductVariant,
} from '@/types';
import type { RevenuePeriod } from '@/features/revenue/types/revenue';
import { formatVND } from '@/lib/currency';

export function RevenueDashboard() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'entries' | 'analytics'
  >('overview');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RevenueEntry | undefined>();
  const [analyticsPeriod, setAnalyticsPeriod] =
    useState<RevenuePeriod>('month');
  const [products, setProducts] = useState<
    (Product & { variants?: ProductVariant[] })[]
  >([]);

  // Load products with variants
  const loadProducts = () => {
    const productsWithVariants = storageService.getProductsWithVariants();
    setProducts(productsWithVariants);
  };

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Custom hooks
  const {
    entries,
    loading: entriesLoading,
    error: entriesError,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useRevenue();

  const {
    data: analyticsData,
    loading: analyticsLoading,
    error: analyticsError,
    refreshAnalytics,
  } = useRevenueAnalytics(analyticsPeriod);

  const { channels: salesChannels } = useSalesChannels();

  // Handle revenue entry save
  const handleSaveEntry = async (data: RevenueEntryFormData) => {
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, data);
      } else {
        await createEntry(data);
      }
      setIsDialogOpen(false);
      setEditingEntry(undefined);
      refreshAnalytics();
      // Refresh products to ensure fresh data
      loadProducts();
    } catch (error) {
      console.error('Failed to save revenue entry:', error);
      throw error;
    }
  };

  // Handle edit entry
  const handleEditEntry = (entry: RevenueEntry) => {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  };

  // Handle delete entry
  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteEntry(entryId);
      refreshAnalytics();
    } catch (error) {
      console.error('Failed to delete revenue entry:', error);
    }
  };

  // Handle view entry (for now, same as edit)
  const handleViewEntry = (entry: RevenueEntry) => {
    handleEditEntry(entry);
  };

  // Calculate summary stats
  const totalRevenue = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalEntries = entries.length;
  const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const averageOrderValue = totalEntries > 0 ? totalRevenue / totalEntries : 0;

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
            Track sales performance across all channels
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className={isMobile ? 'w-full' : ''}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Revenue Entry
        </Button>
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
                  className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}
                >
                  {formatVND(totalRevenue)}
                </div>
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
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className={isMobile ? 'p-4 pt-0' : ''}>
              <RevenueList
                entries={entries.slice(0, 5)}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
                onView={handleViewEntry}
                loading={entriesLoading}
                error={entriesError || undefined}
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
          loading={entriesLoading}
          error={entriesError || undefined}
        />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <RevenueAnalytics
          data={analyticsData}
          loading={analyticsLoading}
          error={analyticsError}
          period={analyticsPeriod}
          onPeriodChange={setAnalyticsPeriod}
          onRefresh={refreshAnalytics}
        />
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
