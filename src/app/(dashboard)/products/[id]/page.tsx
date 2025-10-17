/**
 * Product Detail Page
 * Shows detailed product information and manages its variants
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { storageService } from '@/lib/storage';
import { ProductVariantManager } from '@/features/productVariants/components/ProductVariantManager';
import VariantTable from '@/features/products/components/VariantTable';
import { SalesDialog } from '@/features/products/components/SalesDialog';
import { VariantAnalytics } from '@/features/products/components/VariantAnalytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Package,
  DollarSign,
  Boxes,
  TrendingUp,
  BarChart,
} from 'lucide-react';
import type { Product, ProductVariant } from '@/types';

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSalesDialog, setShowSalesDialog] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [activeTab, setActiveTab] = useState('variants');

  const loadProductData = useCallback(async () => {
    try {
      setLoading(true);
      const productData = storageService.getProduct(params.id);
      const variantData = storageService.getProductVariantsByProduct(params.id);

      setProduct(productData || null);
      setVariants(variantData);
    } catch (error) {
      console.error('Error loading product data:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadProductData();
  }, [loadProductData]);

  const handleVariantsChange = (updatedVariants: ProductVariant[]) => {
    setVariants(updatedVariants);
  };

  const handleRecordSale = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setShowSalesDialog(true);
  };

  const handleSaleRecorded = () => {
    setShowSalesDialog(false);
    setSelectedVariant(null);
    // Refresh data to show updated sales
    loadProductData();
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Product Not Found</h2>
            <p className="text-muted-foreground">
              The product you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalVariantInventory = variants.reduce(
    (sum, variant) => sum + variant.inventoryCount,
    0
  );

  const totalVariantSold = variants.reduce(
    (sum, variant) => sum + variant.soldCount,
    0
  );

  const availableVariantStock = variants.reduce(
    (sum, variant) =>
      sum +
      (variant.inventoryCount - variant.reservedCount - variant.soldCount),
    0
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {product.name}
            </h1>
            <p className="text-muted-foreground">
              Product Code: {product.code} • Category: {product.category}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit Product
        </Button>
      </div>

      {/* Product Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Product Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Purchase Price
                  </p>
                  <p className="text-lg font-semibold">
                    ${product.purchasePrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Selling Price
                  </p>
                  {product.sellingPrice ? (
                    <p className="text-lg font-semibold">
                      ${product.sellingPrice.toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-lg font-semibold italic text-muted-foreground">
                      Not set
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Sold Quantity
                  </p>
                  <p className="text-lg font-semibold">
                    {product.soldQuantity} units
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Remaining Quantity
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">
                      {product.remainingQuantity} units
                    </p>
                    {product.remainingQuantity <= 10 && (
                      <Badge variant="destructive">Low Stock</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Description
                </p>
                <p className="mt-1 text-sm">
                  No description available for this product
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Boxes className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Total Variants</p>
                  <p className="text-2xl font-bold">{variants.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Variant Inventory</p>
                  <p className="text-2xl font-bold">{totalVariantInventory}</p>
                  <p className="text-xs text-muted-foreground">
                    {availableVariantStock} available
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Variants Sold</p>
                  <p className="text-2xl font-bold">{totalVariantSold}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.sellingPrice
                      ? `$${(totalVariantSold * product.sellingPrice).toFixed(2)} revenue`
                      : `$${(totalVariantSold * product.purchasePrice).toFixed(2)} cost basis`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  {product.sellingPrice ? (
                    <>
                      <p className="text-sm font-medium">Profit Margin</p>
                      <p className="text-2xl font-bold">
                        {(
                          ((product.sellingPrice - product.purchasePrice) /
                            product.sellingPrice) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                      <p className="text-xs text-muted-foreground">
                        $
                        {(product.sellingPrice - product.purchasePrice).toFixed(
                          2
                        )}{' '}
                        per unit
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium">Cost Tracking</p>
                      <p className="text-2xl font-bold text-muted-foreground">
                        Cost Only
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${product.purchasePrice.toFixed(2)} per unit cost
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Variants Management with Sales Tracking */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="variants">Variant Management</TabsTrigger>
          <TabsTrigger value="sales">Sales Tracking</TabsTrigger>
          <TabsTrigger value="analytics">Sales Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="variants" className="mt-6">
          <ProductVariantManager
            productId={params.id}
            onVariantsChange={handleVariantsChange}
            defaultView="list"
          />
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sales Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VariantTable
                variants={variants}
                onRecordSale={handleRecordSale}
                showSalesData={true}
                showActions={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Sales Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VariantAnalytics showDashboard={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Performance Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VariantAnalytics showDashboard={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sales Dialog */}
      {showSalesDialog && selectedVariant && (
        <SalesDialog
          variants={[selectedVariant]}
          selectedVariantId={selectedVariant.id}
          isOpen={showSalesDialog}
          onClose={() => setShowSalesDialog(false)}
          onSaleRecorded={handleSaleRecorded}
        />
      )}
    </div>
  );
}
