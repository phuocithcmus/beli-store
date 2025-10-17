/**
 * Variant Analytics Component
 * Displays analytics and performance metrics for product variants
 */

'use client';

import React, { useState } from 'react';
import {
  useVariantAnalytics,
  useVariantDashboard,
} from '@/features/products/hooks/useVariantAnalytics';
import { formatVND } from '@/lib/currency';

interface VariantAnalyticsProps {
  variantId?: string;
  showDashboard?: boolean;
  className?: string;
}

export function VariantAnalytics({
  variantId,
  showDashboard = false,
  className,
}: VariantAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'performance' | 'inventory' | 'forecast'
  >('overview');

  const {
    variantPerformance,
    topPerformingVariants,
    lowStockVariants,
    slowMovingVariants,
    profitableVariants,
    isLoading,
    error,
    refreshAnalytics,
  } = useVariantAnalytics(variantId);

  const {
    metrics: dashboardMetrics,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refreshDashboard,
  } = useVariantDashboard();

  const handleRefresh = () => {
    refreshAnalytics();
    if (showDashboard) {
      refreshDashboard();
    }
  };

  if (isLoading || (showDashboard && isDashboardLoading)) {
    return (
      <div
        className={`flex items-center justify-center p-8 ${className || ''}`}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error || (showDashboard && dashboardError)) {
    return (
      <div
        className={`rounded-md border border-red-200 bg-red-50 p-4 ${className || ''}`}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading analytics
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error || dashboardError}</p>
            </div>
            <div className="mt-3">
              <button
                onClick={handleRefresh}
                className="rounded bg-red-100 px-3 py-1 text-sm text-red-800 hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {showDashboard ? 'Variant Analytics Dashboard' : 'Variant Analytics'}
        </h2>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Dashboard Overview */}
      {showDashboard && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    Total Variants
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardMetrics.totalVariants}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    Total Revenue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatVND(dashboardMetrics.totalSalesRevenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    Inventory Value
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatVND(dashboardMetrics.totalInventoryValue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    Low Stock Alerts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardMetrics.lowStockCount +
                      dashboardMetrics.outOfStockCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Variant Performance */}
      {variantPerformance && !showDashboard && (
        <div className="rounded-lg bg-white shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'performance', label: 'Performance' },
                { key: 'inventory', label: 'Inventory' },
                { key: 'forecast', label: 'Forecast' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() =>
                    setActiveTab(
                      tab.key as
                        | 'overview'
                        | 'performance'
                        | 'inventory'
                        | 'forecast'
                    )
                  }
                  className={`border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab performance={variantPerformance} />
            )}
            {activeTab === 'performance' && (
              <PerformanceTab performance={variantPerformance} />
            )}
            {activeTab === 'inventory' && (
              <InventoryTab performance={variantPerformance} />
            )}
            {activeTab === 'forecast' && (
              <ForecastTab performance={variantPerformance} />
            )}
          </div>
        </div>
      )}

      {/* Multi-Variant Analytics */}
      {showDashboard && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Performing Variants */}
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Top Performing Variants
              </h3>
            </div>
            <div className="p-6">
              <VariantList
                variants={topPerformingVariants.slice(0, 5)}
                showRevenue
              />
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Low Stock Alerts
              </h3>
            </div>
            <div className="p-6">
              <VariantList variants={lowStockVariants.slice(0, 5)} showStock />
            </div>
          </div>

          {/* Slow Moving Variants */}
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Slow Moving Variants
              </h3>
            </div>
            <div className="p-6">
              <VariantList
                variants={slowMovingVariants.slice(0, 5)}
                showTurnover
              />
            </div>
          </div>

          {/* Most Profitable Variants */}
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Most Profitable Variants
              </h3>
            </div>
            <div className="p-6">
              <VariantList
                variants={profitableVariants.slice(0, 5)}
                showMargin
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tab Components
interface TabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  performance: any; // Will be typed properly in real implementation
}

function OverviewTab({ performance }: TabProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">
          {performance.salesSummary.totalSold}
        </div>
        <div className="text-sm text-gray-500">Units Sold</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">
          ${performance.salesSummary.totalRevenue.toFixed(2)}
        </div>
        <div className="text-sm text-gray-500">Total Revenue</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">
          ${performance.salesSummary.averagePrice.toFixed(2)}
        </div>
        <div className="text-sm text-gray-500">Avg Price</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">
          {performance.inventoryStatus.availableQuantity}
        </div>
        <div className="text-sm text-gray-500">Available</div>
      </div>
    </div>
  );
}

function PerformanceTab({ performance }: TabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="text-lg font-semibold">
            {performance.profitabilityMetrics.grossMargin.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Gross Margin</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="text-lg font-semibold">
            {performance.turnoverMetrics.turnoverRate.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Turnover Rate</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="text-lg font-semibold">
            ${performance.profitabilityMetrics.grossProfit.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Gross Profit</div>
        </div>
      </div>
    </div>
  );
}

function InventoryTab({ performance }: TabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
        <span className="text-sm font-medium">Status:</span>
        <span
          className={`rounded px-2 py-1 text-sm ${getStatusColor(performance.inventoryStatus.status)}`}
        >
          {performance.inventoryStatus.message}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-lg font-semibold">
            {performance.turnoverMetrics.averageDailySales}
          </div>
          <div className="text-sm text-gray-600">Avg Daily Sales</div>
        </div>
        <div>
          <div className="text-lg font-semibold">
            {performance.turnoverMetrics.daysOfInventoryRemaining === Infinity
              ? '∞'
              : Math.round(
                  performance.turnoverMetrics.daysOfInventoryRemaining
                )}
          </div>
          <div className="text-sm text-gray-600">Days of Inventory</div>
        </div>
      </div>
    </div>
  );
}

function ForecastTab({ performance }: TabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="text-lg font-semibold">
            {performance.forecast.predictedSales}
          </div>
          <div className="text-sm text-gray-600">Predicted Sales (30 days)</div>
        </div>
        <div className="rounded-lg bg-green-50 p-4">
          <div className="text-lg font-semibold">
            {performance.forecast.recommendedRestockQuantity}
          </div>
          <div className="text-sm text-gray-600">Recommended Restock</div>
        </div>
      </div>
      <div className="rounded-lg bg-gray-50 p-4">
        <div className="text-sm">
          <span className="font-medium">Forecast Accuracy:</span>
          <span
            className={`ml-2 rounded px-2 py-1 text-xs ${
              performance.forecast.forecastAccuracy === 'high'
                ? 'bg-green-100 text-green-800'
                : performance.forecast.forecastAccuracy === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {performance.forecast.forecastAccuracy.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface VariantListProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variants: any[];
  showRevenue?: boolean;
  showStock?: boolean;
  showTurnover?: boolean;
  showMargin?: boolean;
}

function VariantList({
  variants,
  showRevenue,
  showStock,
  showTurnover,
  showMargin,
}: VariantListProps) {
  if (variants.length === 0) {
    return <div className="text-sm text-gray-500">No data available</div>;
  }

  return (
    <div className="space-y-3">
      {variants.map((item) => (
        <div
          key={item.variant.id}
          className="flex items-center justify-between py-2"
        >
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              {item.variant.sku}
            </div>
            <div className="text-xs text-gray-500">
              {item.variant.color} • {item.variant.size} • {item.variant.form}
            </div>
          </div>
          <div className="text-right">
            {showRevenue && (
              <div className="text-sm font-medium">
                ${item.salesSummary.totalRevenue.toFixed(2)}
              </div>
            )}
            {showStock && (
              <div className="text-sm font-medium">
                {item.inventoryStatus.availableQuantity} available
              </div>
            )}
            {showTurnover && (
              <div className="text-sm font-medium">
                {item.turnoverMetrics.daysOfInventoryRemaining === Infinity
                  ? '∞'
                  : Math.round(
                      item.turnoverMetrics.daysOfInventoryRemaining
                    )}{' '}
                days
              </div>
            )}
            {showMargin && (
              <div className="text-sm font-medium">
                {item.profitabilityMetrics.grossMargin.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'out-of-stock':
      return 'bg-red-100 text-red-800';
    case 'low-stock':
      return 'bg-yellow-100 text-yellow-800';
    case 'in-stock':
      return 'bg-green-100 text-green-800';
    case 'overstocked':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
