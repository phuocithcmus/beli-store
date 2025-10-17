/**
 * Sales Analytics Page
 * Comprehensive sales performance analytics for variant tracking
 */

'use client';

import React, { useState } from 'react';
import { VariantAnalytics } from '@/features/products/components/VariantAnalytics';
import { SalesPerformanceReporting } from '@/lib/integration/salesPerformanceIntegration';
import { useAllVariantSales } from '@/features/products/hooks/useVariantSales';
import { formatVND } from '@/lib/currency';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  BarChart,
  DollarSign,
  Package,
  Target,
  Activity,
} from 'lucide-react';

export default function SalesAnalyticsPage() {
  const { isLoading } = useAllVariantSales();
  const [activeTab, setActiveTab] = useState('overview');

  // Generate comprehensive performance report
  const performanceReport =
    SalesPerformanceReporting.generateAllVariantsPerformanceReport();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">
              Loading sales analytics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Sales Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive sales performance analytics and insights for product
          variants
        </p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatVND(performanceReport.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Units Sold</p>
                <p className="text-2xl font-bold">
                  {performanceReport.totalUnitsSold}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Avg Turnover</p>
                <p className="text-2xl font-bold">
                  {performanceReport.averageTurnover.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                <Target className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Variants</p>
                <p className="text-2xl font-bold">
                  {performanceReport.totalVariants}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
          <TabsTrigger value="insights">Business Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Sales Overview Dashboard
              </CardTitle>
              <CardDescription>
                High-level overview of sales performance across all variants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VariantAnalytics showDashboard={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Detailed Performance Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive performance metrics and analytics for each variant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VariantAnalytics showDashboard={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-performers" className="mt-6">
          <div className="space-y-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top Performing Variants
                </CardTitle>
                <CardDescription>
                  Variants with the highest turnover rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceReport.topPerformers
                    .slice(0, 5)
                    .map((report, index) => (
                      <div
                        key={report.variant.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{report.variant.sku}</p>
                            <p className="text-sm text-gray-600">
                              {report.variant.color} • {report.variant.size} •{' '}
                              {report.variant.form}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {formatVND(report.salesSummary.totalRevenue)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {report.salesSummary.totalSold} units sold
                          </p>
                        </div>
                      </div>
                    ))}
                  {performanceReport.topPerformers.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      No sales data available yet. Start recording sales to see
                      top performers.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Slow Movers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 rotate-180 text-orange-600" />
                  Slow Moving Variants
                </CardTitle>
                <CardDescription>
                  Variants that need attention or promotion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceReport.slowMovers
                    .slice(0, 5)
                    .map((report, index) => (
                      <div
                        key={report.variant.id}
                        className="flex items-center justify-between rounded-lg border bg-orange-50 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-orange-600">
                            #{index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{report.variant.sku}</p>
                            <p className="text-sm text-gray-600">
                              {report.variant.color} • {report.variant.size} •{' '}
                              {report.variant.form}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {formatVND(report.salesSummary.totalRevenue)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Turnover:{' '}
                            {report.turnoverMetrics.turnoverRate.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  {performanceReport.slowMovers.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      No slow-moving variants identified.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Most Profitable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Most Profitable Variants
                </CardTitle>
                <CardDescription>
                  Variants with the highest profit margins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceReport.mostProfitable
                    .slice(0, 5)
                    .map((report, index) => (
                      <div
                        key={report.variant.id}
                        className="flex items-center justify-between rounded-lg border bg-green-50 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-green-600">
                            #{index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{report.variant.sku}</p>
                            <p className="text-sm text-gray-600">
                              {report.variant.color} • {report.variant.size} •{' '}
                              {report.variant.form}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {report.profitabilityMetrics.grossMargin.toFixed(1)}
                            %
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatVND(report.profitabilityMetrics.grossProfit)}{' '}
                            profit
                          </p>
                        </div>
                      </div>
                    ))}
                  {performanceReport.mostProfitable.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      No profitability data available yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* ABC Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>ABC Analysis</CardTitle>
                <CardDescription>
                  Inventory classification based on sales performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceReport.abcAnalysis.map((analysis) => (
                    <div
                      key={analysis.variant.id}
                      className="flex items-center justify-between rounded border p-3"
                    >
                      <div>
                        <p className="font-medium">{analysis.variant.sku}</p>
                        <p className="text-sm text-gray-600">
                          {analysis.variant.color} • {analysis.variant.size}
                        </p>
                      </div>
                      <Badge
                        variant={
                          analysis.classification === 'A'
                            ? 'default'
                            : analysis.classification === 'B'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        Class {analysis.classification}
                      </Badge>
                    </div>
                  ))}
                  {performanceReport.abcAnalysis.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      Not enough sales data for ABC analysis.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Business Insights</CardTitle>
                <CardDescription>
                  Actionable insights from sales data analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h4 className="font-medium text-blue-900">
                      Revenue Performance
                    </h4>
                    <p className="mt-1 text-sm text-blue-700">
                      Total revenue of{' '}
                      {formatVND(performanceReport.totalRevenue)} across{' '}
                      {performanceReport.totalVariants} variants
                    </p>
                  </div>

                  <div className="rounded-lg bg-green-50 p-4">
                    <h4 className="font-medium text-green-900">
                      Top Performers
                    </h4>
                    <p className="mt-1 text-sm text-green-700">
                      {performanceReport.topPerformers.length} variants are
                      performing above average
                    </p>
                  </div>

                  <div className="rounded-lg bg-orange-50 p-4">
                    <h4 className="font-medium text-orange-900">
                      Optimization Opportunities
                    </h4>
                    <p className="mt-1 text-sm text-orange-700">
                      {performanceReport.slowMovers.length} variants need
                      attention for improved turnover
                    </p>
                  </div>

                  <div className="rounded-lg bg-purple-50 p-4">
                    <h4 className="font-medium text-purple-900">
                      Profitability
                    </h4>
                    <p className="mt-1 text-sm text-purple-700">
                      {performanceReport.mostProfitable.length} variants show
                      strong profit margins
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
