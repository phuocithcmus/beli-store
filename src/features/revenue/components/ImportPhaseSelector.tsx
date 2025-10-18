/**
 * ImportPhaseSelector Component
 * Allows users to select an import phase when creating revenue entries
 * Only shows phases that have available products (remaining quantity > 0)
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatVND } from '@/lib/currency';
import type { ImportPhase } from '@/types';

interface ImportPhaseSelectorProps {
  productId: string | undefined;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  availablePhases: ImportPhase[];
  disabled?: boolean;
  error?: string;
}

export function ImportPhaseSelector({
  productId,
  value,
  onChange,
  availablePhases,
  disabled = false,
  error,
}: ImportPhaseSelectorProps) {
  // Filter phases that have the selected product
  const filteredPhases = availablePhases;

  const selectedPhase = filteredPhases.find((phase) => phase.id === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="import-phase-select">
        Import Phase (Optional)
        {filteredPhases.length > 0 && (
          <span className="ml-2 text-sm text-gray-500">
            {filteredPhases.length} available
          </span>
        )}
      </Label>

      <Select
        value={value || 'none'}
        onValueChange={(val) => onChange(val === 'none' ? undefined : val)}
        disabled={disabled || !productId || filteredPhases.length === 0}
      >
        <SelectTrigger
          id="import-phase-select"
          className={error ? 'border-red-500' : ''}
        >
          <SelectValue
            placeholder={
              !productId
                ? 'Select a product first'
                : filteredPhases.length === 0
                  ? 'No import phases available'
                  : 'Select import phase for cost tracking'
            }
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No import phase</SelectItem>
          {filteredPhases.map((phase) => (
            <SelectItem key={phase.id} value={phase.id}>
              <div className="flex flex-col items-start justify-start">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{phase.code}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      phase.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {phase.status}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {new Date(phase.date).toLocaleDateString('vi-VN')} • Total:{' '}
                  {formatVND(phase.totalCost)}
                </span>
                {phase.description && (
                  <span className="text-xs text-gray-500">
                    {phase.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {selectedPhase && (
        <div className="mt-2 rounded-md bg-blue-50 p-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-blue-900">
              Selected Import Phase
            </h4>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                selectedPhase.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {selectedPhase.status}
            </span>
          </div>
          <div className="mt-1 text-sm text-blue-700">
            <p>Code: {selectedPhase.code}</p>
            <p>
              Date: {new Date(selectedPhase.date).toLocaleDateString('vi-VN')}
            </p>
            <p>Total Cost: {formatVND(selectedPhase.totalCost)}</p>
            {selectedPhase.description && (
              <p>Description: {selectedPhase.description}</p>
            )}
          </div>
          <p className="mt-2 text-xs text-blue-600">
            This will be used for profit calculation
            {selectedPhase.status === 'completed' &&
              ' (historical data from completed import phase)'}
          </p>
        </div>
      )}

      {!productId && (
        <p className="text-sm text-gray-500">
          Select a product to see available import phases
        </p>
      )}

      {productId && filteredPhases.length === 0 && (
        <p className="text-sm text-yellow-600">
          No import phases available for this product. Revenue will be recorded
          without cost tracking.
        </p>
      )}
    </div>
  );
}

export default ImportPhaseSelector;
