/**
 * RevenueFilters Component
 * Provides filtering and date range selection for revenue analytics
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, FilterIcon, RefreshCcwIcon } from 'lucide-react';

export interface RevenueFiltersState {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  category: 'all' | 'shirt' | 'pants';
  minRevenue: number | null;
  maxRevenue: number | null;
  sortBy: 'date' | 'revenue' | 'profit' | 'margin';
  sortOrder: 'asc' | 'desc';
}

interface RevenueFiltersProps {
  filters: RevenueFiltersState;
  onFiltersChange: (filters: RevenueFiltersState) => void;
  onApply: () => void;
  onReset: () => void;
  loading?: boolean;
  className?: string;
}

export function RevenueFilters({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  loading = false,
  className = '',
}: RevenueFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    const date = value ? new Date(value) : null;
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: date,
      },
    });
  };

  const handlePeriodChange = (period: RevenueFiltersState['period']) => {
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = now;

    switch (period) {
      case 'daily':
        from = new Date(now);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        from = new Date(now);
        from.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        from = new Date(now);
        from.setDate(1); // First day of current month
        break;
      case 'yearly':
        from = new Date(now.getFullYear(), 0, 1); // First day of current year
        break;
      case 'custom':
        // Keep existing dates or reset
        from = filters.dateRange.from;
        to = filters.dateRange.to;
        break;
    }

    onFiltersChange({
      ...filters,
      period,
      dateRange: { from, to },
    });
  };

  const isCustomPeriod = filters.period === 'custom';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <FilterIcon className="h-5 w-5" />
          Revenue Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period Selection */}
        <div className="space-y-2">
          <Label>Time Period</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={filters.period}
            onChange={(e) =>
              handlePeriodChange(
                e.target.value as RevenueFiltersState['period']
              )
            }
          >
            <option value="daily">Today</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Custom Date Range */}
        {isCustomPeriod && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">From Date</Label>
              <div className="relative">
                <Input
                  id="date-from"
                  type="date"
                  value={formatDateForInput(filters.dateRange.from)}
                  onChange={(e) => handleDateChange('from', e.target.value)}
                  className="pl-10"
                />
                <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">To Date</Label>
              <div className="relative">
                <Input
                  id="date-to"
                  type="date"
                  value={formatDateForInput(filters.dateRange.to)}
                  onChange={(e) => handleDateChange('to', e.target.value)}
                  className="pl-10"
                />
                <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="space-y-2">
          <Label>Product Category</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={filters.category}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                category: e.target.value as RevenueFiltersState['category'],
              })
            }
          >
            <option value="all">All Categories</option>
            <option value="shirt">Shirts</option>
            <option value="pants">Pants</option>
          </select>
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
        </Button>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 border-t pt-4">
            {/* Revenue Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-revenue">Min Revenue ($)</Label>
                <Input
                  id="min-revenue"
                  type="number"
                  placeholder="0"
                  value={filters.minRevenue || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      minRevenue: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-revenue">Max Revenue ($)</Label>
                <Input
                  id="max-revenue"
                  type="number"
                  placeholder="No limit"
                  value={filters.maxRevenue || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      maxRevenue: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort By</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={filters.sortBy}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      sortBy: e.target.value as RevenueFiltersState['sortBy'],
                    })
                  }
                >
                  <option value="date">Date</option>
                  <option value="revenue">Revenue</option>
                  <option value="profit">Profit</option>
                  <option value="margin">Profit Margin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={filters.sortOrder}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      sortOrder: e.target
                        .value as RevenueFiltersState['sortOrder'],
                    })
                  }
                >
                  <option value="desc">Highest First</option>
                  <option value="asc">Lowest First</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 border-t pt-4">
          <Button onClick={onApply} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <RefreshCcwIcon className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              'Apply Filters'
            )}
          </Button>
          <Button variant="outline" onClick={onReset} disabled={loading}>
            Reset
          </Button>
        </div>

        {/* Filter Summary */}
        {(filters.dateRange.from ||
          filters.category !== 'all' ||
          filters.minRevenue ||
          filters.maxRevenue) && (
          <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <div className="mb-1 font-medium">Active Filters:</div>
            <div className="space-y-1">
              {filters.dateRange.from && (
                <div>
                  Period: {filters.dateRange.from.toLocaleDateString()}
                  {filters.dateRange.to &&
                    ` to ${filters.dateRange.to.toLocaleDateString()}`}
                </div>
              )}
              {filters.category !== 'all' && (
                <div>Category: {filters.category}</div>
              )}
              {(filters.minRevenue || filters.maxRevenue) && (
                <div>
                  Revenue:{' '}
                  {filters.minRevenue ? `$${filters.minRevenue}+` : 'Any'}
                  {filters.maxRevenue && ` - $${filters.maxRevenue}`}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
