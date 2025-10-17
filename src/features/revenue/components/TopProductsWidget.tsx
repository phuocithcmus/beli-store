/**
 * TopProductsWidget Component
 * Displays top-selling products with revenue and profit metrics
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { storageService } from '@/lib/storage';
import type { Product, Transaction } from '@/types';

interface TopProductMetrics {
  product: Product;
  totalRevenue: number;
  totalProfit: number;
  totalQuantitySold: number;
  averagePrice: number;
  profitMargin: number | null; // P3: null for cost-only products
}

interface TopProductsWidgetProps {
  limit?: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'all';
  className?: string;
}

export function TopProductsWidget({
  limit = 5,
  period = 'all',
  className = '',
}: TopProductsWidgetProps) {
  const [topProducts, setTopProducts] = useState<TopProductMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'revenue' | 'profit' | 'quantity'>(
    'revenue'
  );

  const periodLabels = {
    daily: 'Today',
    weekly: 'This Week',
    monthly: 'This Month',
    all: 'All Time',
  };

  useEffect(() => {
    const loadTopProducts = async () => {
      setLoading(true);
      try {
        const transactions = await storageService.getTransactions();
        const products = await storageService.getProducts();

        // Filter transactions by period if needed
        const now = new Date();
        const filteredTransactions = transactions.filter(
          (transaction: Transaction) => {
            if (period === 'all') {
              return true;
            }

            const transactionDate = new Date(transaction.date);
            const diffTime = now.getTime() - transactionDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            switch (period) {
              case 'daily':
                return diffDays <= 1;
              case 'weekly':
                return diffDays <= 7;
              case 'monthly':
                return diffDays <= 30;
              default:
                return true;
            }
          }
        );

        // Calculate metrics for each product
        const productMetrics = new Map<string, TopProductMetrics>();

        for (const transaction of filteredTransactions) {
          if (transaction.type !== 'sale') {
            continue;
          }

          const product = products.find(
            (p: Product) => p.id === transaction.productId
          );
          if (!product) {
            continue;
          }

          const revenue = transaction.totalAmount;
          const profit =
            (transaction.unitPrice - product.purchasePrice) *
            transaction.quantity;

          if (productMetrics.has(product.id)) {
            const existing = productMetrics.get(product.id);
            if (existing) {
              existing.totalRevenue += revenue;
              existing.totalProfit += profit;
              existing.totalQuantitySold += transaction.quantity;
            }
          } else {
            productMetrics.set(product.id, {
              product,
              totalRevenue: revenue,
              totalProfit: profit,
              totalQuantitySold: transaction.quantity,
              averagePrice: transaction.unitPrice,
              profitMargin:
                product.purchasePrice > 0 && product.sellingPrice
                  ? ((transaction.unitPrice - product.purchasePrice) /
                      transaction.unitPrice) *
                    100
                  : product.sellingPrice
                    ? 0
                    : null, // P3: null for cost-only products
            });
          }
        }

        // Convert to array and sort
        const metricsArray = Array.from(productMetrics.values());
        const sortedProducts = metricsArray.sort((a, b) => {
          switch (sortBy) {
            case 'revenue':
              return b.totalRevenue - a.totalRevenue;
            case 'profit':
              return b.totalProfit - a.totalProfit;
            case 'quantity':
              return b.totalQuantitySold - a.totalQuantitySold;
            default:
              return b.totalRevenue - a.totalRevenue;
          }
        });

        setTopProducts(sortedProducts.slice(0, limit));
      } catch (error) {
        console.error('Error loading top products:', error);
        setTopProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadTopProducts();
  }, [limit, period, sortBy]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getProfitMarginColor = (margin: number | null) => {
    if (margin === null) {
      return 'bg-gray-100 text-gray-800'; // P3: Color for cost-only products
    }
    if (margin >= 50) {
      return 'bg-green-100 text-green-800';
    }
    if (margin >= 30) {
      return 'bg-blue-100 text-blue-800';
    }
    if (margin >= 15) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Top Products - {periodLabels[period]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Top Products - {periodLabels[period]}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'revenue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('revenue')}
          >
            Revenue
          </Button>
          <Button
            variant={sortBy === 'profit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('profit')}
          >
            Profit
          </Button>
          <Button
            variant={sortBy === 'quantity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('quantity')}
          >
            Quantity
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {topProducts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <div className="mb-2 text-4xl">📦</div>
            <p>
              No sales data available for {periodLabels[period].toLowerCase()}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {topProducts.map((item, index) => (
              <div
                key={item.product.id}
                className="flex items-start space-x-4 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
              >
                {/* Rank */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>

                {/* Product info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="truncate text-sm font-medium">
                        {item.product.name}
                      </h4>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.product.category} • Stock:{' '}
                        {item.product.remainingQuantity}
                      </p>
                    </div>
                    {item.profitMargin !== null ? (
                      <Badge
                        className={`text-xs ${getProfitMarginColor(item.profitMargin)} ml-2`}
                      >
                        {item.profitMargin.toFixed(1)}% margin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Cost-only
                      </Badge>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(item.totalRevenue)}
                      </div>
                      <div className="text-muted-foreground">Revenue</div>
                    </div>
                    <div>
                      <div className="font-semibold text-blue-600">
                        {formatCurrency(item.totalProfit)}
                      </div>
                      <div className="text-muted-foreground">Profit</div>
                    </div>
                    <div>
                      <div className="font-semibold">
                        {item.totalQuantitySold}
                      </div>
                      <div className="text-muted-foreground">Sold</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
