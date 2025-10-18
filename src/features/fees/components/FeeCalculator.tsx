/**
 * Fee Calculator Component
 * Interactive calculator for import and channel fees
 * Part of the Fee Management System implementation
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';
import { formatVND } from '@/lib/currency';
import { calculateFeeBreakdown } from '@/lib/utils/feeCalculations';
import type { ChannelFeeStructure, SalesChannel } from '@/types';

interface FeeCalculatorProps {
  channelFeeStructures: ChannelFeeStructure[];
  salesChannels: SalesChannel[];
}

interface CalculationResult {
  percentageFee: number;
  fixedFee: number;
  totalBeforeMinMax: number;
  minimumApplied: boolean;
  maximumApplied: boolean;
  finalFee: number;
  netAmount: number;
}

export function FeeCalculator({
  channelFeeStructures,
  salesChannels,
}: FeeCalculatorProps) {
  const [revenueAmount, setRevenueAmount] = useState<string>('1000000');
  const [selectedChannelId, setSelectedChannelId] = useState<
    string | undefined
  >(undefined);
  const [calculations, setCalculations] = useState<
    Record<string, CalculationResult>
  >({});

  const handleCalculate = () => {
    const amount = parseFloat(revenueAmount) || 0;
    const newCalculations: Record<string, CalculationResult> = {};

    if (selectedChannelId && selectedChannelId !== 'all') {
      // Calculate for selected channel only
      const feeStructure = channelFeeStructures.find(
        (cfs) => cfs.salesChannelId === selectedChannelId
      );
      if (feeStructure) {
        const breakdown = calculateFeeBreakdown(feeStructure, amount);
        newCalculations[selectedChannelId] = breakdown;
      }
    } else {
      // Calculate for all channels
      channelFeeStructures.forEach((feeStructure) => {
        const breakdown = calculateFeeBreakdown(feeStructure, amount);
        newCalculations[feeStructure.salesChannelId] = breakdown;
      });
    }

    setCalculations(newCalculations);
  };

  const handleRevenueAmountChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    setRevenueAmount(cleaned);
  };

  const getChannelName = (channelId: string) => {
    const channel = salesChannels.find((c) => c.id === channelId);
    return channel?.name || 'Unknown Channel';
  };

  const getFeeStructure = (channelId: string) => {
    return channelFeeStructures.find((cfs) => cfs.salesChannelId === channelId);
  };

  const totalFees = Object.values(calculations).reduce(
    (sum, calc) => sum + calc.finalFee,
    0
  );
  const totalNetAmount = Object.values(calculations).reduce(
    (sum, calc) => sum + calc.netAmount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Calculator Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Fee Calculator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="revenue-amount">Revenue Amount (VND)</Label>
              <Input
                id="revenue-amount"
                type="text"
                value={revenueAmount}
                onChange={(e) => handleRevenueAmountChange(e.target.value)}
                placeholder="Enter revenue amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-select">Sales Channel (Optional)</Label>
              <Select
                value={selectedChannelId || 'all'}
                onValueChange={(value) =>
                  setSelectedChannelId(value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Calculate for all channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {channelFeeStructures.map((cfs) => {
                    const channel = salesChannels.find(
                      (c) => c.id === cfs.salesChannelId
                    );
                    return (
                      <SelectItem
                        key={cfs.salesChannelId}
                        value={cfs.salesChannelId}
                      >
                        {channel?.name || 'Unknown Channel'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCalculate} className="w-full">
            <Calculator className="mr-2 h-4 w-4" />
            Calculate Fees
          </Button>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {Object.keys(calculations).length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gross Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatVND(parseFloat(revenueAmount) || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                -{formatVND(totalFees)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatVND(totalNetAmount)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Results */}
      {Object.keys(calculations).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Fee Breakdown by Channel</h3>
          {Object.entries(calculations).map(([channelId, calculation]) => {
            const feeStructure = getFeeStructure(channelId);
            if (!feeStructure) {
              return null;
            }

            return (
              <Card key={channelId}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {getChannelName(channelId)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Fee Structure Info */}
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Percentage Rate:
                      </span>
                      <span>{feeStructure.percentageRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fixed Fee:</span>
                      <span>{formatVND(feeStructure.fixedFee)}</span>
                    </div>
                    {feeStructure.minimumFee && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Minimum Fee:
                        </span>
                        <span>{formatVND(feeStructure.minimumFee)}</span>
                      </div>
                    )}
                    {feeStructure.maximumFee && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Maximum Fee:
                        </span>
                        <span>{formatVND(feeStructure.maximumFee)}</span>
                      </div>
                    )}
                  </div>

                  <div className="my-2 border-t" />

                  {/* Calculation Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>
                        Percentage Fee ({feeStructure.percentageRate}%):
                      </span>
                      <span>{formatVND(calculation.percentageFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fixed Fee:</span>
                      <span>{formatVND(calculation.fixedFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatVND(calculation.totalBeforeMinMax)}</span>
                    </div>

                    {calculation.minimumApplied && (
                      <div className="flex justify-between text-amber-600">
                        <span>Minimum Applied:</span>
                        <span>Yes</span>
                      </div>
                    )}

                    {calculation.maximumApplied && (
                      <div className="flex justify-between text-green-600">
                        <span>Maximum Applied:</span>
                        <span>Yes</span>
                      </div>
                    )}

                    <div className="my-2 border-t" />

                    <div className="flex justify-between font-semibold">
                      <span>Final Fee:</span>
                      <span className="text-red-600">
                        {formatVND(calculation.finalFee)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Net Amount:</span>
                      <span className="text-green-600">
                        {formatVND(calculation.netAmount)}
                      </span>
                    </div>

                    {/* Fee Percentage */}
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Fee Percentage of Revenue:</span>
                      <span>
                        {(
                          (calculation.finalFee /
                            (parseFloat(revenueAmount) || 1)) *
                          100
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* No Fee Structures Message */}
      {channelFeeStructures.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Calculator className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <h3 className="mb-2 text-lg font-medium">
              No Fee Structures Configured
            </h3>
            <p className="text-muted-foreground">
              Configure channel fee structures to use the fee calculator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
