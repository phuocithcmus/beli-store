/**
 * Fee Management Demo Page
 * Demonstrates P1 (Import Fees) and P2 (Channel Fees) features working together
 *
 * This page shows:
 * - Import fee management (P1)
 * - Channel fee configuration (P2)
 * - Fee calculation examples
 * - VND currency formatting throughout
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Calculator, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChannelFeeManager } from '@/features/channels/components/ChannelFeeManager';
import { formatVND } from '@/lib/currency';
import { storageService } from '@/lib/storage';
import type {
  ChannelFeeStructure,
  ChannelFeeFormData,
  SalesChannel,
  ImportPhase,
  ImportFee,
} from '@/types';

export default function FeeManagementDemo() {
  const [channelFeeStructures, setChannelFeeStructures] = useState<
    ChannelFeeStructure[]
  >([]);
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([]);
  const [importPhases, setImportPhases] = useState<ImportPhase[]>([]);
  const [importFees, setImportFees] = useState<ImportFee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all data
      const [channels, structures, phases, fees] = await Promise.all([
        Promise.resolve(storageService.getSalesChannels?.() || []),
        Promise.resolve(storageService.getChannelFeeStructures()),
        Promise.resolve(storageService.getImportPhases()),
        Promise.resolve(storageService.getImportFees()),
      ]);

      setSalesChannels(channels);
      setChannelFeeStructures(structures);
      setImportPhases(phases);
      setImportFees(fees);
    } catch (error) {
      console.error('Failed to load fee management data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannelFeeStructure = async (
    feeStructureData: ChannelFeeFormData & { salesChannelId: string }
  ) => {
    try {
      const newStructure = storageService.saveChannelFeeStructure({
        salesChannelId: feeStructureData.salesChannelId,
        percentageRate: parseFloat(feeStructureData.percentageRate),
        fixedFee: parseFloat(feeStructureData.fixedFee.replace(/,/g, '')),
        minimumFee: feeStructureData.minimumFee
          ? parseFloat(feeStructureData.minimumFee.replace(/,/g, ''))
          : undefined,
        maximumFee: feeStructureData.maximumFee
          ? parseFloat(feeStructureData.maximumFee.replace(/,/g, ''))
          : undefined,
        isActive: true,
      });

      setChannelFeeStructures((prev) => [...prev, newStructure]);
    } catch (error) {
      console.error('Failed to add channel fee structure:', error);
      alert('Failed to add channel fee structure. Please try again.');
    }
  };

  const handleUpdateChannelFeeStructure = async (
    feeStructureId: string,
    feeStructureData: ChannelFeeFormData
  ) => {
    try {
      const updatedStructure = storageService.updateChannelFeeStructure(
        feeStructureId,
        {
          percentageRate: parseFloat(feeStructureData.percentageRate),
          fixedFee: parseFloat(feeStructureData.fixedFee.replace(/,/g, '')),
          minimumFee: feeStructureData.minimumFee
            ? parseFloat(feeStructureData.minimumFee.replace(/,/g, ''))
            : undefined,
          maximumFee: feeStructureData.maximumFee
            ? parseFloat(feeStructureData.maximumFee.replace(/,/g, ''))
            : undefined,
        }
      );

      setChannelFeeStructures((prev) =>
        prev.map((structure) =>
          structure.id === feeStructureId ? updatedStructure : structure
        )
      );
    } catch (error) {
      console.error('Failed to update channel fee structure:', error);
      alert('Failed to update channel fee structure. Please try again.');
    }
  };

  const handleDeleteChannelFeeStructure = async (feeStructureId: string) => {
    try {
      storageService.deleteChannelFeeStructure(feeStructureId);
      setChannelFeeStructures((prev) =>
        prev.filter((structure) => structure.id !== feeStructureId)
      );
    } catch (error) {
      console.error('Failed to delete channel fee structure:', error);
      alert('Failed to delete channel fee structure. Please try again.');
    }
  };

  // Calculate some demo metrics
  const totalImportFees = importFees.reduce((sum, fee) => sum + fee.amount, 0);
  const activeChannelFees = channelFeeStructures.filter(
    (cfs) => cfs.isActive
  ).length;

  // Demo calculations
  const demoRevenueAmount = 500000; // 500,000 VND
  const demoChannelFees = channelFeeStructures.map((structure) => {
    const channel = salesChannels.find(
      (c) => c.id === structure.salesChannelId
    );
    const calculatedFee = storageService.calculateChannelFee(
      structure.salesChannelId,
      demoRevenueAmount
    );
    return {
      channelName: channel?.name || 'Unknown',
      channelType: channel?.type || 'unknown',
      fee: calculatedFee,
      percentage: structure.percentageRate,
      fixedFee: structure.fixedFee,
    };
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">
            Loading fee management data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Fee Management System
        </h1>
        <p className="text-muted-foreground">
          Comprehensive fee management with import costs (P1) and channel fees
          (P2)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Import Fees
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatVND(totalImportFees)}
            </div>
            <p className="text-xs text-muted-foreground">
              {importFees.length} fee{importFees.length !== 1 ? 's' : ''} across{' '}
              {importPhases.length} import{importPhases.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Channel Fee Structures
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeChannelFees}</div>
            <p className="text-xs text-muted-foreground">
              Active structures for {salesChannels.length} channel
              {salesChannels.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demo Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatVND(demoRevenueAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sample transaction amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Calculated Fees
            </CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatVND(demoChannelFees.reduce((sum, cf) => sum + cf.fee, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total fees for demo amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fee Management Tabs */}
      <Tabs value="channel-fees" onValueChange={() => {}} className="space-y-4">
        <TabsList>
          <TabsTrigger value="channel-fees">
            Channel Fee Configuration (P2)
          </TabsTrigger>
          <TabsTrigger value="fee-calculations">Fee Calculations</TabsTrigger>
          <TabsTrigger value="import-summary">
            Import Fee Summary (P1)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="channel-fees" className="space-y-4">
          <ChannelFeeManager
            channelFeeStructures={channelFeeStructures}
            salesChannels={salesChannels}
            onAddFeeStructure={handleAddChannelFeeStructure}
            onUpdateFeeStructure={handleUpdateChannelFeeStructure}
            onDeleteFeeStructure={handleDeleteChannelFeeStructure}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="fee-calculations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Calculation Examples</CardTitle>
              <p className="text-sm text-muted-foreground">
                How fees are calculated for a {formatVND(demoRevenueAmount)}{' '}
                transaction across different channels
              </p>
            </CardHeader>
            <CardContent>
              {demoChannelFees.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Calculator className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p className="text-lg font-medium">
                    No fee structures configured
                  </p>
                  <p className="text-sm">
                    Configure channel fee structures to see calculation examples
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {demoChannelFees.map((channelFee, index) => (
                    <div key={index} className="rounded-lg border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {channelFee.channelName}
                          </h4>
                          <Badge variant="outline" className="capitalize">
                            {channelFee.channelType}
                          </Badge>
                        </div>
                        <div className="text-lg font-bold text-red-600">
                          {formatVND(channelFee.fee)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                        <div>
                          <span className="text-gray-500">Base Amount:</span>
                          <p className="font-medium">
                            {formatVND(demoRevenueAmount)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            Percentage ({channelFee.percentage}%):
                          </span>
                          <p className="font-medium">
                            {formatVND(
                              (demoRevenueAmount * channelFee.percentage) / 100
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Fixed Fee:</span>
                          <p className="font-medium">
                            {formatVND(channelFee.fixedFee)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 rounded bg-gray-50 p-2 text-sm">
                        <span className="text-gray-500">Net Revenue: </span>
                        <span className="font-medium text-green-600">
                          {formatVND(demoRevenueAmount - channelFee.fee)}
                        </span>
                        <span className="ml-2 text-gray-500">
                          (
                          {(
                            ((demoRevenueAmount - channelFee.fee) /
                              demoRevenueAmount) *
                            100
                          ).toFixed(1)}
                          % of gross)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import-summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Fee Summary (P1 Feature)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Overview of import phases and their associated fees
              </p>
            </CardHeader>
            <CardContent>
              {importPhases.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <DollarSign className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p className="text-lg font-medium">No import phases found</p>
                  <p className="text-sm">
                    Create import phases to see fee summaries here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {importPhases.slice(0, 5).map((phase) => {
                    const phaseFees = importFees.filter(
                      (fee) => fee.importPhaseId === phase.id
                    );
                    const totalFees = phaseFees.reduce(
                      (sum, fee) => sum + fee.amount,
                      0
                    );

                    return (
                      <div key={phase.id} className="rounded-lg border p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{phase.code}</h4>
                            <p className="text-sm text-gray-500">
                              {phase.date.toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <Badge
                            variant={
                              phase.status === 'completed'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {phase.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                          <div>
                            <span className="text-gray-500">Base Cost:</span>
                            <p className="font-medium">
                              {formatVND(phase.totalCost)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Fees:</span>
                            <p className="font-medium text-red-600">
                              {formatVND(totalFees)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Final Cost:</span>
                            <p className="font-medium text-blue-600">
                              {formatVND(phase.finalCost)}
                            </p>
                          </div>
                        </div>

                        {phaseFees.length > 0 && (
                          <div className="mt-3 text-sm">
                            <span className="text-gray-500">
                              Fee breakdown:{' '}
                            </span>
                            {phaseFees.map((fee, index) => (
                              <span key={fee.id}>
                                {fee.name} ({formatVND(fee.amount)})
                                {index < phaseFees.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {importPhases.length > 5 && (
                    <div className="py-4 text-center">
                      <Button variant="outline" size="sm">
                        View All Import Phases ({importPhases.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
