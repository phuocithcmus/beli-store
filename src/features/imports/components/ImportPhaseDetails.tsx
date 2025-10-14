/**
 * ImportPhaseDetails Component
 * Displays detailed information about an import phase including all associated products
 */

'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Edit2,
  CheckCircle,
  Plus,
  Trash2,
  Calendar,
  Hash,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ImportPhase, Product } from '@/types';

interface ImportPhaseWithProducts extends ImportPhase {
  products?: (Product & { quantity: number; unitCost: number })[];
}

interface ImportPhaseDetailsProps {
  importPhase: ImportPhaseWithProducts;
  onBack?: () => void;
  onEditPhase?: (phase: ImportPhase) => void;
  onCompletePhase?: (phaseId: string) => void;
  onAddProducts?: (phase: ImportPhase) => void;
  onEditProduct?: (productId: string) => void;
  onRemoveProduct?: (phaseId: string, productId: string) => void;
}

export function ImportPhaseDetails({
  importPhase,
  onBack,
  onEditPhase,
  onCompletePhase,
  onAddProducts,
  onEditProduct,
  onRemoveProduct,
}: ImportPhaseDetailsProps) {
  const [showProductDetails, setShowProductDetails] = useState<
    Record<string, boolean>
  >({});

  const handleCompleteClick = () => {
    if (importPhase.totalItems === 0) {
      alert(
        'Cannot complete import phase with no products. Please add products first.'
      );
      return;
    }

    if (
      confirm(
        `Are you sure you want to complete import phase "${importPhase.code}"? This action cannot be undone.`
      )
    ) {
      onCompletePhase?.(importPhase.id);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    const product = importPhase.products?.find((p) => p.id === productId);
    if (
      product &&
      confirm(`Remove "${product.name}" from this import phase?`)
    ) {
      onRemoveProduct?.(importPhase.id, productId);
    }
  };

  const toggleProductDetails = (productId: string) => {
    setShowProductDetails((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Import Phase Details</h1>
            <p className="text-muted-foreground">
              Manage import phase and associated products
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {importPhase.status === 'active' && onAddProducts && (
            <Button onClick={() => onAddProducts(importPhase)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Products
            </Button>
          )}

          {importPhase.status === 'active' && onEditPhase && (
            <Button variant="outline" onClick={() => onEditPhase(importPhase)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Phase
            </Button>
          )}

          {importPhase.status === 'active' &&
            onCompletePhase &&
            importPhase.totalItems > 0 && (
              <Button
                variant="default"
                onClick={handleCompleteClick}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Phase
              </Button>
            )}
        </div>
      </div>

      {/* Phase Information */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phase Code</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold">
              {importPhase.code}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {importPhase.date.toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Badge
              variant={
                importPhase.status === 'active' ? 'default' : 'secondary'
              }
              className="ml-auto"
            >
              {importPhase.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {importPhase.status === 'active' ? 'In progress' : 'Finalized'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold">
              ${importPhase.totalCost.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              {importPhase.totalItems} items
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {importPhase.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{importPhase.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Products ({importPhase.products?.length || 0})
            </CardTitle>
            {importPhase.status === 'active' && onAddProducts && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddProducts(importPhase)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Products
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!importPhase.products || importPhase.products.length === 0 ? (
            <div className="py-8 text-center">
              <Plus className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-1 text-lg font-semibold">No products added</h3>
              <p className="mb-4 text-muted-foreground">
                Add products to this import phase to get started
              </p>
              {importPhase.status === 'active' && onAddProducts && (
                <Button onClick={() => onAddProducts(importPhase)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Products
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {importPhase.products.map((product) => (
                <div key={product.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Code: {product.code}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            Qty: {product.quantity} × $
                            {product.unitCost.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total: $
                            {(product.quantity * product.unitCost).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {showProductDetails[product.id] && (
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                          <div>
                            <span className="font-medium">Category:</span>
                            <div className="text-muted-foreground">
                              {product.category}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Stock:</span>
                            <div className="text-muted-foreground">
                              {product.remainingQuantity}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Price:</span>
                            <div className="text-muted-foreground">
                              ${product.sellingPrice.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Added:</span>
                            <div className="text-muted-foreground">
                              {product.createdAt.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleProductDetails(product.id)}
                      >
                        {showProductDetails[product.id] ? 'Hide' : 'Show'}{' '}
                        Details
                      </Button>

                      {onEditProduct && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditProduct(product.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}

                      {importPhase.status === 'active' && onRemoveProduct && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProduct(product.id)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
