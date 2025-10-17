'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Simple Progress component
const Progress = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => (
  <div className={`w-full rounded-full bg-gray-200 ${className}`}>
    <div
      className="h-full rounded-full bg-blue-600 transition-all duration-300"
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { formatVND } from '@/lib/currency';
import type { ChannelRevenueData } from '@/lib/utils/revenueCalculations';

// Utility functions
const formatCurrency = formatVND;
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

interface ChannelProfitabilityMetrics extends ChannelRevenueData {
  feePercentage: number;
  netMarginPercentage: number;
  profitabilityRank: number;
  efficiencyScore: number;
  recommendation: 'optimize' | 'maintain' | 'expand' | 'review';
}

interface ProfitabilityAnalysisProps {
  channelData: ChannelRevenueData[];
  totalRevenue: number;
  totalNetRevenue: number;
  onChannelSelect?: (channelId: string) => void;
}

function getRecommendationColor(recommendation: string): string {
  switch (recommendation) {
    case 'expand':
      return 'bg-green-100 text-green-800';
    case 'maintain':
      return 'bg-blue-100 text-blue-800';
    case 'optimize':
      return 'bg-yellow-100 text-yellow-800';
    case 'review':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getRecommendationIcon(recommendation: string) {
  switch (recommendation) {
    case 'expand':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'maintain':
      return <TrendingUp className="h-4 w-4" />;
    case 'optimize':
      return <AlertTriangle className="h-4 w-4" />;
    case 'review':
      return <TrendingDown className="h-4 w-4" />;
    default:
      return <Percent className="h-4 w-4" />;
  }
}

/**
 * Profitability Analysis Component
 * Provides comprehensive channel performance analysis with fee impact assessment
 */
export function ProfitabilityAnalysis({
  channelData,
  totalRevenue,
  totalNetRevenue,
  onChannelSelect,
}: ProfitabilityAnalysisProps) {
  // Calculate profitability metrics for each channel
  const channelMetrics: ChannelProfitabilityMetrics[] = channelData
    .map((channel) => {
      const feePercentage =
        channel.revenue > 0 ? (channel.totalFees / channel.revenue) * 100 : 0;
      const netMarginPercentage =
        channel.revenue > 0
          ? (channel.netRevenue / channel.revenue) * 100
          : 100;

      // Efficiency score based on net revenue vs fees (0-100)
      const efficiencyScore = Math.max(0, netMarginPercentage);

      // Recommendation logic
      let recommendation: 'optimize' | 'maintain' | 'expand' | 'review' =
        'maintain';
      if (efficiencyScore >= 90 && channel.netMarketShare >= 20) {
        recommendation = 'expand';
      } else if (efficiencyScore >= 85) {
        recommendation = 'maintain';
      } else if (efficiencyScore >= 70) {
        recommendation = 'optimize';
      } else {
        recommendation = 'review';
      }

      return {
        ...channel,
        feePercentage,
        netMarginPercentage,
        profitabilityRank: 0, // Will be set after sorting
        efficiencyScore,
        recommendation,
      };
    })
    .sort((a, b) => b.netRevenue - a.netRevenue)
    .map((channel, index) => ({ ...channel, profitabilityRank: index + 1 }));

  // Summary metrics
  const totalFees = channelData.reduce(
    (sum, channel) => sum + channel.totalFees,
    0
  );
  const averageFeePercentage =
    totalRevenue > 0 ? (totalFees / totalRevenue) * 100 : 0;
  const overallNetMargin =
    totalRevenue > 0 ? (totalNetRevenue / totalRevenue) * 100 : 100;

  // Performance categories
  const highPerformers = channelMetrics.filter(
    (c) => c.recommendation === 'expand' || c.recommendation === 'maintain'
  );
  const needsAttention = channelMetrics.filter(
    (c) => c.recommendation === 'optimize' || c.recommendation === 'review'
  );

  if (channelData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>No channel data available for profitability analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Overall Net Margin
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {overallNetMargin.toFixed(2)}%
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatCurrency(totalNetRevenue)} net revenue
                </p>
              </div>
              <Percent className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Average Channel Fees
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {averageFeePercentage.toFixed(2)}%
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatCurrency(totalFees)} total fees
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Channels Analyzed
                </p>
                <p className="text-2xl font-bold">{channelMetrics.length}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {highPerformers.length} performing well
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Profitability Analysis</CardTitle>
          <p className="text-sm text-gray-500">
            Detailed performance metrics with optimization recommendations
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {channelMetrics.map((channel) => (
              <div
                key={channel.channelId}
                className="cursor-pointer rounded-lg border p-4 transition-shadow hover:shadow-md"
                onClick={() => onChannelSelect?.(channel.channelId)}
              >
                {/* Channel Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                      #{channel.profitabilityRank}
                    </div>
                    <div>
                      <h3 className="font-semibold">{channel.channelName}</h3>
                      <p className="text-sm text-gray-500">
                        {formatNumber(channel.transactions)} transactions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={getRecommendationColor(channel.recommendation)}
                    >
                      {getRecommendationIcon(channel.recommendation)}
                      <span className="ml-1 capitalize">
                        {channel.recommendation}
                      </span>
                    </Badge>
                  </div>
                </div>

                {/* Revenue Metrics */}
                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-600">
                      Gross Revenue
                    </p>
                    <p className="text-lg font-bold">
                      {formatCurrency(channel.revenue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {channel.marketShare.toFixed(1)}% market share
                    </p>
                  </div>

                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-600">
                      Channel Fees
                    </p>
                    <p className="text-lg font-bold text-red-600">
                      -{formatCurrency(channel.totalFees)}
                    </p>
                    <p className="text-xs text-red-500">
                      {channel.feePercentage.toFixed(2)}% of gross
                    </p>
                  </div>

                  <div className="rounded-lg bg-green-50 p-3">
                    <p className="text-sm font-medium text-green-600">
                      Net Revenue
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(channel.netRevenue)}
                    </p>
                    <p className="text-xs text-green-500">
                      {channel.netMarketShare.toFixed(1)}% net share
                    </p>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Net Margin</span>
                      <span className="font-medium">
                        {channel.netMarginPercentage.toFixed(2)}%
                      </span>
                    </div>
                    <Progress
                      value={channel.netMarginPercentage}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Efficiency Score</span>
                      <span className="font-medium">
                        {channel.efficiencyScore.toFixed(0)}/100
                      </span>
                    </div>
                    <Progress value={channel.efficiencyScore} className="h-2" />
                  </div>
                </div>

                {/* Order Value Comparison */}
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gross AOV:</span>
                    <span className="font-medium">
                      {formatCurrency(channel.averageOrderValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Net AOV:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(channel.averageNetOrderValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg Fee/Order:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(channel.averageFeePerTransaction)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">High Performers</CardTitle>
            <p className="text-sm text-gray-500">
              Channels with strong profitability
            </p>
          </CardHeader>
          <CardContent>
            {highPerformers.length === 0 ? (
              <p className="text-sm text-gray-500">
                No high-performing channels identified
              </p>
            ) : (
              <div className="space-y-3">
                {highPerformers.map((channel) => (
                  <div
                    key={channel.channelId}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{channel.channelName}</p>
                      <p className="text-sm text-gray-500">
                        {channel.netMarginPercentage.toFixed(1)}% net margin
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      {channel.recommendation}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Needs Attention</CardTitle>
            <p className="text-sm text-gray-500">
              Channels requiring optimization
            </p>
          </CardHeader>
          <CardContent>
            {needsAttention.length === 0 ? (
              <p className="text-sm text-gray-500">
                All channels performing well
              </p>
            ) : (
              <div className="space-y-3">
                {needsAttention.map((channel) => (
                  <div
                    key={channel.channelId}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{channel.channelName}</p>
                      <p className="text-sm text-gray-500">
                        {channel.feePercentage.toFixed(1)}% fee rate
                      </p>
                    </div>
                    <Badge variant="outline" className="text-yellow-600">
                      {channel.recommendation}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
