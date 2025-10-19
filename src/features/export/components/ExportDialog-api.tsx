/**
 * ExportDialog Component - Connected to Backend API
 * Modal dialog for data export functionality with format and filter options
 * Updated to use API hooks instead of local storage
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
  AlertCircle,
} from 'lucide-react';
import {
  useProducts,
  useRevenue,
  useImports,
  useVariants,
  useChannels,
  useFees,
} from '@/hooks/use-api';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportType =
  | 'products'
  | 'variants'
  | 'revenue'
  | 'imports'
  | 'channels'
  | 'fees'
  | 'backup';
type ExportFormat = 'csv' | 'json';

interface ExportFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: 'all' | 'shirt' | 'pants';
  status?: 'all' | 'active' | 'inactive';
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const [exportType, setExportType] = useState<ExportType>('products');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [filters, setFilters] = useState<ExportFilters>({
    category: 'all',
    status: 'all',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // API Hooks
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: variants = [], isLoading: variantsLoading } = useVariants();
  const { data: revenueEntries = [], isLoading: revenueLoading } = useRevenue();
  const { data: importPhases = [], isLoading: importsLoading } = useImports();
  const { data: channels = [], isLoading: channelsLoading } = useChannels();
  const { data: feeStructures = [], isLoading: feesLoading } = useFees();

  if (!isOpen) {
    return null;
  }

  const exportOptions = [
    {
      type: 'products' as const,
      title: 'Products',
      description: 'Export product inventory data from API',
      icon: <DatabaseIcon className="h-5 w-5" />,
      count: products.length,
      loading: productsLoading,
    },
    {
      type: 'variants' as const,
      title: 'Product Variants',
      description: 'Export product variant details from API',
      icon: <DatabaseIcon className="h-5 w-5" />,
      count: variants.length,
      loading: variantsLoading,
    },
    {
      type: 'revenue' as const,
      title: 'Revenue Reports',
      description: 'Export revenue and profit analytics from API',
      icon: <FileTextIcon className="h-5 w-5" />,
      count: revenueEntries.length,
      loading: revenueLoading,
    },
    {
      type: 'imports' as const,
      title: 'Import Phases',
      description: 'Export import phase records from API',
      icon: <DatabaseIcon className="h-5 w-5" />,
      count: importPhases.length,
      loading: importsLoading,
    },
    {
      type: 'channels' as const,
      title: 'Sales Channels',
      description: 'Export sales channel configuration from API',
      icon: <FileTextIcon className="h-5 w-5" />,
      count: channels.length,
      loading: channelsLoading,
    },
    {
      type: 'fees' as const,
      title: 'Fee Structures',
      description: 'Export channel fee structures from API',
      icon: <FileTextIcon className="h-5 w-5" />,
      count: feeStructures.length,
      loading: feesLoading,
    },
    {
      type: 'backup' as const,
      title: 'Complete Backup',
      description: 'Export all store data from API',
      icon: <DatabaseIcon className="h-5 w-5" />,
      count:
        products.length +
        variants.length +
        revenueEntries.length +
        importPhases.length +
        channels.length +
        feeStructures.length,
      loading:
        productsLoading ||
        variantsLoading ||
        revenueLoading ||
        importsLoading ||
        channelsLoading ||
        feesLoading,
    },
  ];

  const convertToCSV = (
    data: Record<string, unknown>[],
    headers: string[]
  ): string => {
    const csvHeaders = headers.join(',');
    const csvRows = data.map((item) =>
      headers
        .map((header) => {
          const value = item[header];
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setExportError(null);

    try {
      let data: string;
      let filename: string;

      // Apply filters based on export type
      let filteredData: unknown[] = [];

      switch (exportType) {
        case 'products':
          filteredData = products.filter((product) => {
            if (
              filters.category !== 'all' &&
              product.category !== filters.category
            ) {
              return false;
            }
            return true;
          });

          if (exportFormat === 'csv') {
            const headers = [
              '_id',
              'name',
              'category',
              'brand',
              'color',
              'size',
              'costPrice',
              'sellingPrice',
              'inventory',
              'createdAt',
            ];
            data = convertToCSV(
              filteredData as Record<string, unknown>[],
              headers
            );
            filename = `products_${new Date().toISOString().split('T')[0]}.csv`;
          } else {
            data = JSON.stringify(filteredData, null, 2);
            filename = `products_${new Date().toISOString().split('T')[0]}.json`;
          }
          break;

        case 'variants':
          filteredData = variants;

          if (exportFormat === 'csv') {
            const headers = ['_id', 'name', 'values', 'isGlobal', 'createdAt'];
            data = convertToCSV(
              filteredData as Record<string, unknown>[],
              headers
            );
            filename = `variants_${new Date().toISOString().split('T')[0]}.csv`;
          } else {
            data = JSON.stringify(filteredData, null, 2);
            filename = `variants_${new Date().toISOString().split('T')[0]}.json`;
          }
          break;

        case 'revenue':
          filteredData = revenueEntries.filter((entry) => {
            if (
              filters.dateFrom &&
              new Date(entry.saleDate) < new Date(filters.dateFrom)
            ) {
              return false;
            }
            if (
              filters.dateTo &&
              new Date(entry.saleDate) > new Date(filters.dateTo)
            ) {
              return false;
            }
            return true;
          });

          if (exportFormat === 'csv') {
            const headers = [
              'id',
              'productName',
              'amount',
              'quantity',
              'unitPrice',
              'salesChannel',
              'saleDate',
              'createdAt',
            ];
            data = convertToCSV(
              filteredData as Record<string, unknown>[],
              headers
            );
            filename = `revenue_${new Date().toISOString().split('T')[0]}.csv`;
          } else {
            data = JSON.stringify(filteredData, null, 2);
            filename = `revenue_${new Date().toISOString().split('T')[0]}.json`;
          }
          break;

        case 'imports':
          filteredData = importPhases;

          if (exportFormat === 'csv') {
            const headers = [
              '_id',
              'name',
              'status',
              'importDate',
              'totalCost',
              'productCount',
              'description',
              'createdAt',
            ];
            data = convertToCSV(
              filteredData as Record<string, unknown>[],
              headers
            );
            filename = `imports_${new Date().toISOString().split('T')[0]}.csv`;
          } else {
            data = JSON.stringify(filteredData, null, 2);
            filename = `imports_${new Date().toISOString().split('T')[0]}.json`;
          }
          break;

        case 'channels':
          filteredData = channels;

          if (exportFormat === 'csv') {
            const headers = [
              '_id',
              'name',
              'type',
              'isActive',
              'configuration',
              'createdAt',
            ];
            data = convertToCSV(
              filteredData as Record<string, unknown>[],
              headers
            );
            filename = `channels_${new Date().toISOString().split('T')[0]}.csv`;
          } else {
            data = JSON.stringify(filteredData, null, 2);
            filename = `channels_${new Date().toISOString().split('T')[0]}.json`;
          }
          break;

        case 'fees':
          filteredData = feeStructures;

          if (exportFormat === 'csv') {
            const headers = [
              '_id',
              'channelId',
              'name',
              'feeType',
              'value',
              'isActive',
              'createdAt',
            ];
            data = convertToCSV(
              filteredData as Record<string, unknown>[],
              headers
            );
            filename = `fees_${new Date().toISOString().split('T')[0]}.csv`;
          } else {
            data = JSON.stringify(filteredData, null, 2);
            filename = `fees_${new Date().toISOString().split('T')[0]}.json`;
          }
          break;

        case 'backup':
          const completeBackup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {
              products,
              variants,
              revenueEntries,
              importPhases,
              channels,
              feeStructures,
            },
            metadata: {
              productCount: products.length,
              variantCount: variants.length,
              revenueEntryCount: revenueEntries.length,
              importPhaseCount: importPhases.length,
              channelCount: channels.length,
              feeStructureCount: feeStructures.length,
              totalRecords:
                products.length +
                variants.length +
                revenueEntries.length +
                importPhases.length +
                channels.length +
                feeStructures.length,
            },
          };
          data = JSON.stringify(completeBackup, null, 2);
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
      setExportError(
        error instanceof Error
          ? error.message
          : 'Export failed. Please try again.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const formatSizeEstimate = (type: ExportType): string => {
    const option = exportOptions.find((opt) => opt.type === type);
    const recordCount = option?.count || 0;

    if (recordCount === 0) {
      return '0 KB';
    }

    const estimatedKbPerRecord = type === 'backup' ? 5 : 1;
    const estimatedKb = recordCount * estimatedKbPerRecord;

    if (estimatedKb < 1000) {
      return `~${estimatedKb} KB`;
    } else {
      return `~${(estimatedKb / 1000).toFixed(1)} MB`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DownloadIcon className="h-5 w-5" />
            Export Data from API
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {exportError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <div className="flex-1">
                <p className="font-medium">Export Failed</p>
                <p className="text-sm">{exportError}</p>
              </div>
            </div>
          )}

          {exportSuccess ? (
            <div className="py-8 text-center">
              <CheckIcon className="mx-auto mb-4 h-16 w-16 text-green-500" />
              <h3 className="text-lg font-semibold text-green-700">
                Export Successful!
              </h3>
              <p className="text-muted-foreground">
                Your file has been downloaded from the backend API.
              </p>
            </div>
          ) : (
            <>
              {/* Export Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Data Type (From Backend API)
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {exportOptions.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => setExportType(option.type)}
                      disabled={option.loading}
                      className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                        exportType === option.type
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      } ${option.loading ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <div className="mt-0.5">{option.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium">{option.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {option.description}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {option.loading
                              ? 'Loading...'
                              : `${option.count} records • ${formatSizeEstimate(option.type)}`}
                          </span>
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
                      Full API structure
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
              {(exportType === 'products' || exportType === 'revenue') && (
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

                  {exportType === 'revenue' && (
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
                  disabled={
                    isExporting ||
                    productsLoading ||
                    variantsLoading ||
                    revenueLoading ||
                    importsLoading ||
                    channelsLoading ||
                    feesLoading
                  }
                >
                  {isExporting ? (
                    <>
                      <DownloadIcon className="mr-2 h-4 w-4 animate-spin" />
                      Exporting from API...
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Export {exportFormat.toUpperCase()} from API
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
