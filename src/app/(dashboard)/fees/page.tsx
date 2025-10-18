'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { storageService } from '@/lib/storage';
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
} from 'lucide-react';

// Use the types from the main types file
import type { ChannelFeeStructure, SalesChannel } from '@/types';

export default function FeeManagementPage() {
  const isMobile = useIsMobile();
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [channelFees, setChannelFees] = useState<ChannelFeeStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingFee, setEditingFee] = useState<ChannelFeeStructure | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('channel-fees');

  // Form states
  const [formData, setFormData] = useState({
    salesChannelId: '',
    percentageRate: '',
    fixedFee: '',
    minimumFee: '',
    maximumFee: '',
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [channelsData, feesData] = await Promise.all([
        storageService.getSalesChannels(),
        storageService.getChannelFeeStructures(),
      ]);
      setChannels(channelsData);
      setChannelFees(feesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const feeData: Omit<ChannelFeeStructure, 'id' | 'createdAt' | 'updatedAt'> =
      {
        salesChannelId: formData.salesChannelId,
        percentageRate: parseFloat(formData.percentageRate),
        fixedFee: parseFloat(formData.fixedFee),
        minimumFee: formData.minimumFee
          ? parseFloat(formData.minimumFee)
          : undefined,
        maximumFee: formData.maximumFee
          ? parseFloat(formData.maximumFee)
          : undefined,
        isActive: true,
      };

    try {
      if (editingFee) {
        await storageService.updateChannelFeeStructure(editingFee.id, feeData);
      } else {
        await storageService.saveChannelFeeStructure(feeData);
      }

      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving fee structure:', error);
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
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this fee structure?')) {
      try {
        await storageService.deleteChannelFeeStructure(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting fee structure:', error);
      }
    }
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
    setShowForm(false);
  };

  const getChannelName = (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId);
    return channel ? channel.name : 'Unknown Channel';
  };

  const calculateTotalRevenue = () => {
    // Mock calculation for demonstration
    return 1250000000; // 1.25 billion VND
  };

  const calculateTotalFees = () => {
    // Mock calculation for demonstration
    return 65000000; // 65 million VND
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <ResponsiveWrapper className="flex h-48 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="mt-4 text-muted-foreground">Loading fee data...</p>
        </div>
      </ResponsiveWrapper>
    );
  }

  return (
    <ResponsiveWrapper className="space-y-6">
      {/* Page Header */}
      <div>
        <h1
          className={`font-bold tracking-tight ${isMobile ? 'text-2xl' : 'text-3xl'}`}
        >
          Fee Management System
        </h1>
        <p className="text-muted-foreground">
          Comprehensive fee management with import costs (P1) and channel fees
          (P2)
        </p>
      </div>

      {/* Summary Cards */}
      <ResponsiveGrid columns={{ xs: 1, sm: 2, lg: 4 }} gap="md">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(calculateTotalRevenue())}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(calculateTotalFees())}
            </div>
            <p className="text-xs text-muted-foreground">
              5.2% of total revenue
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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Channel Fee Structures</h2>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Fee Structure
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingFee ? 'Edit Fee Structure' : 'Add New Fee Structure'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
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

                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingFee ? 'Update' : 'Create'} Fee Structure
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {channelFees.map((fee) => (
              <Card key={fee.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {getChannelName(fee.salesChannelId)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {fee.isActive ? 'Active' : 'Inactive'}
                        </span>
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
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(fee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(fee.id)}
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
                    No fee structures configured yet. Click &quot;Add Fee
                    Structure&quot; to get started.
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
