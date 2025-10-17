/**
 * AddProductsDialog Component
 * Enhanced dialog for adding products and their variants to an import phase
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Product, ProductVariant, ImportPhase } from '@/types';
import { formatVND } from '@/lib/currency';

interface VariantSelection {
  product: Product;
  variant?: ProductVariant;
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
    selections: {
      productId: string;
      productVariantId?: string;
      quantity: number;
      unitCost: number;
    }[]
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
  const [selectedItems, setSelectedItems] = useState<VariantSelection[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productVariants, setProductVariants] = useState<
    Record<string, ProductVariant[]>
  >({});

  // Load variants for all products
  useEffect(() => {
    if (isOpen) {
      const variants: Record<string, ProductVariant[]> = {};

      availableProducts.forEach((product) => {
        if (product.hasVariants && product.variants) {
          variants[product.id] = product.variants;
        }
      });
      setProductVariants(variants);
    }
  }, [isOpen, availableProducts]);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedItems([]);
      setExpandedProducts(new Set());
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

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleAddItem = (product: Product, variant?: ProductVariant) => {
    if (
      selectedItems.find(
        (s) =>
          s.product.id === product.id &&
          (!variant || s.variant?.id === variant.id)
      )
    ) {
      return; // Already selected
    }

    const basePrice = variant?.sellingPrice || product.purchasePrice;

    setSelectedItems((prev) => [
      ...prev,
      {
        product,
        variant,
        quantity: 1,
        unitCost: basePrice,
      },
    ]);
  };

  const handleRemoveItem = (productId: string, variantId?: string) => {
    setSelectedItems((prev) =>
      prev.filter(
        (s) =>
          !(
            s.product.id === productId &&
            (!variantId || s.variant?.id === variantId)
          )
      )
    );
  };

  const handleQuantityChange = (
    productId: string,
    variantId: string | undefined,
    quantity: number
  ) => {
    if (quantity < 1) {
      return;
    }

    setSelectedItems((prev) =>
      prev.map((s) =>
        s.product.id === productId &&
        (!variantId || s.variant?.id === variantId)
          ? { ...s, quantity }
          : s
      )
    );
  };

  const handleUnitCostChange = (
    productId: string,
    variantId: string | undefined,
    unitCost: number
  ) => {
    if (unitCost < 0) {
      return;
    }

    setSelectedItems((prev) =>
      prev.map((s) =>
        s.product.id === productId &&
        (!variantId || s.variant?.id === variantId)
          ? { ...s, unitCost }
          : s
      )
    );
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const selections = selectedItems.map((s) => ({
        productId: s.product.id,
        productVariantId: s.variant?.id,
        quantity: s.quantity,
        unitCost: s.unitCost,
      }));

      await onAddProducts(importPhase.id, selections);
      onClose();
    } catch (error) {
      console.error('Failed to add products:', error);
      alert('Failed to add products to import phase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCost = selectedItems.reduce(
    (sum, s) => sum + s.quantity * s.unitCost,
    0
  );

  const getItemDisplayName = (selection: VariantSelection) => {
    if (selection.variant) {
      return `${selection.product.name} - ${selection.variant.color} ${selection.variant.size} ${selection.variant.form}`;
    }
    return selection.product.name;
  };

  const isItemSelected = (product: Product, variant?: ProductVariant) => {
    return selectedItems.find(
      (s) =>
        s.product.id === product.id &&
        (!variant || s.variant?.id === variant.id)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col p-0">
        <DialogHeader className="flex-shrink-0 border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Add Products & Variants to Import Phase
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Import Phase:{' '}
            <span className="font-medium">{importPhase.code}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          {/* Available Products */}
          <div className="flex min-h-0 flex-1 flex-col border-r bg-gray-50/50">
            <div className="flex-shrink-0 border-b bg-white p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products by name, code, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="mb-4 flex items-center font-medium text-gray-900">
                <Package className="mr-2 h-4 w-4" />
                Available Products ({filteredProducts.length})
              </h3>

              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No products found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProducts.map((product) => {
                    const variants = productVariants[product.id] || [];
                    const hasVariants =
                      product.hasVariants && variants.length > 0;
                    const isExpanded = expandedProducts.has(product.id);
                    const isProductSelected = isItemSelected(product);

                    return (
                      <div
                        key={product.id}
                        className="rounded-lg border bg-white shadow-sm transition-all hover:shadow-md"
                      >
                        {/* Product Header */}
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                {hasVariants && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      toggleProductExpansion(product.id)
                                    }
                                    className="h-6 w-6 p-0"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">
                                    {product.name}
                                  </h4>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>{product.code}</span>
                                    <span>•</span>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {product.category}
                                    </Badge>
                                    <span>•</span>
                                    <span>
                                      Stock: {product.remainingQuantity}
                                    </span>
                                    <span>•</span>
                                    <span>
                                      {formatVND(product.purchasePrice)}
                                    </span>
                                  </div>
                                  {hasVariants && (
                                    <div className="mt-1">
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {variants.length} variants available
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {!hasVariants && (
                              <div className="flex items-center gap-2">
                                {isProductSelected ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    Selected
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAddItem(product)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Variants */}
                        {hasVariants && isExpanded && (
                          <div className="border-t bg-gray-50 p-4">
                            <div className="space-y-2">
                              {variants.map((variant) => {
                                const isVariantSelected = isItemSelected(
                                  product,
                                  variant
                                );
                                const availableStock =
                                  variant.inventoryCount -
                                  variant.reservedCount -
                                  variant.soldCount;

                                return (
                                  <div
                                    key={variant.id}
                                    className="flex items-center justify-between rounded-md border bg-white p-3"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                          {variant.color} {variant.size}{' '}
                                          {variant.form}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {variant.sku}
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Available: {availableStock} •{' '}
                                        {formatVND(
                                          variant.sellingPrice ||
                                            product.purchasePrice
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {isVariantSelected ? (
                                        <Badge className="bg-green-100 text-green-800">
                                          Selected
                                        </Badge>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleAddItem(product, variant)
                                          }
                                          //   disabled={availableStock <= 0}
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Selected Products */}
          <div className="flex min-h-0 w-96 flex-col bg-white">
            <div className="flex-shrink-0 border-b bg-gradient-to-r from-green-50 to-emerald-50 p-4">
              <h3 className="font-medium text-gray-900">
                Selected Items ({selectedItems.length})
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedItems.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="mt-2 text-gray-500">No items selected</p>
                  <p className="text-xs text-gray-400">
                    Add products or variants from the left panel
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedItems.map((selection, index) => (
                    <div
                      key={`${selection.product.id}-${selection.variant?.id || 'base'}`}
                      className="rounded-lg border bg-gray-50 p-4"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {getItemDisplayName(selection)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {selection.product.code}
                            {selection.variant && (
                              <span className="ml-1">
                                • {selection.variant.sku}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveItem(
                              selection.product.id,
                              selection.variant?.id
                            )
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label
                            htmlFor={`qty-${index}`}
                            className="text-xs font-medium text-gray-700"
                          >
                            Quantity
                          </Label>
                          <Input
                            id={`qty-${index}`}
                            type="number"
                            min="1"
                            value={selection.quantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                selection.product.id,
                                selection.variant?.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="mt-1 h-8"
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor={`cost-${index}`}
                            className="text-xs font-medium text-gray-700"
                          >
                            Unit Cost (VND)
                          </Label>
                          <Input
                            id={`cost-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={selection.unitCost}
                            onChange={(e) =>
                              handleUnitCostChange(
                                selection.product.id,
                                selection.variant?.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="mt-1 h-8"
                          />
                        </div>

                        <div className="rounded bg-white p-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium">
                              $
                              {(
                                selection.quantity * selection.unitCost
                              ).toFixed(2)}
                            </span>
                          </div>
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
        <div className="flex flex-shrink-0 items-center justify-between border-t bg-gray-50 p-6">
          <div className="text-sm">
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-gray-600">
                  {selectedItems.length} items selected
                </span>
                <span className="text-lg font-bold text-gray-900">
                  Total: ${totalCost.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedItems.length === 0 || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Adding...' : `Add ${selectedItems.length} Items`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
