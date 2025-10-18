/**
 * Fee Summary Dashboard Component
 * Comprehensive fee calculations and import fee summary
 * Part of the Fee Management System implementation
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Calculator,
  AlertTriangle,
  DollarSign,
  Truck,
  RefreshCw,
} from 'lucide-react';
import { formatVND } from '@/lib/currency';
import { storageService } from '@/lib/storage';
import type { ImportPhase, ImportFee } from '@/types';

interface FeeSummaryProps {
  showAllPhases?: boolean;
  importPhaseId?: string;
}

interface FeeStatistics {
  totalImportFees: number;
  feesByType: Record<string, number>;
  averageFeePerPhase: number;
  totalPhases: number;
}

interface OptimizationSuggestion {
  type: 'high_fee_percentage' | 'duplicate_supplier' | 'missing_category';
  message: string;
  importPhaseId?: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

interface PhaseSummary {
  totalFees: number;
  feesByType: Record<string, number>;
  averageFeePercentage: number;
  phaseTotalCost: number;
  finalCost: number;
  fees: ImportFee[];
}

const FEE_TYPE_LABELS = {
  shipping: 'Shipping',
  customs: 'Customs',
  handling: 'Handling',
  storage: 'Storage',
  other: 'Other',
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function FeeSummaryDashboard({
  showAllPhases = false,
  importPhaseId,
}: FeeSummaryProps) {
  const [statistics, setStatistics] = useState<FeeStatistics | null>(null);
  const [phaseSummary, setPhaseSummary] = useState<PhaseSummary | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [importPhases, setImportPhases] = useState<ImportPhase[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(
    importPhaseId || ''
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadFeeData = async () => {
      setLoading(true);
      try {
        // Load import phases
        const phases = storageService.getImportPhases();
        setImportPhases(phases);

        // Get overall statistics
        const stats = storageService.getAllImportFeesStatistics();
        setStatistics(stats);

        // Get optimization suggestions
        const optimizations = storageService.getFeeOptimizationSuggestions();
        setSuggestions(optimizations);

        // If specific phase requested, load its summary
        if (importPhaseId || selectedPhaseId) {
          const phaseId = importPhaseId || selectedPhaseId;
          const summary = storageService.getImportPhaseFeesSummary(phaseId);
          setPhaseSummary(summary);
        }
      } catch (error) {
        console.error('Error loading fee data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeeData();
  }, [importPhaseId, showAllPhases, selectedPhaseId]);

  const handlePhaseChange = (phaseId: string) => {
    setSelectedPhaseId(phaseId);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading fee summary...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const feeTypeChartData = statistics
    ? Object.entries(statistics.feesByType).map(([type, amount]) => ({
        name: FEE_TYPE_LABELS[type as keyof typeof FEE_TYPE_LABELS] || type,
        value: amount,
        percentage: ((amount / statistics.totalImportFees) * 100).toFixed(1),
      }))
    : [];

  const typeChartData = statistics
    ? Object.entries(statistics.feesByType)
        .sort(([, a], [, b]) => b - a)
        .map(([type, amount]) => ({
          name: type,
          amount,
        }))
    : [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Import Fees
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatVND(statistics?.totalImportFees || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {statistics?.totalPhases || 0} import phases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average per Phase
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatVND(statistics?.averageFeePerPhase || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Average fee cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Types</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(statistics?.feesByType || {}).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Different fee categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suggestions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suggestions.length}</div>
            <p className="text-xs text-muted-foreground">
              Optimization opportunities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="phase-details">Phase Details</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Fee Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Distribution by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {feeTypeChartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={feeTypeChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percentage }) =>
                            `${name}: ${percentage}%`
                          }
                        >
                          {feeTypeChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            formatVND(value as number),
                            'Amount',
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {feeTypeChartData.map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                            <span className="text-sm font-medium">
                              {item.name}
                            </span>
                          </div>
                          <div className="text-sm">
                            {formatVND(item.value)} ({item.percentage}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    No fee data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Fee Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Fee Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {typeChartData.slice(0, 5).map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center space-x-3"
                    >
                      <Badge variant="outline" className="w-12 justify-center">
                        #{index + 1}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatVND(item.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="phase-details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Phase Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {importPhases.map((phase) => (
                  <Button
                    key={phase.id}
                    variant={
                      selectedPhaseId === phase.id ? 'default' : 'outline'
                    }
                    onClick={() => handlePhaseChange(phase.id)}
                    className="justify-start"
                  >
                    {phase.code} - {formatVND(phase.totalCost)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {phaseSummary && (
            <Card>
              <CardHeader>
                <CardTitle>Phase Fee Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Total Fees</p>
                      <p className="text-2xl font-bold">
                        {formatVND(phaseSummary.totalFees)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Fee Percentage</p>
                      <p className="text-2xl font-bold">
                        {phaseSummary.averageFeePercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium">Fee Breakdown</p>
                    <div className="space-y-2">
                      {Object.entries(phaseSummary.feesByType).map(
                        ([type, amount]) => (
                          <div
                            key={type}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">
                              {FEE_TYPE_LABELS[
                                type as keyof typeof FEE_TYPE_LABELS
                              ] || type}
                            </span>
                            <span className="font-medium">
                              {formatVND(amount)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 ${
                        suggestion.priority === 'high'
                          ? 'border-red-200 bg-red-50'
                          : suggestion.priority === 'medium'
                            ? 'border-yellow-200 bg-yellow-50'
                            : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Badge
                          variant={
                            suggestion.priority === 'high'
                              ? 'destructive'
                              : suggestion.priority === 'medium'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {suggestion.priority.toUpperCase()}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium">{suggestion.message}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {suggestion.suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    No optimization suggestions available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    tickFormatter={(value) =>
                      formatVND(value, { showSymbol: false })
                    }
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatVND(value as number),
                      'Amount',
                    ]}
                  />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
