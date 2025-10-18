/**
 * ProfitDisplay Component
 * Displays profit information for revenue entries with import phase association
 * Shows profit amount, margin, cost breakdown, and visual indicators
 */

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { formatVND } from '@/lib/currency';
import {
  calculateProfit,
  calculateProfitBreakdown,
  formatProfitMargin,
} from '@/lib/utils/profit';
import { storageService } from '@/lib/storage';
import type { RevenueEntry } from '@/types';

interface ProfitDisplayProps {
  entry: RevenueEntry;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showBreakdown?: boolean;
}

/**
 * Determines profit status and color scheme
 */
function getProfitStatus(profitAmount: number, profitMargin: number) {
  if (profitAmount < 0) {
    return {
      status: 'loss',
      color: 'destructive',
      icon: TrendingDown,
      label: 'Loss',
    };
  } else if (profitMargin < 10) {
    return {
      status: 'low',
      color: 'secondary',
      icon: AlertCircle,
      label: 'Low Margin',
    };
  } else if (profitMargin < 30) {
    return {
      status: 'moderate',
      color: 'default',
      icon: DollarSign,
      label: 'Moderate',
    };
  } else {
    return {
      status: 'high',
      color: 'default',
      icon: TrendingUp,
      label: 'High Margin',
    };
  }
}

export function ProfitDisplay({
  entry,
  className = '',
  variant = 'default',
  showBreakdown = false,
}: ProfitDisplayProps) {
  const profitData = useMemo(() => {
    if (!entry.importPhaseId) {
      return null;
    }

    // Get detailed cost breakdown including fees
    const costBreakdown = storageService.getImportPhaseProductCostBreakdown(
      entry.importPhaseId,
      entry.productId
    );

    if (!costBreakdown) {
      return null;
    }

    const revenue = entry.netAmount || entry.amount; // Use net amount if available (after channel fees)
    const totalUnitCost = costBreakdown.totalCost;

    const profitCalc = calculateProfit(
      entry.unitPrice,
      totalUnitCost,
      entry.quantity
    );
    const breakdown = showBreakdown
      ? calculateProfitBreakdown(entry.unitPrice, totalUnitCost, entry.quantity)
      : null;

    return {
      revenue,
      unitCost: totalUnitCost,
      baseCost: costBreakdown.baseCost,
      allocatedFees: costBreakdown.allocatedFees,
      feeBreakdown: costBreakdown.feeBreakdown,
      profitAmount: profitCalc.grossProfit,
      profitMargin: profitCalc.profitMargin,
      totalCost: profitCalc.totalCost,
      breakdown,
    };
  }, [entry, showBreakdown]);

  // No import phase or cost data available
  if (!profitData) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        {!entry.importPhaseId ? (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>No import phase linked</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Cost data unavailable</span>
          </div>
        )}
      </div>
    );
  }

  const {
    profitAmount,
    profitMargin,
    revenue,
    totalCost,
    breakdown,
    baseCost,
    allocatedFees,
    feeBreakdown,
  } = profitData;
  const profitStatus = getProfitStatus(profitAmount, profitMargin);
  const Icon = profitStatus.icon;

  // Compact variant - single line display
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Icon
          className={`h-4 w-4 ${profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
        />
        <span
          className={`font-medium ${profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
        >
          {formatVND(profitAmount)}
        </span>
        <Badge
          variant={
            profitStatus.color as 'default' | 'destructive' | 'secondary'
          }
          className="text-xs"
        >
          {formatProfitMargin(profitMargin)}
        </Badge>
      </div>
    );
  }

  // Default variant - card display
  if (variant === 'default') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Profit Analysis</span>
            <Badge
              variant={
                profitStatus.color as 'default' | 'destructive' | 'secondary'
              }
            >
              {profitStatus.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Profit Amount:
            </span>
            <div className="flex items-center gap-2">
              <Icon
                className={`h-4 w-4 ${profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
              />
              <span
                className={`font-bold ${profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatVND(profitAmount)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Profit Margin:
            </span>
            <span className="font-medium">
              {formatProfitMargin(profitMargin)}
            </span>
          </div>

          {showBreakdown && breakdown && (
            <div className="border-t pt-2">
              <div className="mb-2 text-xs text-muted-foreground">
                Breakdown:
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Revenue:</span>
                  <span>
                    {formatVND(breakdown.sellingPrice * breakdown.quantity)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Base Cost:</span>
                  <span className="text-red-600">
                    -{formatVND(baseCost * breakdown.quantity)}
                  </span>
                </div>
                {allocatedFees > 0 && (
                  <div className="flex justify-between">
                    <span>Import Fees:</span>
                    <span className="text-red-600">
                      -{formatVND(allocatedFees * breakdown.quantity)}
                    </span>
                  </div>
                )}
                {entry.channelFee && entry.channelFee > 0 && (
                  <div className="flex justify-between">
                    <span>Channel Fee:</span>
                    <span className="text-red-600">
                      -{formatVND(entry.channelFee)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1 font-medium">
                  <span>Net Profit:</span>
                  <span
                    className={
                      profitAmount >= 0 ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {formatVND(breakdown.totalProfit)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Detailed variant - comprehensive breakdown
  if (variant === 'detailed') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Detailed Profit Analysis</span>
            <Badge
              variant={
                profitStatus.color as 'default' | 'destructive' | 'secondary'
              }
            >
              {profitStatus.label} • {formatProfitMargin(profitMargin)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main profit display */}
          <div className="rounded-lg border bg-muted/50 py-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Icon
                className={`h-6 w-6 ${profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
              />
              <span className="text-lg font-semibold text-muted-foreground">
                Net Profit
              </span>
            </div>
            <div
              className={`text-3xl font-bold ${profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatVND(profitAmount)}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {formatProfitMargin(profitMargin)} margin
            </div>
          </div>

          {/* Financial breakdown */}
          <div className="space-y-3">
            <h4 className="font-medium">Financial Breakdown</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Revenue</div>
                <div className="text-lg font-semibold text-green-600">
                  {formatVND(revenue)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {entry.quantity} units × {formatVND(entry.unitPrice)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Total Cost</div>
                <div className="text-lg font-semibold text-red-600">
                  {formatVND(totalCost)}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>
                    {entry.quantity} units × {formatVND(profitData.unitCost)}
                  </div>
                  {allocatedFees > 0 && (
                    <div className="text-blue-600">
                      Includes allocated fees:{' '}
                      {formatVND(allocatedFees * entry.quantity)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional costs if applicable */}
          {entry.channelFee && entry.channelFee > 0 && (
            <div className="border-t pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Channel Fee ({entry.salesChannelName}):
                </span>
                <span className="font-medium text-red-600">
                  -{formatVND(entry.channelFee)}
                </span>
              </div>
            </div>
          )}

          {/* Import phase info */}
          {entry.importPhaseId && (
            <div className="border-t pt-2">
              <div className="mb-2 text-xs text-muted-foreground">
                Linked to import phase for accurate cost calculation
              </div>

              {/* Detailed cost breakdown */}
              {feeBreakdown && feeBreakdown.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">
                    Cost Breakdown (per unit):
                  </h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Base Cost:</span>
                      <span>{formatVND(baseCost)}</span>
                    </div>
                    {feeBreakdown.map((fee, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-blue-600"
                      >
                        <span>{fee.name}:</span>
                        <span>+{formatVND(fee.allocatedAmount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t pt-1 font-medium">
                      <span>Total Unit Cost:</span>
                      <span>{formatVND(profitData.unitCost)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default ProfitDisplay;
