/**
 * RevenueCard Component
 * Displays revenue metrics in a card format
 */

'use client';

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Target,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RevenueCardProps {
  title: string;
  value: string | number;
  change?: number;
  period: string;
  type: 'revenue' | 'profit' | 'margin' | 'transactions' | 'growth';
  isLoading?: boolean;
}

export function RevenueCard({
  title,
  value,
  change,
  period,
  type,
  isLoading = false,
}: RevenueCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'revenue':
        return <DollarSign className="h-4 w-4" />;
      case 'profit':
        return <Target className="h-4 w-4" />;
      case 'margin':
        return <TrendingUp className="h-4 w-4" />;
      case 'transactions':
        return <ShoppingCart className="h-4 w-4" />;
      case 'growth':
        return <Calendar className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getValueColor = () => {
    if (type === 'profit' || type === 'margin') {
      const numValue =
        typeof value === 'string'
          ? parseFloat(value.replace(/[^0-9.-]/g, ''))
          : value;
      return numValue >= 0 ? 'text-green-600' : 'text-red-600';
    }
    return 'text-foreground';
  };

  const formatValue = () => {
    if (isLoading) return '---';

    if (type === 'revenue' || type === 'profit') {
      const numValue =
        typeof value === 'string'
          ? parseFloat(value.replace(/[^0-9.-]/g, ''))
          : value;
      return `$${numValue.toFixed(2)}`;
    }

    if (type === 'margin' || type === 'growth') {
      const numValue =
        typeof value === 'string'
          ? parseFloat(value.replace(/[^0-9.-]/g, ''))
          : value;
      return `${numValue.toFixed(2)}%`;
    }

    return value.toString();
  };

  const renderChangeIndicator = () => {
    if (change === undefined) return null;

    const isPositive = change >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`flex items-center text-sm ${colorClass}`}>
        <Icon className="mr-1 h-3 w-3" />
        <span>{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="h-4 w-4 animate-pulse text-muted-foreground">
            {getIcon()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-1 h-8 w-20 animate-pulse rounded bg-muted text-2xl font-bold"></div>
          <div className="h-4 w-16 animate-pulse rounded bg-muted text-xs text-muted-foreground"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{getIcon()}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${getValueColor()}`}>
          {formatValue()}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{period}</p>
          {renderChangeIndicator()}
        </div>
      </CardContent>
    </Card>
  );
}
