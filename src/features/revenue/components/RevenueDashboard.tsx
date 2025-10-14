/**
 * RevenueDashboard Component
 * Main dashboard for revenue tracking with comprehensive analytics
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RefreshCcwIcon,
  TrendingUpIcon,
  DollarSignIcon,
  PercentIcon,
} from 'lucide-react';
import { RevenueCard } from './RevenueCard';
import { RevenueTrendChart } from './RevenueTrendChart';
import { TopProductsWidget } from './TopProductsWidget';
import { RevenueFilters, type RevenueFiltersState } from './RevenueFilters';
import { storageService } from '@/lib/storage';
import type { Transaction, Product } from '@/types';

interface DashboardMetrics {
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  transactionCount: number;
  averageOrderValue: number;
  revenueGrowth: number;
}

interface RevenueDataPoint {
  period: string;
  revenue: number;
  profit: number;
  date: Date;
}

const defaultFilters: RevenueFiltersState = {
  dateRange: { from: null, to: null },
  period: 'monthly',
  category: 'all',
  minRevenue: null,
  maxRevenue: null,
  sortBy: 'date',
  sortOrder: 'desc',
};

export function RevenueDashboard() {
  const [filters, setFilters] = useState<RevenueFiltersState>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalProfit: 0,
    profitMargin: 0,
    transactionCount: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
  });
  const [chartData, setChartData] = useState<RevenueDataPoint[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Initialize dashboard with monthly data
  useEffect(() => {
    const initializeDashboard = () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      setFilters({
        ...defaultFilters,
        dateRange: { from: firstDayOfMonth, to: now },
      });
    };

    initializeDashboard();
  }, []);

  const loadData = async () => {
    try {
      const [transactionsData, productsData] = await Promise.all([
        storageService.getTransactions(),
        storageService.getProducts(),
      ]);

      setTransactions(transactionsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction: Transaction) => {
      // Filter by date range
      if (filters.dateRange.from || filters.dateRange.to) {
        const transactionDate = new Date(transaction.date);
        if (filters.dateRange.from && transactionDate < filters.dateRange.from)
          return false;
        if (filters.dateRange.to && transactionDate > filters.dateRange.to)
          return false;
      }

      // Filter by category
      if (filters.category !== 'all') {
        const product = products.find((p) => p.id === transaction.productId);
        if (!product || product.category !== filters.category) return false;
      }

      // Filter by revenue range
      if (filters.minRevenue && transaction.totalAmount < filters.minRevenue)
        return false;
      if (filters.maxRevenue && transaction.totalAmount > filters.maxRevenue)
        return false;

      // Only sales transactions for revenue calculations
      return transaction.type === 'sale';
    });
  }, [transactions, products, filters]);

  const calculateMetrics = useMemo(() => {
    const salesTransactions = filteredTransactions;

    if (salesTransactions.length === 0) {
      return {
        totalRevenue: 0,
        totalProfit: 0,
        profitMargin: 0,
        transactionCount: 0,
        averageOrderValue: 0,
        revenueGrowth: 0,
      };
    }

    const totalRevenue = salesTransactions.reduce(
      (sum, t) => sum + t.totalAmount,
      0
    );

    const totalProfit = salesTransactions.reduce((sum, transaction) => {
      const product = products.find((p) => p.id === transaction.productId);
      if (!product) return sum;
      return (
        sum +
        (transaction.unitPrice - product.purchasePrice) * transaction.quantity
      );
    }, 0);

    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = totalRevenue / salesTransactions.length;

    // Calculate growth (compare with previous period)
    const currentPeriodStart = filters.dateRange.from || new Date();
    const periodLength = filters.dateRange.to
      ? filters.dateRange.to.getTime() - currentPeriodStart.getTime()
      : 30 * 24 * 60 * 60 * 1000; // Default to 30 days

    const previousPeriodStart = new Date(
      currentPeriodStart.getTime() - periodLength
    );
    const previousPeriodTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        t.type === 'sale' &&
        date >= previousPeriodStart &&
        date < currentPeriodStart
      );
    });

    const previousRevenue = previousPeriodTransactions.reduce(
      (sum, t) => sum + t.totalAmount,
      0
    );
    const revenueGrowth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : totalRevenue > 0
          ? 100
          : 0;

    return {
      totalRevenue,
      totalProfit,
      profitMargin,
      transactionCount: salesTransactions.length,
      averageOrderValue,
      revenueGrowth,
    };
  }, [filteredTransactions, products, transactions, filters]);

  const calculateChartData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    // Group transactions by period
    const groupedData = new Map<
      string,
      { revenue: number; profit: number; date: Date }
    >();

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      let periodKey: string;

      switch (filters.period) {
        case 'daily':
          periodKey = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          periodKey = date.getFullYear().toString();
          break;
        default:
          periodKey = date.toISOString().split('T')[0];
      }

      const product = products.find((p) => p.id === transaction.productId);
      const profit = product
        ? (transaction.unitPrice - product.purchasePrice) * transaction.quantity
        : 0;

      if (groupedData.has(periodKey)) {
        const existing = groupedData.get(periodKey)!;
        existing.revenue += transaction.totalAmount;
        existing.profit += profit;
      } else {
        groupedData.set(periodKey, {
          revenue: transaction.totalAmount,
          profit,
          date,
        });
      }
    });

    // Convert to array and sort
    const chartData = Array.from(groupedData.entries()).map(
      ([period, data]) => ({
        period,
        revenue: data.revenue,
        profit: data.profit,
        date: data.date,
      })
    );

    return chartData.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredTransactions, products, filters.period]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };

    loadDashboardData();
  }, []);

  useEffect(() => {
    setMetrics(calculateMetrics);
    setChartData(calculateChartData);
  }, [calculateMetrics, calculateChartData]);

  const handleFiltersChange = (newFilters: RevenueFiltersState) => {
    setFilters(newFilters);
  };

  const handleFiltersApply = () => {
    // Filters are applied automatically via useMemo hooks
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500); // Visual feedback
  };

  const handleFiltersReset = () => {
    setFilters(defaultFilters);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Revenue Dashboard</h1>
          <Button disabled>
            <RefreshCcwIcon className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="mb-2 h-4 rounded bg-muted" />
                  <div className="h-8 rounded bg-muted" />
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revenue Dashboard</h1>
          <p className="text-muted-foreground">
            Track your store's revenue and profit performance
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCcwIcon
            className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <RevenueFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApply={handleFiltersApply}
        onReset={handleFiltersReset}
        loading={refreshing}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <RevenueCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          change={metrics.revenueGrowth}
          period={filters.period}
          type="revenue"
        />
        <RevenueCard
          title="Total Profit"
          value={formatCurrency(metrics.totalProfit)}
          change={metrics.profitMargin}
          period={filters.period}
          type="profit"
        />
        <RevenueCard
          title="Profit Margin"
          value={`${metrics.profitMargin.toFixed(1)}%`}
          change={metrics.profitMargin >= 30 ? 10 : -5}
          period={filters.period}
          type="margin"
        />
        <RevenueCard
          title="Transactions"
          value={metrics.transactionCount}
          change={metrics.transactionCount > 0 ? 5 : 0}
          period={filters.period}
          type="transactions"
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueTrendChart
            data={chartData}
            title={`Revenue Trends - ${filters.period.charAt(0).toUpperCase() + filters.period.slice(1)}`}
          />
        </div>
        <div>
          <TopProductsWidget
            period={
              filters.period === 'yearly' || filters.period === 'custom'
                ? 'all'
                : filters.period
            }
            limit={5}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Period Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {metrics.transactionCount}
              </div>
              <div className="text-sm text-muted-foreground">Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(metrics.totalRevenue)}
              </div>
              <div className="text-sm text-muted-foreground">Revenue</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(metrics.totalProfit)}
              </div>
              <div className="text-sm text-muted-foreground">Profit</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {metrics.revenueGrowth >= 0 ? '+' : ''}
                {metrics.revenueGrowth.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Growth</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
