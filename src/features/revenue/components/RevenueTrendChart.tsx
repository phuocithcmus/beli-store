/**
 * RevenueTrendChart Component
 * Displays revenue trends over time using a simple chart
 */

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatVND } from '@/lib/currency';

interface RevenueDataPoint {
  period: string;
  revenue: number;
  profit: number;
  date: Date;
}

interface RevenueTrendChartProps {
  data: RevenueDataPoint[];
  title: string;
  height?: number;
}

export function RevenueTrendChart({
  data,
  title,
  height = 200,
}: RevenueTrendChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) {
      return { maxValue: 0, points: [] };
    }

    const maxRevenue = Math.max(...data.map((d) => d.revenue));
    const maxProfit = Math.max(...data.map((d) => d.profit));
    const maxValue = Math.max(maxRevenue, maxProfit) * 1.1; // Add 10% padding

    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const revenueY = height - (item.revenue / maxValue) * height;
      const profitY = height - (item.profit / maxValue) * height;

      return {
        x,
        revenueY,
        profitY,
        ...item,
      };
    });

    return { maxValue, points };
  }, [data, height]);

  const createPath = (
    points: typeof chartData.points,
    valueKey: 'revenueY' | 'profitY'
  ) => {
    if (points.length === 0) {
      return '';
    }

    const pathPoints = points
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L';
        return `${command} ${point.x} ${point[valueKey]}`;
      })
      .join(' ');

    return pathPoints;
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="mb-2 text-4xl">📊</div>
              <p>No revenue data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span>Profit</span>
            </div>
          </div>

          {/* Chart */}
          <div className="relative">
            <svg
              width="100%"
              height={height}
              viewBox={`0 0 100 ${height}`}
              className="rounded-md border bg-muted/10"
            >
              {/* Grid lines */}
              <defs>
                <pattern
                  id="grid"
                  width="10"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 10 0 L 0 0 0 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-muted-foreground/20"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Revenue line */}
              <path
                d={createPath(chartData.points, 'revenueY')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />

              {/* Profit line */}
              <path
                d={createPath(chartData.points, 'profitY')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />

              {/* Data points */}
              {chartData.points.map((point, index) => (
                <g key={index}>
                  {/* Revenue point */}
                  <circle
                    cx={point.x}
                    cy={point.revenueY}
                    r="3"
                    fill="#3b82f6"
                    className="hover:r-4 cursor-pointer transition-all"
                  >
                    <title>
                      {point.period}: ${point.revenue.toFixed(2)} revenue
                    </title>
                  </circle>

                  {/* Profit point */}
                  <circle
                    cx={point.x}
                    cy={point.profitY}
                    r="3"
                    fill="#10b981"
                    className="hover:r-4 cursor-pointer transition-all"
                  >
                    <title>
                      {point.period}: ${point.profit.toFixed(2)} profit
                    </title>
                  </circle>
                </g>
              ))}
            </svg>

            {/* X-axis labels */}
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              {data.map((item, index) => (
                <span key={index} className="text-center">
                  {item.period}
                </span>
              ))}
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${data.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatVND(data.reduce((sum, d) => sum + d.profit, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Total Profit</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
