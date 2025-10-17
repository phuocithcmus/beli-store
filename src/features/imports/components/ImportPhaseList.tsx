/**
 * ImportPhaseList Component
 * Displays a filterable list of import phases with management actions
 */

'use client';

import { useState } from 'react';
import { Search, Edit2, Trash2, Eye, Plus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ImportPhase } from '@/types';

interface ImportPhaseFilters {
  status: 'all' | 'active' | 'completed';
  search: string;
  dateFrom: string;
  dateTo: string;
}

interface ImportPhaseListProps {
  importPhases: ImportPhase[];
  onEditPhase?: (phase: ImportPhase) => void;
  onDeletePhase?: (phaseId: string) => void;
  onViewPhase?: (phase: ImportPhase) => void;
  onCompletePhase?: (phaseId: string) => void;
  onAddProducts?: (phase: ImportPhase) => void;
}

export function ImportPhaseList({
  importPhases,
  onEditPhase,
  onDeletePhase,
  onViewPhase,
  onCompletePhase,
  onAddProducts,
}: ImportPhaseListProps) {
  const [filters, setFilters] = useState<ImportPhaseFilters>({
    status: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  // Filter import phases based on current filters
  const filteredPhases = importPhases.filter((phase) => {
    // Status filter
    if (filters.status !== 'all' && phase.status !== filters.status) {
      return false;
    }

    // Search filter (code or description)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        phase.code.toLowerCase().includes(searchLower) ||
        (phase.description &&
          phase.description.toLowerCase().includes(searchLower))
      );
    }

    // Date range filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      if (phase.date < fromDate) {
        return false;
      }
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      if (phase.date > toDate) {
        return false;
      }
    }

    return true;
  });

  const handleCompleteClick = (phase: ImportPhase) => {
    if (phase.totalItems === 0) {
      alert(
        'Cannot complete import phase with no products. Please add products first.'
      );
      return;
    }

    if (
      confirm(
        `Are you sure you want to complete import phase "${phase.code}"? This action cannot be undone.`
      )
    ) {
      onCompletePhase?.(phase.id);
    }
  };

  const handleDeleteClick = (phase: ImportPhase) => {
    if (
      confirm(`Are you sure you want to delete import phase "${phase.code}"?`)
    ) {
      onDeletePhase?.(phase.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 rounded-lg bg-muted/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="search">Search phases</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by code or description..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value as ImportPhaseFilters['status'],
              }))
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <Label htmlFor="dateFrom">Date From</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
            }
          />
        </div>

        <div>
          <Label htmlFor="dateTo">Date To</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
            }
          />
        </div>
      </div>

      {/* Import Phases Table */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h3 className="font-semibold">
            Import Phases ({filteredPhases.length})
          </h3>
        </div>

        {filteredPhases.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
              <Eye className="h-full w-full" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">
              No import phases found
            </h3>
            <p className="text-muted-foreground">
              {importPhases.length === 0
                ? 'Get started by creating your first import phase'
                : 'Try adjusting your filters or search terms'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-medium">Code</th>
                  <th className="p-4 text-left font-medium">Date</th>
                  <th className="p-4 text-left font-medium">Description</th>
                  <th className="p-4 text-center font-medium">Status</th>
                  <th className="p-4 text-right font-medium">Items</th>
                  <th className="p-4 text-right font-medium">Total Cost</th>
                  <th className="p-4 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPhases.map((phase) => (
                  <tr key={phase.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-mono text-sm font-medium">
                      {phase.code}
                    </td>
                    <td className="p-4">{phase.date.toLocaleDateString()}</td>
                    <td className="p-4">{phase.description || '—'}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          phase.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {phase.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium">
                      {phase.totalItems}
                    </td>
                    <td className="p-4 text-right font-mono">
                      ${phase.totalCost.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        {onViewPhase && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewPhase(phase)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}

                        {phase.status === 'active' && onAddProducts && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAddProducts(phase)}
                            title="Add products"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}

                        {phase.status === 'active' && onEditPhase && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditPhase(phase)}
                            title="Edit phase"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}

                        {phase.status === 'active' &&
                          onCompletePhase &&
                          phase.totalItems > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCompleteClick(phase)}
                              title="Complete phase"
                              className="text-green-600 hover:bg-green-50 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}

                        {phase.status === 'active' && onDeletePhase && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(phase)}
                            title="Delete phase"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
