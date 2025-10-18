'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/useResponsive';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Trash2, Eye, Search, Filter } from 'lucide-react';
import type { RevenueListProps } from '@/features/revenue/types/revenue';
import { formatVND } from '@/lib/currency';
import { ProfitDisplay } from './ProfitDisplay';

// Simple date formatter
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * List component for displaying revenue entries with filtering and actions
 * Supports search, filtering, and CRUD operations on revenue entries
 */
export function RevenueList({
  entries,
  onEdit,
  onDelete,
  onView,
  loading = false,
  error,
}: RevenueListProps) {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'quantity'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Get unique sales channels for filter
  const salesChannels = Array.from(
    new Set(entries.map((entry) => entry.salesChannelName))
  )
    .filter(Boolean)
    .sort();

  // Filter and sort entries
  const filteredEntries = entries
    .filter((entry) => {
      const matchesSearch =
        entry.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.salesChannelName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (entry.notes &&
          entry.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesChannel =
        channelFilter === 'all' || entry.salesChannelName === channelFilter;

      return matchesSearch && matchesChannel;
    })
    .sort((a, b) => {
      let aValue: number | Date;
      let bValue: number | Date;

      switch (sortBy) {
        case 'date':
          aValue = a.saleDate;
          bValue = b.saleDate;
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        default:
          aValue = a.saleDate;
          bValue = b.saleDate;
      }

      if (sortBy === 'date') {
        const comparison =
          (aValue as Date).getTime() - (bValue as Date).getTime();
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = (aValue as number) - (bValue as number);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });

  // Calculate summary statistics
  const totalEntries = filteredEntries.length;
  const totalRevenue = filteredEntries.reduce(
    (sum, entry) => sum + entry.amount,
    0
  );
  const totalQuantity = filteredEntries.reduce(
    (sum, entry) => sum + entry.quantity,
    0
  );

  const handleSort = (field: 'date' | 'amount' | 'quantity') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading revenue entries: {error}</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div
        className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}
      >
        <Card>
          <CardHeader className={`pb-2 ${isMobile ? 'p-3' : ''}`}>
            <CardTitle
              className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}
            >
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? 'p-3 pt-0' : ''}>
            <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {totalEntries}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={`pb-2 ${isMobile ? 'p-3' : ''}`}>
            <CardTitle
              className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}
            >
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? 'p-3 pt-0' : ''}>
            <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {formatVND(totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={`pb-2 ${isMobile ? 'p-3' : ''}`}>
            <CardTitle
              className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}
            >
              Total Quantity
            </CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? 'p-3 pt-0' : ''}>
            <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {totalQuantity}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className={isMobile ? 'p-3' : 'p-4'}>
          <div
            className={`flex gap-4 ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'}`}
          >
            {/* Search */}
            <div className={`relative ${isMobile ? 'w-full' : 'flex-1'}`}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder={
                  isMobile
                    ? 'Search...'
                    : 'Search by product, channel, or notes...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Channel Filter */}
            <div
              className={`flex gap-2 ${isMobile ? 'w-full' : 'items-center'}`}
            >
              {!isMobile && <Filter className="h-4 w-4 text-gray-400" />}
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className={isMobile ? 'w-full' : 'w-[180px]'}>
                  <SelectValue placeholder="Filter by channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {salesChannels.map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {channel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options */}
            <Select
              value={`${sortBy}-${sortDirection}`}
              onValueChange={(value) => {
                const [field, direction] = value.split('-') as [
                  'date' | 'amount' | 'quantity',
                  'asc' | 'desc',
                ];
                setSortBy(field);
                setSortDirection(direction);
              }}
            >
              <SelectTrigger className={isMobile ? 'w-full' : 'w-[160px]'}>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Latest)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                <SelectItem value="amount-desc">Amount (High-Low)</SelectItem>
                <SelectItem value="amount-asc">Amount (Low-High)</SelectItem>
                <SelectItem value="quantity-desc">
                  Quantity (High-Low)
                </SelectItem>
                <SelectItem value="quantity-asc">
                  Quantity (Low-High)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Entries Table */}
      <Card>
        <CardHeader className={isMobile ? 'p-4' : ''}>
          <CardTitle className={isMobile ? 'text-lg' : ''}>
            Revenue Entries
          </CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'p-4 pt-0' : ''}>
          {loading ? (
            <div className="py-8 text-center">
              <p>Loading revenue entries...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">
                {entries.length === 0
                  ? 'No revenue entries found.'
                  : 'No entries match your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('date')}
                    >
                      Date{' '}
                      {sortBy === 'date' &&
                        (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead
                      className="cursor-pointer text-right hover:bg-gray-50"
                      onClick={() => handleSort('quantity')}
                    >
                      Quantity{' '}
                      {sortBy === 'quantity' &&
                        (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer text-right hover:bg-gray-50"
                      onClick={() => handleSort('amount')}
                    >
                      Amount{' '}
                      {sortBy === 'amount' &&
                        (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.saleDate)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.productName}</div>
                          {entry.variantDetails && (
                            <div className="text-sm text-gray-500">
                              {entry.variantDetails}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {entry.salesChannelName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.quantity}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatVND(entry.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.importPhaseId ? (
                          <ProfitDisplay entry={entry} variant="compact" />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No phase linked
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView(entry)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(entry)}
                              title="Edit entry"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    'Are you sure you want to delete this revenue entry?'
                                  )
                                ) {
                                  onDelete(entry.id);
                                }
                              }}
                              title="Delete entry"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
