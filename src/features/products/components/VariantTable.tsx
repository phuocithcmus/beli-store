/**
 * VariantTable Component
 * T023 [P] [US1] - Table component for displaying product variants with sorting and filtering
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { ProductVariant } from '@/types';
import type {
  VariantSortField,
  VariantSortDirection,
  VariantTableRow,
  InventoryStatus,
} from '@/features/products/types/variants';
import {
  calculateAvailableCount,
  isLowStock,
  isOutOfStock,
  getInventoryStatus,
  createVariantDisplayName,
  VARIANT_SIZES,
  VARIANT_FORMS,
} from '@/features/products/types/variants';
import { useAllVariantSales } from '@/features/products/hooks/useVariantSales';

interface VariantTableProps {
  variants: ProductVariant[];
  loading?: boolean;
  onEditVariant?: (variant: ProductVariant) => void;
  onDeleteVariant?: (variantId: string) => void;
  onViewVariant?: (variant: ProductVariant) => void;
  onRecordSale?: (variant: ProductVariant) => void;
  showActions?: boolean;
  showSalesData?: boolean;
  className?: string;
}

/**
 * Status badge component for inventory status
 */
const StatusBadge = ({ status }: { status: InventoryStatus }) => {
  const statusConfig = {
    'in-stock': { color: 'bg-green-100 text-green-800', label: 'In Stock' },
    'low-stock': { color: 'bg-yellow-100 text-yellow-800', label: 'Low Stock' },
    'out-of-stock': { color: 'bg-red-100 text-red-800', label: 'Out of Stock' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
};

/**
 * Table header with sorting functionality
 */
const SortableHeader = ({
  field,
  children,
  currentSort,
  onSort,
}: {
  field: VariantSortField;
  children: React.ReactNode;
  currentSort: { field: VariantSortField; direction: VariantSortDirection };
  onSort: (field: VariantSortField) => void;
}) => {
  const isActive = currentSort.field === field;
  const direction = isActive ? currentSort.direction : 'asc';

  return (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
        onClick={() => onSort(field)}
      >
        {children}
        {isActive && (
          <span className="ml-1">{direction === 'asc' ? '↑' : '↓'}</span>
        )}
      </Button>
    </TableHead>
  );
};

/**
 * Filter controls component
 */
const FilterControls = ({
  searchQuery,
  onSearchChange,
  colorFilter,
  onColorFilterChange,
  sizeFilter,
  onSizeFilterChange,
  formFilter,
  onFormFilterChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  colorFilter: string;
  onColorFilterChange: (color: string) => void;
  sizeFilter: string;
  onSizeFilterChange: (size: string) => void;
  formFilter: string;
  onFormFilterChange: (form: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onClearFilters: () => void;
}) => (
  <div className="mb-4 space-y-3">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search Input */}
      <div className="flex-1">
        <Input
          placeholder="Search variants by SKU, color..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Clear Filters Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onClearFilters}
        className="w-full sm:w-auto"
      >
        Clear Filters
      </Button>
    </div>

    {/* Filter Dropdowns */}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* Color Filter */}
      <Select value={colorFilter} onValueChange={onColorFilterChange}>
        <SelectTrigger>
          <SelectValue placeholder="All Colors" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Colors</SelectItem>
          <SelectItem value="Black">Black</SelectItem>
          <SelectItem value="White">White</SelectItem>
          <SelectItem value="Gray">Gray</SelectItem>
          <SelectItem value="Navy">Navy</SelectItem>
          <SelectItem value="Red">Red</SelectItem>
          <SelectItem value="Blue">Blue</SelectItem>
          <SelectItem value="Green">Green</SelectItem>
          <SelectItem value="Yellow">Yellow</SelectItem>
        </SelectContent>
      </Select>

      {/* Size Filter */}
      <Select value={sizeFilter} onValueChange={onSizeFilterChange}>
        <SelectTrigger>
          <SelectValue placeholder="All Sizes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sizes</SelectItem>
          {VARIANT_SIZES.map((size) => (
            <SelectItem key={size} value={size}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Form Filter */}
      <Select value={formFilter} onValueChange={onFormFilterChange}>
        <SelectTrigger>
          <SelectValue placeholder="All Forms" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Forms</SelectItem>
          {VARIANT_FORMS.map((form) => (
            <SelectItem key={form} value={form}>
              {form.charAt(0).toUpperCase() + form.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger>
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="in-stock">In Stock</SelectItem>
          <SelectItem value="low-stock">Low Stock</SelectItem>
          <SelectItem value="out-of-stock">Out of Stock</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

export default function VariantTable({
  variants,
  loading = false,
  onEditVariant,
  onDeleteVariant,
  onViewVariant,
  onRecordSale,
  showActions = true,
  showSalesData = false,
  className,
}: VariantTableProps) {
  // Sorting state
  const [sortField, setSortField] = useState<VariantSortField>('sku');
  const [sortDirection, setSortDirection] =
    useState<VariantSortDirection>('asc');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [colorFilter, setColorFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [formFilter, setFormFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Enhanced variant data with computed fields
  const enhancedVariants: VariantTableRow[] = useMemo(() => {
    return variants.map((variant) => {
      const availableCount = calculateAvailableCount(variant);
      return {
        variant,
        availableCount,
        isLowStock: isLowStock(variant),
        isOutOfStock: isOutOfStock(variant),
      };
    });
  }, [variants]);

  // Get sort value for a specific field
  const getSortValue = useCallback(
    (row: VariantTableRow, field: VariantSortField): string | number => {
      const { variant } = row;
      switch (field) {
        case 'sku':
          return variant.sku;
        case 'color':
          return variant.color;
        case 'size':
          return variant.size;
        case 'form':
          return variant.form;
        case 'inventoryCount':
          return variant.inventoryCount;
        case 'reservedCount':
          return variant.reservedCount;
        case 'soldCount':
          return variant.soldCount;
        case 'availableCount':
          return row.availableCount;
        case 'createdAt':
          return new Date(variant.createdAt).getTime();
        case 'updatedAt':
          return new Date(variant.updatedAt).getTime();
        default:
          return '';
      }
    },
    []
  );

  // Filtered and sorted variants
  const processedVariants = useMemo(() => {
    let filtered = enhancedVariants;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        ({ variant }) =>
          variant.sku.toLowerCase().includes(query) ||
          variant.color.toLowerCase().includes(query) ||
          createVariantDisplayName(variant).toLowerCase().includes(query)
      );
    }

    // Apply color filter
    if (colorFilter && colorFilter !== 'all') {
      filtered = filtered.filter(
        ({ variant }) => variant.color === colorFilter
      );
    }

    // Apply size filter
    if (sizeFilter && sizeFilter !== 'all') {
      filtered = filtered.filter(({ variant }) => variant.size === sizeFilter);
    }

    // Apply form filter
    if (formFilter && formFilter !== 'all') {
      filtered = filtered.filter(({ variant }) => variant.form === formFilter);
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(({ availableCount }) => {
        const status = getInventoryStatus(availableCount);
        return status === statusFilter;
      });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      const aValue = getSortValue(a, sortField);
      const bValue = getSortValue(b, sortField);

      let comparison = 0;
      if (aValue < bValue) {
        comparison = -1;
      }
      if (aValue > bValue) {
        comparison = 1;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [
    enhancedVariants,
    searchQuery,
    colorFilter,
    sizeFilter,
    formFilter,
    statusFilter,
    sortField,
    sortDirection,
    getSortValue,
  ]);

  // Handle sort
  const handleSort = (field: VariantSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setColorFilter('all');
    setSizeFilter('all');
    setFormFilter('all');
    setStatusFilter('all');
  };

  const { allSales, isLoading: salesLoading } = useAllVariantSales();

  // Create a map of variant sales data for quick lookup
  const variantSalesMap = useMemo(() => {
    const salesMap: Record<
      string,
      {
        totalQuantitySold: number;
        totalRevenue: number;
        lastSaleDate: string | null;
      }
    > = {};

    allSales.forEach((sale) => {
      if (!salesMap[sale.variantId]) {
        salesMap[sale.variantId] = {
          totalQuantitySold: 0,
          totalRevenue: 0,
          lastSaleDate: null,
        };
      }

      const variantData = salesMap[sale.variantId];
      variantData.totalQuantitySold += sale.quantity;
      variantData.totalRevenue += sale.totalAmount;

      if (
        !variantData.lastSaleDate ||
        sale.saleDate > new Date(variantData.lastSaleDate)
      ) {
        variantData.lastSaleDate = sale.saleDate.toISOString();
      }
    });

    return salesMap;
  }, [allSales]);

  const handleRecordSale = (variant: ProductVariant) => {
    if (onRecordSale) {
      onRecordSale(variant);
    }
  };

  if (loading || salesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading variants...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Filter Controls */}
      <FilterControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        colorFilter={colorFilter}
        onColorFilterChange={setColorFilter}
        sizeFilter={sizeFilter}
        onSizeFilterChange={setSizeFilter}
        formFilter={formFilter}
        onFormFilterChange={setFormFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={handleClearFilters}
      />

      {/* Results Summary */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {processedVariants.length} of {variants.length} variants
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader
                field="sku"
                currentSort={{ field: sortField, direction: sortDirection }}
                onSort={handleSort}
              >
                SKU
              </SortableHeader>
              <SortableHeader
                field="color"
                currentSort={{ field: sortField, direction: sortDirection }}
                onSort={handleSort}
              >
                Color
              </SortableHeader>
              <SortableHeader
                field="size"
                currentSort={{ field: sortField, direction: sortDirection }}
                onSort={handleSort}
              >
                Size
              </SortableHeader>
              <SortableHeader
                field="form"
                currentSort={{ field: sortField, direction: sortDirection }}
                onSort={handleSort}
              >
                Form
              </SortableHeader>
              <SortableHeader
                field="inventoryCount"
                currentSort={{ field: sortField, direction: sortDirection }}
                onSort={handleSort}
              >
                Total
              </SortableHeader>
              <SortableHeader
                field="reservedCount"
                currentSort={{ field: sortField, direction: sortDirection }}
                onSort={handleSort}
              >
                Reserved
              </SortableHeader>
              <SortableHeader
                field="soldCount"
                currentSort={{ field: sortField, direction: sortDirection }}
                onSort={handleSort}
              >
                Sold
              </SortableHeader>
              <SortableHeader
                field="availableCount"
                currentSort={{ field: sortField, direction: sortDirection }}
                onSort={handleSort}
              >
                Available
              </SortableHeader>
              <TableHead>Status</TableHead>
              {showSalesData && (
                <>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Last Sale</TableHead>
                </>
              )}
              {showActions && <TableHead className="w-32">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedVariants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    showSalesData
                      ? showActions
                        ? 13
                        : 12
                      : showActions
                        ? 10
                        : 9
                  }
                  className="py-8 text-center"
                >
                  <div className="text-muted-foreground">
                    {variants.length === 0
                      ? 'No variants found'
                      : 'No variants match the current filters'}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              processedVariants.map(({ variant, availableCount }) => {
                const status = getInventoryStatus(availableCount);
                const salesData = variantSalesMap[variant.id];

                return (
                  <TableRow key={variant.id}>
                    <TableCell className="font-mono text-sm">
                      {variant.sku}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full border border-gray-300"
                          style={{
                            backgroundColor: variant.color.toLowerCase(),
                          }}
                          title={variant.color}
                        />
                        {variant.color}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{variant.size}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{variant.form}</TableCell>
                    <TableCell className="text-right font-medium">
                      {variant.inventoryCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {variant.reservedCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {variant.soldCount}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {availableCount}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                    {showSalesData && (
                      <>
                        <TableCell className="text-right font-medium">
                          {salesData?.totalQuantitySold || 0}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${(salesData?.totalRevenue || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {salesData?.lastSaleDate
                            ? new Date(
                                salesData.lastSaleDate
                              ).toLocaleDateString()
                            : 'Never'}
                        </TableCell>
                      </>
                    )}
                    {showActions && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {onRecordSale && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRecordSale(variant)}
                              className="h-8 px-2 text-green-600 hover:text-green-700"
                            >
                              Sale
                            </Button>
                          )}
                          {onViewVariant && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewVariant(variant)}
                              className="h-8 px-2"
                            >
                              View
                            </Button>
                          )}
                          {onEditVariant && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditVariant(variant)}
                              className="h-8 px-2"
                            >
                              Edit
                            </Button>
                          )}
                          {onDeleteVariant && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteVariant(variant.id)}
                              className="h-8 px-2 text-destructive hover:text-destructive"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Table Footer with Summary */}
      {processedVariants.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              Total Inventory:{' '}
              <span className="font-medium">
                {processedVariants.reduce(
                  (sum, { variant }) => sum + variant.inventoryCount,
                  0
                )}
              </span>
            </div>
            <div>
              Total Reserved:{' '}
              <span className="font-medium">
                {processedVariants.reduce(
                  (sum, { variant }) => sum + variant.reservedCount,
                  0
                )}
              </span>
            </div>
            <div>
              Total Sold:{' '}
              <span className="font-medium">
                {processedVariants.reduce(
                  (sum, { variant }) => sum + variant.soldCount,
                  0
                )}
              </span>
            </div>
            <div>
              Total Available:{' '}
              <span className="font-medium">
                {processedVariants.reduce(
                  (sum, { availableCount }) => sum + availableCount,
                  0
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
