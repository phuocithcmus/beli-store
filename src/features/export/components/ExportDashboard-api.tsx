/**
 * ExportDashboard Component - Connected to Backend API
 * Comprehensive dashboard for data export and backup management with API integration
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DownloadIcon,
  DatabaseIcon,
  FileTextIcon,
  HardDriveIcon,
  InfoIcon,
  HistoryIcon,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { ExportDialog } from './ExportDialog-api';
import {
  useProducts,
  useRevenue,
  useImports,
  useVariants,
  useChannels,
  useFees,
} from '@/hooks/use-api';

interface StorageInfo {
  size: number;
  itemCount: number;
  productCount: number;
  variantCount: number;
  revenueRecordCount: number;
  importPhaseCount: number;
  channelCount: number;
  feeStructureCount: number;
}

export function ExportDashboard() {
  const [showExportDialog, setShowExportDialog] = useState(false);

  // API Hooks for data counts
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts();

  const {
    data: variants = [],
    isLoading: variantsLoading,
    error: variantsError,
    refetch: refetchVariants,
  } = useVariants();

  const {
    data: revenueEntries = [],
    isLoading: revenueLoading,
    error: revenueError,
    refetch: refetchRevenue,
  } = useRevenue();

  const {
    data: importPhases = [],
    isLoading: importsLoading,
    error: importsError,
    refetch: refetchImports,
  } = useImports();

  const {
    data: channels = [],
    isLoading: channelsLoading,
    error: channelsError,
    refetch: refetchChannels,
  } = useChannels();

  const {
    data: feeStructures = [],
    isLoading: feesLoading,
    error: feesError,
    refetch: refetchFees,
  } = useFees();

  const isLoading =
    productsLoading ||
    variantsLoading ||
    revenueLoading ||
    importsLoading ||
    channelsLoading ||
    feesLoading;
  const error =
    productsError ||
    variantsError ||
    revenueError ||
    importsError ||
    channelsError ||
    feesError;

  const handleRefresh = () => {
    refetchProducts();
    refetchVariants();
    refetchRevenue();
    refetchImports();
    refetchChannels();
    refetchFees();
  };

  // Calculate storage info from API data
  const storageInfo: StorageInfo = {
    size: 0, // Not available from API, will show as estimated
    itemCount:
      products.length +
      variants.length +
      revenueEntries.length +
      importPhases.length +
      channels.length +
      feeStructures.length,
    productCount: products.length,
    variantCount: variants.length,
    revenueRecordCount: revenueEntries.length,
    importPhaseCount: importPhases.length,
    channelCount: channels.length,
    feeStructureCount: feeStructures.length,
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return 'Estimated: ~500KB';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const quickExportOptions = [
    {
      title: 'Products Export',
      description: 'Export product inventory and variants from API',
      icon: <DatabaseIcon className="h-6 w-6" />,
      color: 'bg-blue-500',
      count: storageInfo.productCount + storageInfo.variantCount,
      action: () => setShowExportDialog(true),
    },
    {
      title: 'Revenue Reports',
      description: 'Export sales and revenue records from API',
      icon: <FileTextIcon className="h-6 w-6" />,
      color: 'bg-green-500',
      count: storageInfo.revenueRecordCount,
      action: () => setShowExportDialog(true),
    },
    {
      title: 'Import Analytics',
      description: 'Export import phase data and cost analysis',
      icon: <FileTextIcon className="h-6 w-6" />,
      color: 'bg-purple-500',
      count: storageInfo.importPhaseCount,
      action: () => setShowExportDialog(true),
    },
    {
      title: 'Complete Backup',
      description: 'Full backup of all store data from API',
      icon: <HardDriveIcon className="h-6 w-6" />,
      color: 'bg-orange-500',
      count: storageInfo.itemCount,
      action: () => setShowExportDialog(true),
    },
  ];

  // Error handling
  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <div className="flex-1">
                <p className="font-medium">Failed to load export data</p>
                <p className="text-sm text-red-600">
                  Please check your connection and try again.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="mr-1 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Data Export & Backup</h1>
          <p className="text-muted-foreground">
            Loading export data from backend API...
          </p>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="h-20 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Data Export & Backup</h1>
        <p className="text-muted-foreground">
          Export your store data from the backend API in various formats for
          backup, analysis, or integration
        </p>
        <div className="flex items-center justify-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-muted-foreground">
            Connected to Backend API
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InfoIcon className="h-5 w-5" />
            API Data Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4 lg:grid-cols-6">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {storageInfo.productCount}
              </div>
              <div className="text-sm text-muted-foreground">Products</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-600">
                {storageInfo.variantCount}
              </div>
              <div className="text-sm text-muted-foreground">Variants</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {storageInfo.revenueRecordCount}
              </div>
              <div className="text-sm text-muted-foreground">
                Revenue Records
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {storageInfo.importPhaseCount}
              </div>
              <div className="text-sm text-muted-foreground">Import Phases</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {storageInfo.channelCount}
              </div>
              <div className="text-sm text-muted-foreground">Channels</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {formatFileSize(storageInfo.size)}
              </div>
              <div className="text-sm text-muted-foreground">Total Size</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Export Options */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickExportOptions.map((option, index) => (
          <Card key={index} className="transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className={`rounded-lg p-3 ${option.color} text-white`}>
                  {option.icon}
                </div>
                <Badge
                  variant="secondary"
                  className="border-green-200 bg-green-50 text-green-700"
                >
                  {option.count} items
                </Badge>
              </div>

              <h3 className="mb-2 font-semibold">{option.title}</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {option.description}
              </p>

              <Button onClick={option.action} className="w-full" size="sm">
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export from API
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Data Quality Indicators */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Freshness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Real-time from MongoDB</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Always up-to-date</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">No local cache delays</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Export Formats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-sm">CSV for spreadsheets</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-sm">JSON for developers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-sm">Structured data export</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Integrity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Validated by backend</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Complete relationships</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">No data corruption</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Features with API */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CSV Format</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">
                Compatible with Excel and Google Sheets
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Direct API data transformation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Optimized file size</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-sm">
                Includes related data (variants, fees)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">JSON Format</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Native API response format</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Preserves full data structure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Perfect for system integration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">
                Includes API metadata and timestamps
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best Practices for API-based Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5" />
            API Export Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Real-time Backups</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Export fresh data directly from MongoDB</li>
                <li>• Automatic relationship inclusion</li>
                <li>• No stale local storage issues</li>
                <li>• Consistent data validation</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Advanced Analytics</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Export with calculated fees and profits</li>
                <li>• Include variant-level inventory data</li>
                <li>• Multi-channel revenue breakdowns</li>
                <li>• Import phase cost analysis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="text-center">
        <Button
          onClick={() => setShowExportDialog(true)}
          size="lg"
          className="min-w-48"
        >
          <DownloadIcon className="mr-2 h-5 w-5" />
          Open API Export Dialog
        </Button>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  );
}
