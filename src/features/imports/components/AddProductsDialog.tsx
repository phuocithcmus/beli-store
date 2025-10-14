/**
 * AddProductsDialog Component
 * Dialog for adding existing products to an import phase
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Product, ImportPhase } from '@/types';

interface ProductSelection {
  product: Product;
  quantity: number;
  unitCost: number;
}

interface AddProductsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  importPhase: ImportPhase;
  availableProducts: Product[];
  onAddProducts: (
    phaseId: string,
    selections: Array<{ productId: string; quantity: number; unitCost: number }>
  ) => Promise<void>;
}

export function AddProductsDialog({
  isOpen,
  onClose,
  importPhase,
  availableProducts,
  onAddProducts,
}: AddProductsDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<ProductSelection[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedProducts([]);
    }
  }, [isOpen]);

  // Filter products based on search term
  const filteredProducts = availableProducts.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.code.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower)
    );
  });

  const handleAddProduct = (product: Product) => {
    if (selectedProducts.find((s) => s.product.id === product.id)) {
      return; // Already selected
    }

    setSelectedProducts((prev) => [
      ...prev,
      {
        product,
        quantity: 1,
        unitCost: product.purchasePrice,
      },
    ]);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.filter((s) => s.product.id !== productId)
    );
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;

    setSelectedProducts((prev) =>
      prev.map((s) => (s.product.id === productId ? { ...s, quantity } : s))
    );
  };

  const handleUnitCostChange = (productId: string, unitCost: number) => {
    if (unitCost < 0) return;

    setSelectedProducts((prev) =>
      prev.map((s) => (s.product.id === productId ? { ...s, unitCost } : s))
    );
  };

  const handleSubmit = async () => {
    if (selectedProducts.length === 0) return;

    setIsSubmitting(true);
    try {
      await onAddProducts(
        importPhase.id,
        selectedProducts.map((s) => ({
          productId: s.product.id,
          quantity: s.quantity,
          unitCost: s.unitCost,
        }))
      );
      onClose();
    } catch (error) {
      console.error('Failed to add products:', error);
      alert('Failed to add products to import phase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCost = selectedProducts.reduce(
    (sum, s) => sum + s.quantity * s.unitCost,
    0
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-xl font-semibold">
              Add Products to Import Phase
            </h2>
            <p className="text-sm text-muted-foreground">
              Import Phase: {importPhase.code}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex h-[600px]">
          {/* Available Products */}
          <div className="flex-1 border-r">
            <div className="border-b p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="h-full overflow-y-auto p-4">
              <h3 className="mb-3 font-medium">
                Available Products ({filteredProducts.length})
              </h3>

              {filteredProducts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No products found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => {
                    const isSelected = selectedProducts.find(
                      (s) => s.product.id === product.id
                    );

                    return (
                      <div
                        key={product.id}
                        className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                          isSelected
                            ? 'border-primary bg-muted'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => !isSelected && handleAddProduct(product)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.code} • {product.category}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Stock: {product.remainingQuantity} • $
                              {product.purchasePrice.toFixed(2)}
                            </div>
                          </div>
                          {!isSelected && (
                            <Button size="sm" variant="outline">
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          {isSelected && (
                            <div className="text-sm font-medium text-green-600">
                              Selected
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Selected Products */}
          <div className="w-96">
            <div className="border-b p-4">
              <h3 className="font-medium">
                Selected Products ({selectedProducts.length})
              </h3>
            </div>

            <div className="h-full overflow-y-auto p-4">
              {selectedProducts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No products selected
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedProducts.map((selection) => (
                    <div
                      key={selection.product.id}
                      className="rounded-lg border p-3"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {selection.product.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {selection.product.code}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveProduct(selection.product.id)
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Label
                            htmlFor={`qty-${selection.product.id}`}
                            className="text-xs"
                          >
                            Quantity
                          </Label>
                          <Input
                            id={`qty-${selection.product.id}`}
                            type="number"
                            min="1"
                            value={selection.quantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                selection.product.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="h-8"
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor={`cost-${selection.product.id}`}
                            className="text-xs"
                          >
                            Unit Cost ($)
                          </Label>
                          <Input
                            id={`cost-${selection.product.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={selection.unitCost}
                            onChange={(e) =>
                              handleUnitCostChange(
                                selection.product.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8"
                          />
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Total: $
                          {(selection.quantity * selection.unitCost).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-muted/50 p-6">
          <div className="text-sm">
            {selectedProducts.length > 0 && (
              <span>
                Total Cost:{' '}
                <span className="font-mono font-medium">
                  ${totalCost.toFixed(2)}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedProducts.length === 0 || isSubmitting}
            >
              {isSubmitting
                ? 'Adding...'
                : `Add ${selectedProducts.length} Products`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
