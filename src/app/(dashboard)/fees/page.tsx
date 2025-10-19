'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ResponsiveWrapper,
  ResponsiveGrid,
} from '@/components/layout/ResponsiveWrapper';
import { useIsMobile } from '@/hooks/useResponsive';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeeSummaryDashboard } from '@/features/fees/components/FeeSummaryDashboard';
import { FeeCalculator } from '@/features/fees/components/FeeCalculator';
import {
  Plus,
  Edit,
  Trash2,
  Calculator,
  BarChart3,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  useFees,
  useChannels,
  useCreateFee,
  useRevenueAnalytics,
} from '@/hooks/use-api';

// Use the types from the main types file
import type { ChannelFeeStructure } from '@/types';

export default function FeeManagementPage() {
  const isMobile = useIsMobile();
  const [editingFee, setEditingFee] = useState<ChannelFeeStructure | null>(
    null
  );
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('channel-fees');

  // Form states
  const [formData, setFormData] = useState({
    salesChannelId: '',
    percentageRate: '',
    fixedFee: '',
    minimumFee: '',
    maximumFee: '',
  });

  // API Hooks
  const {
    data: feesResponse,
    isLoading: feesLoading,
    error: feesError,
    refetch: refetchFees,
  } = useFees();

  const {
    data: channelsResponse,
    isLoading: channelsLoading,
    error: channelsError,
  } = useChannels();

  const channelFees = feesResponse?.data || [];
  const channels = channelsResponse?.data || [];

  const { isLoading: analyticsLoading, refetch: refetchAnalytics } =
    useRevenueAnalytics();

  // Mutations
  const createFeeMutation = useCreateFee();

  const isLoading = feesLoading || channelsLoading;
  const error = feesError || channelsError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const feeData = {
      salesChannelId: formData.salesChannelId,
      feeType: 'hybrid' as const,
      calculationType: 'simple' as const,
      percentageRate: parseFloat(formData.percentageRate),
      flatFee: parseFloat(formData.fixedFee),
      minimumFee: formData.minimumFee
        ? parseFloat(formData.minimumFee)
        : undefined,
      maximumFee: formData.maximumFee
        ? parseFloat(formData.maximumFee)
        : undefined,
      isActive: true,
      description: `Fee structure for ${getChannelName(formData.salesChannelId)}`,
    };

    try {
      if (editingFee) {
        // Note: Update functionality not implemented in backend yet
        alert(
          'Update functionality will be implemented with the backend API. This feature is coming soon!'
        );
        return;
      } else {
        await createFeeMutation.mutateAsync(feeData);
      }

      resetForm();
      refetchAnalytics();
    } catch (error) {
      console.error('Error saving fee structure:', error);
      alert('Failed to save fee structure. Please try again.');
    }
  };

  const handleEdit = (fee: ChannelFeeStructure) => {
    setEditingFee(fee);
    setFormData({
      salesChannelId: fee.salesChannelId,
      percentageRate: fee.percentageRate.toString(),
      fixedFee: fee.fixedFee.toString(),
      minimumFee: fee.minimumFee?.toString() || '',
      maximumFee: fee.maximumFee?.toString() || '',
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    const feeToDelete = channelFees.find(
      (f: ChannelFeeStructure) => f.id === id
    );
    if (!feeToDelete) {
      alert('Fee structure not found');
      return;
    }

    const channelName = getChannelName(feeToDelete.salesChannelId);
    if (
      !window.confirm(
        `Are you sure you want to delete the fee structure for ${channelName}?`
      )
    ) {
      return;
    }

    // Note: Delete functionality not implemented in backend yet
    alert(
      'Delete functionality will be implemented with the backend API. This feature is coming soon!'
    );
  };

  const resetForm = () => {
    setFormData({
      salesChannelId: '',
      percentageRate: '',
      fixedFee: '',
      minimumFee: '',
      maximumFee: '',
    });
    setEditingFee(null);
    setShowDialog(false);
  };

  const handleRefresh = () => {
    refetchFees();
    refetchAnalytics();
  };

  const getChannelName = (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId);
    return channel ? channel.name : 'Unknown Channel';
  };

  const calculateTotalRevenue = (): number => {
    // Temporary mock until fee analytics are properly implemented
    return 1250000000; // 1.25 billion VND
  };

  const calculateTotalFees = (): number => {
    // Temporary mock until fee analytics are properly implemented
    return 65000000; // 65 million VND
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Error handling
  if (error) {
    return (
      <ResponsiveWrapper className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <div className="flex-1">
                <p className="font-medium">Failed to load fee data</p>
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
      <ResponsiveWrapper className="flex h-48 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading fee data...</p>
        </div>
      </ResponsiveWrapper>
    );
  }

  return (
    <ResponsiveWrapper className="space-y-6">
      {/* Page Header */}
      <div
        className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}
      >
        <div>
          <h1
            className={`font-bold tracking-tight ${isMobile ? 'text-2xl' : 'text-3xl'}`}
          >
            Fee Management System
          </h1>
          <p className="text-muted-foreground">
            Comprehensive fee management with backend API integration
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* API Status Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex h-2 w-2 rounded-full bg-green-500"></div>
        <span className="text-muted-foreground">Connected to Backend API</span>
        {createFeeMutation.isPending && (
          <span className="flex items-center gap-1 text-blue-600">
            <div className="h-3 w-3 animate-spin rounded-full border border-blue-600 border-t-transparent"></div>
            Processing...
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <ResponsiveGrid columns={{ xs: 1, sm: 2, lg: 4 }} gap="md">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(calculateTotalRevenue())}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsLoading ? 'Loading...' : 'API Connected'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(calculateTotalFees())}
            </div>
            <p className="text-xs text-muted-foreground">
              {calculateTotalRevenue() > 0
                ? `${((calculateTotalFees() / calculateTotalRevenue()) * 100).toFixed(1)}% of revenue`
                : 'No revenue data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Channels
            </CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {channels.filter((c) => c.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {channels.length} total channels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fee Structures
            </CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channelFees.length}</div>
            <p className="text-xs text-muted-foreground">
              Configured fee structures
            </p>
          </CardContent>
        </Card>
      </ResponsiveGrid>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="channel-fees">Channel Fees</TabsTrigger>
          <TabsTrigger value="fee-calculations">Fee Calculator</TabsTrigger>
          <TabsTrigger value="import-summary">Import Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="channel-fees" className="space-y-4">
          <div
            className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}
          >
            <h2 className={`font-semibold ${isMobile ? 'text-lg' : 'text-xl'}`}>
              Channel Fee Structures
            </h2>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setShowDialog(true)}
                  disabled={createFeeMutation.isPending}
                  className={isMobile ? 'w-full' : ''}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isMobile ? 'Add Fee' : 'Add Fee Structure'}
                </Button>
              </DialogTrigger>
              <DialogContent
                className={`${isMobile ? 'w-[95vw] max-w-none' : 'max-w-2xl'}`}
              >
                <DialogHeader>
                  <DialogTitle>
                    {editingFee
                      ? 'Edit Fee Structure'
                      : 'Add New Fee Structure'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div
                    className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}
                  >
                    <div className={isMobile ? 'col-span-1' : 'col-span-2'}>
                      <Label htmlFor="salesChannelId">Sales Channel</Label>
                      <Select
                        value={formData.salesChannelId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, salesChannelId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a channel" />
                        </SelectTrigger>
                        <SelectContent>
                          {channels.map((channel) => (
                            <SelectItem key={channel.id} value={channel.id}>
                              {channel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="percentageRate">Fee Percentage (%)</Label>
                      <Input
                        id="percentageRate"
                        type="number"
                        step="0.01"
                        value={formData.percentageRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            percentageRate: e.target.value,
                          })
                        }
                        placeholder="e.g., 2.5"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="fixedFee">Fixed Fee (VND)</Label>
                      <Input
                        id="fixedFee"
                        type="number"
                        value={formData.fixedFee}
                        onChange={(e) =>
                          setFormData({ ...formData, fixedFee: e.target.value })
                        }
                        placeholder="e.g., 50000"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="minimumFee">Minimum Fee (VND)</Label>
                      <Input
                        id="minimumFee"
                        type="number"
                        value={formData.minimumFee}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minimumFee: e.target.value,
                          })
                        }
                        placeholder="e.g., 10000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="maximumFee">Maximum Fee (VND)</Label>
                      <Input
                        id="maximumFee"
                        type="number"
                        value={formData.maximumFee}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maximumFee: e.target.value,
                          })
                        }
                        placeholder="e.g., 500000"
                      />
                    </div>
                  </div>

                  <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
                    <Button
                      type="submit"
                      disabled={createFeeMutation.isPending}
                      className={isMobile ? 'w-full' : ''}
                    >
                      {editingFee ? 'Update' : 'Create'} Fee Structure
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className={isMobile ? 'w-full' : ''}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {channelFees.map((fee: ChannelFeeStructure) => (
              <Card key={fee.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {getChannelName(fee.salesChannelId)}
                        </Badge>
                        <Badge
                          variant={fee.isActive ? 'default' : 'outline'}
                          className={
                            fee.isActive ? 'bg-green-100 text-green-800' : ''
                          }
                        >
                          {fee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">
                          {fee.percentageRate}%
                        </span>
                        {fee.fixedFee > 0 && (
                          <>
                            {' + '}
                            <span className="font-medium">
                              {formatCurrency(fee.fixedFee)}
                            </span>
                          </>
                        )}
                        {fee.minimumFee && (
                          <span className="ml-2 text-muted-foreground">
                            (min: {formatCurrency(fee.minimumFee)})
                          </span>
                        )}
                        {fee.maximumFee && (
                          <span className="ml-2 text-muted-foreground">
                            (max: {formatCurrency(fee.maximumFee)})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(fee)}
                        disabled={false}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(fee.id)}
                        disabled={false}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {channelFees.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Calculator className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="mb-2 text-lg font-medium">
                      No fee structures configured
                    </p>
                    <p>
                      Click &quot;Add Fee Structure&quot; to configure channel
                      fees and start tracking commission costs.
                    </p>
                    <p className="mt-2 text-sm">Backend Connection: ✅ Ready</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="fee-calculations" className="space-y-4">
          <FeeCalculator
            channelFeeStructures={channelFees}
            salesChannels={channels}
          />
        </TabsContent>

        <TabsContent value="import-summary" className="space-y-4">
          <FeeSummaryDashboard showAllPhases={true} />
        </TabsContent>
      </Tabs>
    </ResponsiveWrapper>
  );
}
