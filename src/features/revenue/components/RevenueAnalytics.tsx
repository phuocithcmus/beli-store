'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Target,
} from 'lucide-react';
import type { RevenueAnalyticsProps } from '@/features/revenue/types/revenue';
import type {
  RevenueAnalyticsData,
  RevenuePeriod,
} from '@/features/revenue/types/revenue';
import { ProfitabilityAnalysis } from './ProfitabilityAnalysis';
import { ProfitSummaryCard } from './ProfitSummaryCard';
import { storageService } from '@/lib/storage';
import type { RevenueEntry } from '@/types';

// Currency formatter using VND
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Number formatter using Vietnamese locale
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

// Percentage formatter
const formatPercentage = (percentage: number): string => {
  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
};

// Growth indicator component
function GrowthIndicator({ growth }: { growth: number }) {
  if (growth > 0) {
    return (
      <div className="flex items-center text-green-600">
        <TrendingUp className="mr-1 h-4 w-4" />
        <span className="text-sm font-medium">{formatPercentage(growth)}</span>
      </div>
    );
  } else if (growth < 0) {
    return (
      <div className="flex items-center text-red-600">
        <TrendingDown className="mr-1 h-4 w-4" />
        <span className="text-sm font-medium">{formatPercentage(growth)}</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center text-gray-500">
        <Minus className="mr-1 h-4 w-4" />
        <span className="text-sm font-medium">0.0%</span>
      </div>
    );
  }
}

/**
 * Analytics dashboard component for revenue tracking
 * Displays comprehensive revenue metrics, trends, and performance data
 */
export function RevenueAnalytics({
  data,
  loading = false,
  error,
  period = 'month',
  onPeriodChange,
  onRefresh,
}: RevenueAnalyticsProps & {
  data: RevenueAnalyticsData | null;
  loading?: boolean;
  error?: string | null;
  period?: RevenuePeriod;
  onPeriodChange?: (period: RevenuePeriod) => void;
  onRefresh?: () => void;
}) {
  // Fetch revenue entries for profit analysis
  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([]);

  useEffect(() => {
    try {
      // Get all revenue entries for profit calculation
      const entries = storageService.getRevenueEntries();
      setRevenueEntries(entries);
    } catch (error) {
      console.error(
        'Failed to fetch revenue entries for profit analysis:',
        error
      );
      setRevenueEntries([]);
    }
  }, [data]); // Refresh when analytics data changes
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading analytics: {error}</p>
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh} className="mt-2">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
                  <div className="h-8 w-3/4 rounded bg-gray-200"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Revenue Analytics</h2>
        <div className="flex items-center gap-4">
          {/* Period Selector */}
          {onPeriodChange && (
            <Select
              value={period}
              onValueChange={(value) => onPeriodChange(value as RevenuePeriod)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics - Enhanced with P2 Net Revenue */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Gross Revenue
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.totalRevenue)}
                </p>
                <GrowthIndicator growth={data.revenueGrowth} />
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Net Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.totalNetRevenue || data.totalRevenue)}
                </p>
                <p className="mt-1 text-xs text-gray-500">After channel fees</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-700" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Channel Fees
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.totalChannelFees || 0)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {data.totalRevenue > 0
                    ? `${(((data.totalChannelFees || 0) / data.totalRevenue) * 100).toFixed(1)}% of gross`
                    : '0% of gross'}
                </p>
              </div>
              <Target className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Orders
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(data.totalOrders)}
                </p>
                <GrowthIndicator growth={data.quantityGrowth} />
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Comparison Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <p className="text-sm text-gray-500">
            Financial performance with channel fee impact analysis
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-medium text-gray-700">
                  Average Order Value
                </h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Gross AOV:</span>
                  <span className="font-medium">
                    {formatCurrency(data.averageOrderValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Net AOV:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(
                      data.averageNetOrderValue || data.averageOrderValue
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg Fee/Order:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(data.averageFeePerOrder || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-medium text-gray-700">Quantity & Items</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Items Sold:</span>
                  <span className="font-medium">
                    {formatNumber(data.totalQuantity)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg Items/Order:</span>
                  <span className="font-medium">
                    {(data.totalOrders > 0
                      ? data.totalQuantity / data.totalOrders
                      : 0
                    ).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-medium text-gray-700">Fee Impact</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Fee Percentage:</span>
                  <span className="font-medium text-red-600">
                    {data.totalRevenue > 0
                      ? `${(((data.totalChannelFees || 0) / data.totalRevenue) * 100).toFixed(2)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Net Margin:</span>
                  <span className="font-medium text-green-600">
                    {data.totalRevenue > 0
                      ? `${(((data.totalNetRevenue || data.totalRevenue) / data.totalRevenue) * 100).toFixed(1)}%`
                      : '100%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProducts.length === 0 ? (
                <p className="py-4 text-center text-gray-500">
                  No product data available
                </p>
              ) : (
                data.topProducts.map((product, index) => (
                  <div
                    key={product.productName}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-sm text-gray-500">
                          {formatNumber(product.quantity)} sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(product.revenue)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(product.averagePrice)}/unit
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Channels */}
        <Card>
          <CardHeader>
            <CardTitle>Top Sales Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topChannels.length === 0 ? (
                <p className="py-4 text-center text-gray-500">
                  No channel data available
                </p>
              ) : (
                data.topChannels.map((channel, index) => (
                  <div
                    key={channel.channelName}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{channel.channelName}</p>
                        <p className="text-sm text-gray-500">
                          {formatNumber(channel.orderCount)} orders
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(channel.revenue)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(channel.averageOrderValue)} AOV
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance - Enhanced with P2 Channel Fee Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
          <p className="text-sm text-gray-500">Gross vs Net Revenue Analysis</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.channelPerformance.map((channel) => (
                <div key={channel.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-medium">{channel.name}</h4>
                    <Badge
                      variant={
                        channel.marketShare > 30 ? 'default' : 'secondary'
                      }
                    >
                      {channel.marketShare.toFixed(1)}% share
                    </Badge>
                  </div>

                  {/* Revenue Metrics */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gross Revenue:</span>
                      <span className="font-medium">
                        {formatCurrency(channel.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Channel Fees:</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(channel.totalFees || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium text-gray-900">
                        Net Revenue:
                      </span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(channel.netRevenue || channel.revenue)}
                      </span>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="mt-3 space-y-2 border-t pt-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Orders:</span>
                      <span className="font-medium">
                        {formatNumber(channel.orders)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gross AOV:</span>
                      <span className="font-medium">
                        {formatCurrency(channel.averageOrderValue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Net AOV:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(
                          channel.averageNetOrderValue ||
                            channel.averageOrderValue
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg Fee/Order:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(channel.averageFeePerTransaction || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Market Share Comparison */}
                  <div className="mt-3 space-y-2 border-t pt-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gross Share:</span>
                      <span className="font-medium">
                        {channel.marketShare.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Net Share:</span>
                      <span className="font-medium text-green-600">
                        {(
                          channel.netMarketShare || channel.marketShare
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trends */}
      {data.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.trends.map((trend) => (
                <div
                  key={trend.period}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <div>
                    <p className="font-medium">{trend.period}</p>
                    <p className="text-sm text-gray-500">
                      {formatNumber(trend.orders)} orders
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(trend.revenue)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatNumber(trend.quantity)} items
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Phase Profit Summary */}
      <ProfitSummaryCard
        entries={revenueEntries}
        title="Import Phase Profit Analysis"
        period={period.charAt(0).toUpperCase() + period.slice(1)}
        showTrends={true}
        className="mb-6"
      />

      {/* Enhanced Profitability Analysis - P2 Integration */}
      {data.channelPerformance.length > 0 && (
        <ProfitabilityAnalysis
          channelData={data.channelPerformance.map((channel) => ({
            channelId: channel.id,
            channelName: channel.name,
            revenue: channel.revenue,
            netRevenue: channel.netRevenue || channel.revenue,
            totalFees: channel.totalFees || 0,
            transactions: channel.orders,
            quantity: 0, // Not available in channelPerformance
            marketShare: channel.marketShare,
            netMarketShare: channel.netMarketShare || channel.marketShare,
            averageOrderValue: channel.averageOrderValue,
            averageNetOrderValue:
              channel.averageNetOrderValue || channel.averageOrderValue,
            averageFeePerTransaction: channel.averageFeePerTransaction || 0,
          }))}
          totalRevenue={data.totalRevenue}
          totalNetRevenue={data.totalNetRevenue || data.totalRevenue}
        />
      )}
    </div>
  );
}
