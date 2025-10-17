/**
 * ExportDialog Component
 * Modal dialog for data export functionality with format and filter options
 * Updated to use proper Dialog component and VND currency
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DownloadIcon,
  FileTextIcon,
  DatabaseIcon,
  CalendarIcon,
  FilterIcon,
  CheckIcon,
} from 'lucide-react';
import { storageService } from '@/lib/storage';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportType =
  | 'products'
  | 'transactions'
  | 'revenue'
  | 'imports'
  | 'backup';
type ExportFormat = 'csv' | 'json';

interface ExportFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: 'all' | 'shirt' | 'pants';
  transactionType?: 'all' | 'sale' | 'purchase';
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const [exportType, setExportType] = useState<ExportType>('products');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [filters, setFilters] = useState<ExportFilters>({
    category: 'all',
    transactionType: 'all',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) {
    return null;
  }

  const exportOptions = [
    {
      type: 'products' as const,
      title: 'Products',
      description: 'Export product inventory data',
      icon: <DatabaseIcon className="h-5 w-5" />,
    },
    {
      type: 'transactions' as const,
      title: 'Transactions',
      description: 'Export sales and purchase records',
      icon: <FileTextIcon className="h-5 w-5" />,
    },
    {
      type: 'revenue' as const,
      title: 'Revenue Reports',
      description: 'Export revenue and profit analytics',
      icon: <FileTextIcon className="h-5 w-5" />,
    },
    {
      type: 'imports' as const,
      title: 'Import Phases',
      description: 'Export import phase records',
      icon: <DatabaseIcon className="h-5 w-5" />,
    },
    {
      type: 'backup' as const,
      title: 'Complete Backup',
      description: 'Export all store data',
      icon: <DatabaseIcon className="h-5 w-5" />,
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      let data: string;
      let filename: string;

      switch (exportType) {
        case 'products':
          const productFilters =
            filters.category !== 'all'
              ? { category: filters.category as 'shirt' | 'pants' }
              : undefined;

          if (exportFormat === 'csv') {
            data = await storageService.exportProductsToCSV(productFilters);
            filename = `products_${new Date().toISOString().split('T')[0]}.csv`;
          } else {
            data = await storageService.exportProductsToJSON(productFilters);
            filename = `products_${new Date().toISOString().split('T')[0]}.json`;
          }
          break;

        case 'transactions':
          const transactionFilters: Record<string, unknown> = {};
          if (filters.transactionType !== 'all') {
            transactionFilters.type = filters.transactionType;
          }
          if (filters.dateFrom) {
            transactionFilters.dateFrom = new Date(filters.dateFrom);
          }
          if (filters.dateTo) {
            transactionFilters.dateTo = new Date(filters.dateTo);
          }

          if (exportFormat === 'csv') {
            data =
              await storageService.exportTransactionsToCSV(transactionFilters);
            filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
          } else {
            data =
              await storageService.exportTransactionsToJSON(transactionFilters);
            filename = `transactions_${new Date().toISOString().split('T')[0]}.json`;
          }
          break;

        case 'revenue':
          if (exportFormat === 'csv') {
            data = await storageService.exportRevenueReportsToCSV();
            filename = `revenue_reports_${new Date().toISOString().split('T')[0]}.csv`;
          } else {
            data = await storageService.exportRevenueReportsToJSON();
            filename = `revenue_reports_${new Date().toISOString().split('T')[0]}.json`;
          }
          break;

        case 'imports':
          if (exportFormat === 'csv') {
            data = await storageService.exportImportPhasesToCSV();
            filename = `import_phases_${new Date().toISOString().split('T')[0]}.csv`;
          } else {
            data = await storageService.exportImportPhasesToJSON();
            filename = `import_phases_${new Date().toISOString().split('T')[0]}.json`;
          }
          break;

        case 'backup':
          data = await storageService.exportCompleteBackup();
          filename = `store_backup_${new Date().toISOString().split('T')[0]}.json`;
          break;

        default:
          throw new Error('Invalid export type');
      }

      // Create and trigger download
      const blob = new Blob([data], {
        type: exportFormat === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatSizeEstimate = (type: ExportType): string => {
    switch (type) {
      case 'products':
        return '< 50 KB';
      case 'transactions':
        return '< 100 KB';
      case 'revenue':
        return '< 25 KB';
      case 'imports':
        return '< 25 KB';
      case 'backup':
        return '< 500 KB';
      default:
        return '< 100 KB';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DownloadIcon className="h-5 w-5" />
            Export Data
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {exportSuccess ? (
            <div className="py-8 text-center">
              <CheckIcon className="mx-auto mb-4 h-16 w-16 text-green-500" />
              <h3 className="text-lg font-semibold text-green-700">
                Export Successful!
              </h3>
              <p className="text-muted-foreground">
                Your file has been downloaded.
              </p>
            </div>
          ) : (
            <>
              {/* Export Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Data Type</Label>
                <div className="grid grid-cols-1 gap-2">
                  {exportOptions.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => setExportType(option.type)}
                      className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                        exportType === option.type
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="mt-0.5">{option.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium">{option.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {option.description}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Estimated size: {formatSizeEstimate(option.type)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Format</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExportFormat('csv')}
                    className={`flex-1 rounded-lg border p-3 text-center transition-colors ${
                      exportFormat === 'csv'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    disabled={exportType === 'backup'}
                  >
                    <div className="font-medium">CSV</div>
                    <div className="text-xs text-muted-foreground">
                      Spreadsheet compatible
                    </div>
                  </button>
                  <button
                    onClick={() => setExportFormat('json')}
                    className={`flex-1 rounded-lg border p-3 text-center transition-colors ${
                      exportFormat === 'json'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="font-medium">JSON</div>
                    <div className="text-xs text-muted-foreground">
                      Developer friendly
                    </div>
                  </button>
                </div>
                {exportType === 'backup' && (
                  <p className="text-xs text-muted-foreground">
                    Complete backups are only available in JSON format
                  </p>
                )}
              </div>

              {/* Filters */}
              {(exportType === 'products' || exportType === 'transactions') && (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FilterIcon className="h-4 w-4" />
                    Filters
                  </div>

                  {exportType === 'products' && (
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={filters.category}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            category: e.target.value as
                              | 'all'
                              | 'shirt'
                              | 'pants',
                          })
                        }
                      >
                        <option value="all">All Categories</option>
                        <option value="shirt">Shirts</option>
                        <option value="pants">Pants</option>
                      </select>
                    </div>
                  )}

                  {exportType === 'transactions' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="transaction-type">
                          Transaction Type
                        </Label>
                        <select
                          id="transaction-type"
                          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={filters.transactionType}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              transactionType: e.target.value as
                                | 'all'
                                | 'sale'
                                | 'purchase',
                            })
                          }
                        >
                          <option value="all">All Transactions</option>
                          <option value="sale">Sales Only</option>
                          <option value="purchase">Purchases Only</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date-from">From Date</Label>
                          <div className="relative">
                            <Input
                              id="date-from"
                              type="date"
                              value={filters.dateFrom || ''}
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  dateFrom: e.target.value,
                                })
                              }
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
                              value={filters.dateTo || ''}
                              onChange={(e) =>
                                setFilters({
                                  ...filters,
                                  dateTo: e.target.value,
                                })
                              }
                              className="pl-10"
                            />
                            <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isExporting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExport}
                  className="flex-1"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <DownloadIcon className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Export {exportFormat.toUpperCase()}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
