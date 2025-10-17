/**
 * ExportDashboard Component
 * Comprehensive dashboard for data export and backup management
 */

'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { ExportDialog } from './ExportDialog';
import { storageService } from '@/lib/storage';

interface StorageInfo {
  size: number;
  itemCount: number;
  productCount: number;
  transactionCount: number;
  importPhaseCount: number;
  revenueRecordCount: number;
}

export function ExportDashboard() {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorageInfo = async () => {
      try {
        const info = storageService.getStorageInfo();
        const products = await storageService.getProducts();
        const transactions = await storageService.getTransactions();
        const importPhases = await storageService.getImportPhases();
        const revenueRecords = await storageService.getRevenueRecords();

        setStorageInfo({
          ...info,
          productCount: products.length,
          transactionCount: transactions.length,
          importPhaseCount: importPhases.length,
          revenueRecordCount: revenueRecords.length,
        });
      } catch (error) {
        console.error('Error loading storage info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStorageInfo();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const quickExportOptions = [
    {
      title: 'Products Export',
      description: 'Export product inventory and stock levels',
      icon: <DatabaseIcon className="h-6 w-6" />,
      color: 'bg-blue-500',
      count: storageInfo?.productCount || 0,
      action: () => setShowExportDialog(true),
    },
    {
      title: 'Transactions Export',
      description: 'Export sales and purchase records',
      icon: <FileTextIcon className="h-6 w-6" />,
      color: 'bg-green-500',
      count: storageInfo?.transactionCount || 0,
      action: () => setShowExportDialog(true),
    },
    {
      title: 'Revenue Reports',
      description: 'Export profit and revenue analytics',
      icon: <FileTextIcon className="h-6 w-6" />,
      color: 'bg-purple-500',
      count: storageInfo?.revenueRecordCount || 0,
      action: () => setShowExportDialog(true),
    },
    {
      title: 'Complete Backup',
      description: 'Full backup of all store data',
      icon: <HardDriveIcon className="h-6 w-6" />,
      color: 'bg-orange-500',
      count: storageInfo?.itemCount || 0,
      action: () => setShowExportDialog(true),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Data Export</h1>
          <p className="text-muted-foreground">
            Loading storage information...
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
          Export your store data in various formats for backup, analysis, or
          integration
        </p>
      </div>

      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InfoIcon className="h-5 w-5" />
            Storage Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {storageInfo?.productCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">Products</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {storageInfo?.transactionCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {storageInfo?.revenueRecordCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Revenue Records
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {formatFileSize(storageInfo?.size || 0)}
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
                <Badge variant="secondary">{option.count} items</Badge>
              </div>

              <h3 className="mb-2 font-semibold">{option.title}</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {option.description}
              </p>

              <Button onClick={option.action} className="w-full" size="sm">
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export Formats Information */}
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
              <span className="text-sm">Easy to read and edit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Smaller file size</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-sm">Limited to tabular data</span>
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
              <span className="text-sm">Developer-friendly format</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Preserves data structure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Perfect for system integration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Includes metadata</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5" />
            Export Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Regular Backups</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Export complete backups weekly</li>
                <li>• Keep multiple backup versions</li>
                <li>• Store backups in secure locations</li>
                <li>• Test backup restoration periodically</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Data Analysis</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Use CSV for spreadsheet analysis</li>
                <li>• Export filtered data for specific periods</li>
                <li>• Include transaction dates for time-series analysis</li>
                <li>• Export revenue reports for financial analysis</li>
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
          Open Export Dialog
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
