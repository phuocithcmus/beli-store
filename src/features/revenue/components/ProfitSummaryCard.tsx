/**
 * ProfitSummaryCard Component
 * Displays aggregated profit information for multiple revenue entries
 * Shows total profit, average margin, and profit trends
 */

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { formatVND } from '@/lib/currency';
import { formatProfitMargin } from '@/lib/utils/profit';
import { storageService } from '@/lib/storage';
import type { RevenueEntry } from '@/types';

interface ProfitSummaryCardProps {
  entries: RevenueEntry[];
  title?: string;
  className?: string;
  showTrends?: boolean;
  period?: string; // e.g., "This Month", "Last 30 Days"
}

interface ProfitSummaryData {
  totalProfit: number;
  totalRevenue: number;
  totalCost: number;
  averageMargin: number;
  profitableEntries: number;
  totalEntries: number;
  highestMargin: number;
  lowestMargin: number;
  trends: {
    profitTrend: 'up' | 'down' | 'neutral';
    marginTrend: 'up' | 'down' | 'neutral';
  };
}

/**
 * Calculate comprehensive profit summary from revenue entries
 */
function calculateProfitSummary(entries: RevenueEntry[]): ProfitSummaryData {
  let totalProfit = 0;
  let totalRevenue = 0;
  let totalCost = 0;
  let profitableEntries = 0;
  const margins: number[] = [];

  entries.forEach((entry) => {
    // Only include entries with import phase for accurate profit calculation
    if (!entry.importPhaseId) {
      return;
    }

    try {
      const profit = storageService.calculateRevenueEntryProfit(entry);
      if (profit && profit.costPrice !== null) {
        const revenue = entry.netAmount || entry.amount;
        const cost = profit.costPrice * entry.quantity;
        const entryProfit = profit.profit; // Use 'profit' property instead of 'grossProfit'
        const margin = profit.profitMargin;

        totalProfit += entryProfit;
        totalRevenue += revenue;
        totalCost += cost;
        margins.push(margin);

        if (entryProfit > 0) {
          profitableEntries++;
        }
      }
    } catch (error) {
      console.warn(`Could not calculate profit for entry ${entry.id}:`, error);
    }
  });

  const averageMargin =
    margins.length > 0
      ? margins.reduce((sum, margin) => sum + margin, 0) / margins.length
      : 0;
  const highestMargin = margins.length > 0 ? Math.max(...margins) : 0;
  const lowestMargin = margins.length > 0 ? Math.min(...margins) : 0;

  // Simple trend calculation (could be enhanced with historical data)
  const profitTrend: 'up' | 'down' | 'neutral' =
    totalProfit > 0 ? 'up' : totalProfit < 0 ? 'down' : 'neutral';
  const marginTrend: 'up' | 'down' | 'neutral' =
    averageMargin > 20 ? 'up' : averageMargin < 10 ? 'down' : 'neutral';

  return {
    totalProfit,
    totalRevenue,
    totalCost,
    averageMargin,
    profitableEntries,
    totalEntries: entries.filter((e) => e.importPhaseId).length, // Only count entries with import phase
    highestMargin,
    lowestMargin,
    trends: {
      profitTrend,
      marginTrend,
    },
  };
}

export function ProfitSummaryCard({
  entries,
  title = 'Profit Summary',
  className = '',
  showTrends = true,
  period,
}: ProfitSummaryCardProps) {
  const summaryData = useMemo(() => {
    return calculateProfitSummary(entries);
  }, [entries]);

  const {
    totalProfit,
    totalRevenue,
    averageMargin,
    profitableEntries,
    totalEntries,
    highestMargin,
    lowestMargin,
    trends,
  } = summaryData;

  const profitabilityRate =
    totalEntries > 0 ? (profitableEntries / totalEntries) * 100 : 0;

  // No data to show
  if (totalEntries === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
            {period && <Badge variant="outline">{period}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <DollarSign className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-sm">No profit data available</p>
            <p className="mt-1 text-xs">
              Link revenue entries to import phases for profit tracking
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
            {period && <Badge variant="outline">{period}</Badge>}
          </div>
          {showTrends && (
            <div className="flex items-center gap-2">
              {trends.profitTrend === 'up' && (
                <TrendingUp className="h-4 w-4 text-green-600" />
              )}
              {trends.profitTrend === 'down' && (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              {trends.marginTrend === 'up' && (
                <Badge variant="default" className="text-xs">
                  Strong Margins
                </Badge>
              )}
              {trends.marginTrend === 'down' && (
                <Badge variant="destructive" className="text-xs">
                  Low Margins
                </Badge>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main profit metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="mb-1 text-2xl font-bold">
              <span
                className={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}
              >
                {formatVND(totalProfit)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">Total Profit</div>
          </div>
          <div className="text-center">
            <div className="mb-1 text-2xl font-bold">
              {formatProfitMargin(averageMargin)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Margin</div>
          </div>
        </div>

        {/* Profitability rate */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Profitability Rate</span>
            <span className="font-medium">{profitabilityRate.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-green-600 transition-all duration-300"
              style={{ width: `${Math.min(profitabilityRate, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {profitableEntries} of {totalEntries} entries profitable
            </span>
            <span>{totalEntries - profitableEntries} unprofitable</span>
          </div>
        </div>

        {/* Margin range */}
        <div className="grid grid-cols-2 gap-4 border-t pt-2">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {formatProfitMargin(highestMargin)}
            </div>
            <div className="text-xs text-muted-foreground">Highest Margin</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600">
              {formatProfitMargin(lowestMargin)}
            </div>
            <div className="text-xs text-muted-foreground">Lowest Margin</div>
          </div>
        </div>

        {/* Financial breakdown */}
        <div className="space-y-2 border-t pt-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Revenue:</span>
            <span className="font-medium">{formatVND(totalRevenue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Cost:</span>
            <span className="font-medium text-red-600">
              {formatVND(summaryData.totalCost)}
            </span>
          </div>
        </div>

        {/* Performance indicators */}
        <div className="flex flex-wrap gap-2 border-t pt-2">
          {averageMargin > 30 && (
            <Badge variant="default" className="text-xs">
              <TrendingUp className="mr-1 h-3 w-3" />
              Excellent Margins
            </Badge>
          )}
          {profitabilityRate >= 80 && (
            <Badge variant="default" className="text-xs">
              High Profitability
            </Badge>
          )}
          {profitabilityRate < 50 && (
            <Badge variant="destructive" className="text-xs">
              <TrendingDown className="mr-1 h-3 w-3" />
              Low Profitability
            </Badge>
          )}
          {totalEntries > 0 && (
            <Badge variant="outline" className="text-xs">
              {totalEntries} entries analyzed
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfitSummaryCard;
