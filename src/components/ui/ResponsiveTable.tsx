'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Eye, Edit, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile, useIsTablet } from '@/hooks/useResponsive';
import { touchOptimized } from '@/lib/utils/responsive';

export interface ResponsiveTableColumn<T = Record<string, unknown>> {
  key: string;
  title: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  width?: string;
  minWidth?: string;
  sortable?: boolean;
  priority?: 'high' | 'medium' | 'low'; // For mobile column priority
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  render?: (value: unknown, item: T, index: number) => React.ReactNode;
}

export interface ResponsiveTableAction<T = Record<string, unknown>> {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (item: T, index: number) => void;
  variant?: 'default' | 'destructive' | 'outline';
  className?: string;
  show?: (item: T) => boolean;
}

export interface ResponsiveTableProps<T = Record<string, unknown>> {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  actions?: ResponsiveTableAction<T>[];
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  expandableRows?: boolean;
  renderExpandedRow?: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  selectable?: boolean;
  selectedItems?: T[];
  stickyHeader?: boolean;
  maxHeight?: string;
  variant?: 'default' | 'compact' | 'spacious';
  showBorders?: boolean;
  striped?: boolean;
}

export function ResponsiveTable<T = Record<string, unknown>>({
  data,
  columns,
  actions = [],
  className,
  emptyMessage = 'No data available',
  loading = false,
  sortBy,
  sortDirection = 'asc',
  onSort,
  expandableRows = false,
  renderExpandedRow,
  keyExtractor = (_, index) => index.toString(),
  selectable = false,
  selectedItems = [],
  stickyHeader = false,
  maxHeight,
  variant = 'default',
  showBorders = true,
  striped = true,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Determine which columns to show based on device type
  const visibleColumns = useMemo(() => {
    if (isMobile) {
      // On mobile, show only high priority columns and first few columns
      return columns
        .filter((col, index) => col.priority === 'high' || index < 2)
        .slice(0, 3); // Maximum 3 columns on mobile
    }

    if (isTablet) {
      // On tablet, show high and medium priority columns
      return columns.filter(
        (col) =>
          col.priority === 'high' || col.priority === 'medium' || !col.priority
      );
    }

    // Desktop shows all columns
    return columns;
  }, [columns, isMobile, isTablet]);

  const handleSort = (column: ResponsiveTableColumn<T>) => {
    if (!column.sortable || !onSort) {
      return;
    }

    const newDirection =
      sortBy === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newDirection);
  };

  const toggleRowExpansion = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const getCellValue = (
    item: T,
    column: ResponsiveTableColumn<T>
  ): React.ReactNode => {
    if (column.render) {
      return column.render(
        typeof column.accessor === 'function'
          ? column.accessor(item)
          : item[column.accessor],
        item,
        data.indexOf(item)
      );
    }

    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }

    const value = item[column.accessor];
    // Convert primitive values to strings for display
    if (value === null || value === undefined) {
      return '';
    }
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value);
    }
    return String(value);
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return isMobile ? 'text-sm' : 'text-sm';
      case 'spacious':
        return isMobile ? 'text-base' : 'text-base';
      default:
        return isMobile ? 'text-sm' : 'text-sm';
    }
  };

  const getRowPadding = () => {
    switch (variant) {
      case 'compact':
        return isMobile ? 'px-3 py-2' : 'px-4 py-2';
      case 'spacious':
        return isMobile ? 'px-4 py-4' : 'px-6 py-4';
      default:
        return isMobile ? 'px-3 py-3' : 'px-4 py-3';
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <TableSkeleton isMobile={isMobile} columns={visibleColumns.length} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={cn(
          'w-full py-12 text-center',
          showBorders && 'rounded-lg border border-border',
          className
        )}
      >
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile Card Layout
  if (isMobile) {
    return (
      <div className={cn('w-full space-y-3', className)}>
        {data.map((item, index) => {
          const key = keyExtractor(item, index);
          const isExpanded = expandedRows.has(key);

          return (
            <div
              key={key}
              className={cn(
                'rounded-lg border border-border bg-card p-4',
                touchOptimized('', { touchClasses: 'active:bg-accent/50' }),
                striped && index % 2 === 1 && 'bg-muted/30'
              )}
            >
              {/* Primary row content */}
              <div className="space-y-2">
                {visibleColumns.map((column) => (
                  <div
                    key={column.key}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      {column.title}
                    </span>
                    <span
                      className={cn(
                        'text-right text-sm font-medium',
                        column.cellClassName
                      )}
                    >
                      {getCellValue(item, column)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Expandable content for hidden columns */}
              {(expandableRows || columns.length > visibleColumns.length) && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRowExpansion(key)}
                    className={cn(
                      'mt-3 h-8 w-full',
                      touchOptimized('', { touchClasses: 'min-h-[44px]' })
                    )}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronRight className="mr-2 h-4 w-4" />
                        Show More
                      </>
                    )}
                  </Button>

                  {isExpanded && (
                    <div className="mt-3 space-y-2 border-t pt-3">
                      {/* Show hidden columns */}
                      {columns
                        .filter((col) => !visibleColumns.includes(col))
                        .map((column) => (
                          <div
                            key={column.key}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm font-medium text-muted-foreground">
                              {column.title}
                            </span>
                            <span
                              className={cn(
                                'text-right text-sm',
                                column.cellClassName
                              )}
                            >
                              {getCellValue(item, column)}
                            </span>
                          </div>
                        ))}

                      {/* Custom expanded content */}
                      {renderExpandedRow && renderExpandedRow(item, index)}
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              {actions.length > 0 && (
                <div className="mt-3 flex justify-end space-x-2 border-t pt-3">
                  {actions
                    .filter((action) => !action.show || action.show(item))
                    .map((action) => (
                      <Button
                        key={action.key}
                        variant={action.variant || 'outline'}
                        size="sm"
                        onClick={() => action.onClick(item, index)}
                        className={cn(
                          touchOptimized('', {
                            touchClasses: 'min-h-[44px] min-w-[44px]',
                          }),
                          action.className
                        )}
                      >
                        {action.icon && <action.icon className="h-4 w-4" />}
                        <span className="ml-2">{action.label}</span>
                      </Button>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop/Tablet Table Layout
  return (
    <div
      className={cn('w-full', maxHeight && 'overflow-hidden', className)}
      style={{ maxHeight }}
    >
      <div className={cn('overflow-auto', maxHeight && 'h-full')}>
        <table className="w-full">
          <thead
            className={cn(
              'bg-muted/50',
              stickyHeader && 'sticky top-0 z-10',
              showBorders && 'border-b'
            )}
          >
            <tr>
              {selectable && (
                <th
                  className={cn(
                    'w-12 text-left',
                    getRowPadding(),
                    showBorders && 'border-r'
                  )}
                >
                  {/* TODO: Add select all checkbox */}
                </th>
              )}

              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'text-left font-medium text-muted-foreground',
                    getRowPadding(),
                    getVariantClasses(),
                    column.sortable && 'cursor-pointer hover:bg-muted/80',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    showBorders && 'border-r last:border-r-0',
                    column.headerClassName
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                  }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && sortBy === column.key && (
                      <ChevronDown
                        className={cn(
                          'h-4 w-4',
                          sortDirection === 'asc' && 'rotate-180'
                        )}
                      />
                    )}
                  </div>
                </th>
              ))}

              {actions.length > 0 && (
                <th
                  className={cn(
                    'w-24 text-right',
                    getRowPadding(),
                    getVariantClasses()
                  )}
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {data.map((item, index) => {
              const key = keyExtractor(item, index);
              const isSelected = selectedItems.includes(item);
              const isExpanded = expandedRows.has(key);

              return (
                <React.Fragment key={key}>
                  <tr
                    className={cn(
                      'transition-colors hover:bg-muted/50',
                      striped && index % 2 === 1 && 'bg-muted/20',
                      isSelected && 'bg-primary/10',
                      showBorders && 'border-b last:border-b-0'
                    )}
                  >
                    {selectable && (
                      <td
                        className={cn(
                          getRowPadding(),
                          showBorders && 'border-r'
                        )}
                      >
                        {/* TODO: Add checkbox */}
                      </td>
                    )}

                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          getRowPadding(),
                          getVariantClasses(),
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right',
                          showBorders && 'border-r last:border-r-0',
                          column.cellClassName
                        )}
                      >
                        {getCellValue(item, column)}
                      </td>
                    ))}

                    {actions.length > 0 && (
                      <td
                        className={cn(
                          'text-right',
                          getRowPadding(),
                          getVariantClasses()
                        )}
                      >
                        <div className="flex justify-end space-x-1">
                          {actions
                            .filter(
                              (action) => !action.show || action.show(item)
                            )
                            .slice(0, 3) // Show max 3 actions directly
                            .map((action) => (
                              <Button
                                key={action.key}
                                variant={action.variant || 'ghost'}
                                size="sm"
                                onClick={() => action.onClick(item, index)}
                                className={cn('h-8 w-8 p-0', action.className)}
                              >
                                {action.icon && (
                                  <action.icon className="h-4 w-4" />
                                )}
                              </Button>
                            ))}
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* Expanded row content */}
                  {isExpanded && renderExpandedRow && (
                    <tr>
                      <td
                        colSpan={
                          visibleColumns.length +
                          (selectable ? 1 : 0) +
                          (actions.length > 0 ? 1 : 0)
                        }
                        className={cn(
                          'bg-muted/30',
                          getRowPadding(),
                          showBorders && 'border-b'
                        )}
                      >
                        {renderExpandedRow(item, index)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Table skeleton for loading state
function TableSkeleton({
  isMobile,
  columns,
}: {
  isMobile: boolean;
  columns: number;
}) {
  if (isMobile) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="space-y-2 rounded-lg border border-border bg-card p-4"
          >
            {Array.from({ length: Math.min(columns, 3) }).map((_, j) => (
              <div key={j} className="flex justify-between">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-muted/50">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-4 py-3 text-left">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 5 }).map((_, i) => (
          <tr key={i} className="border-b">
            {Array.from({ length: columns }).map((_, j) => (
              <td key={j} className="px-4 py-3">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Pre-configured responsive table variants
 */

export function CompactResponsiveTable<T = Record<string, unknown>>(
  props: Omit<ResponsiveTableProps<T>, 'variant'>
) {
  return <ResponsiveTable {...props} variant="compact" />;
}

export function SpaciousResponsiveTable<T = Record<string, unknown>>(
  props: Omit<ResponsiveTableProps<T>, 'variant'>
) {
  return <ResponsiveTable {...props} variant="spacious" />;
}

/**
 * Common action configurations
 */
export const commonTableActions = {
  view: <T = Record<string, unknown>,>(
    onClick: (item: T, index: number) => void
  ): ResponsiveTableAction<T> => ({
    key: 'view',
    label: 'View',
    icon: Eye,
    onClick,
    variant: 'outline',
  }),

  edit: <T = Record<string, unknown>,>(
    onClick: (item: T, index: number) => void
  ): ResponsiveTableAction<T> => ({
    key: 'edit',
    label: 'Edit',
    icon: Edit,
    onClick,
    variant: 'outline',
  }),

  delete: <T = Record<string, unknown>,>(
    onClick: (item: T, index: number) => void
  ): ResponsiveTableAction<T> => ({
    key: 'delete',
    label: 'Delete',
    icon: Trash,
    onClick,
    variant: 'destructive',
  }),
};
