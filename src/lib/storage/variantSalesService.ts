/**
 * Variant Sales Service
 * Handles sales tracking for product variants including inventory updates
 */

import type {
  ProductVariant,
  SaleTransaction,
  VariantSaleRecord,
  VariantSalesSummary,
} from '@/types';
import { storageService } from './index';

export class VariantSalesService {
  private static instance: VariantSalesService;

  static getInstance(): VariantSalesService {
    if (!VariantSalesService.instance) {
      VariantSalesService.instance = new VariantSalesService();
    }
    return VariantSalesService.instance;
  }

  /**
   * Record a sale for a specific variant
   */
  recordSale(transaction: SaleTransaction): VariantSaleRecord {
    // Validate transaction
    this.validateSaleTransaction(transaction);

    // Get current variant to check inventory
    const variant = storageService.getProductVariant(transaction.variantId);
    if (!variant) {
      throw new Error(`Variant ${transaction.variantId} not found`);
    }

    // Validate inventory availability
    if (variant.inventoryCount < transaction.quantity) {
      throw new Error(
        `Insufficient inventory: attempting to sell ${transaction.quantity} but only ${variant.inventoryCount} available`
      );
    }

    // Create sale record
    const saleRecord: VariantSaleRecord = {
      id: transaction.id || this.generateSaleId(),
      variantId: transaction.variantId,
      productId: variant.productId,
      quantity: transaction.quantity,
      unitPrice: transaction.unitPrice,
      totalAmount: transaction.totalAmount,
      saleDate: transaction.saleDate,
      customerId: transaction.customerId,
      notes: transaction.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check for duplicate sale records
    const existingSale = this.getSaleRecord(saleRecord.id);
    if (existingSale) {
      throw new Error('Sale record already exists');
    }

    // Save sale record and update inventory atomically
    try {
      this.saveSaleRecord(saleRecord);
      this.updateVariantInventory(transaction.variantId, transaction.quantity);

      return saleRecord;
    } catch (error) {
      // Rollback on error
      this.deleteSaleRecord(saleRecord.id);
      throw error;
    }
  }

  /**
   * Get all sales for a specific variant
   */
  getSalesForVariant(variantId: string): VariantSaleRecord[] {
    const allSales = this.getAllSales();
    return allSales
      .filter((sale) => sale.variantId === variantId)
      .sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());
  }

  /**
   * Get all sales for all variants of a product
   */
  getSalesForProduct(productId: string): VariantSaleRecord[] {
    const allSales = this.getAllSales();
    return allSales
      .filter((sale) => sale.productId === productId)
      .sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());
  }

  /**
   * Update variant inventory after sale
   */
  updateVariantInventory(variantId: string, soldQuantity: number): void {
    if (soldQuantity === 0) {
      return; // No inventory change needed
    }

    const variant = storageService.getProductVariant(variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    if (variant.inventoryCount < soldQuantity) {
      throw new Error('Insufficient inventory');
    }

    const updatedVariant: ProductVariant = {
      ...variant,
      inventoryCount: variant.inventoryCount - soldQuantity,
      soldCount: variant.soldCount + soldQuantity,
      updatedAt: new Date(),
    };

    storageService.updateProductVariant(variantId, {
      inventoryCount: updatedVariant.inventoryCount,
      soldCount: updatedVariant.soldCount,
    });
  }

  /**
   * Get sales summary for a variant
   */
  getSalesSummaryForVariant(variantId: string): VariantSalesSummary {
    const sales = this.getSalesForVariant(variantId);

    if (sales.length === 0) {
      return {
        totalSold: 0,
        totalRevenue: 0,
        averagePrice: 0,
        lastSaleDate: undefined,
      };
    }

    const totalSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalSales = sales.length;
    const averagePrice = totalRevenue / totalSales;
    const lastSaleDate = sales[0]?.saleDate; // Already sorted desc

    return {
      totalSold,
      totalRevenue,
      averagePrice,
      lastSaleDate,
    };
  }

  /**
   * Reverse a sale (for returns/corrections)
   */
  reverseSale(
    saleId: string,
    reason?: string
  ): {
    reversedSale: VariantSaleRecord;
    updatedVariant: ProductVariant;
  } {
    const sale = this.getSaleRecord(saleId);
    if (!sale) {
      throw new Error('Sale record not found');
    }

    // Check if already reversed
    if (sale.notes?.includes('REVERSED')) {
      throw new Error('Sale has already been reversed');
    }

    // Update sale record to mark as reversed
    const reversedSale: VariantSaleRecord = {
      ...sale,
      notes:
        `${sale.notes || ''} REVERSED: ${reason || 'No reason provided'}`.trim(),
      updatedAt: new Date(),
    };

    // Restore inventory
    const variant = storageService.getProductVariant(sale.variantId);
    if (!variant) {
      throw new Error(`Variant ${sale.variantId} not found`);
    }

    const updatedVariant: ProductVariant = {
      ...variant,
      inventoryCount: variant.inventoryCount + sale.quantity,
      soldCount: Math.max(0, variant.soldCount - sale.quantity),
      updatedAt: new Date(),
    };

    // Save both updates
    this.saveSaleRecord(reversedSale);
    storageService.updateProductVariant(sale.variantId, {
      inventoryCount: updatedVariant.inventoryCount,
      soldCount: updatedVariant.soldCount,
    });

    return {
      reversedSale,
      updatedVariant,
    };
  }

  /**
   * Bulk record sales with error handling
   */
  bulkRecordSales(transactions: SaleTransaction[]): {
    successful: {
      saleRecord: VariantSaleRecord;
      updatedVariant: ProductVariant;
    }[];
    failed: { transaction: SaleTransaction; error: string }[];
  } {
    const successful: {
      saleRecord: VariantSaleRecord;
      updatedVariant: ProductVariant;
    }[] = [];
    const failed: { transaction: SaleTransaction; error: string }[] = [];

    for (const transaction of transactions) {
      try {
        const saleRecord = this.recordSale(transaction);
        const updatedVariant = storageService.getProductVariant(
          transaction.variantId
        );

        if (updatedVariant) {
          successful.push({ saleRecord, updatedVariant });
        } else {
          failed.push({
            transaction,
            error: 'Failed to retrieve updated variant',
          });
        }
      } catch (error) {
        failed.push({
          transaction,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Get all sales across all variants
   */
  getAllVariantSales(): VariantSaleRecord[] {
    return this.getAllSales();
  }

  // Private helper methods

  private validateSaleTransaction(transaction: SaleTransaction): void {
    if (!transaction.variantId) {
      throw new Error('Variant ID is required');
    }

    if (transaction.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (transaction.unitPrice <= 0) {
      throw new Error('Unit price must be greater than 0');
    }

    if (
      transaction.totalAmount !==
      transaction.quantity * transaction.unitPrice
    ) {
      throw new Error('Total amount must equal quantity × unit price');
    }
  }

  private generateSaleId(): string {
    return `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAllSales(): VariantSaleRecord[] {
    // For now, we'll use a simplified approach
    // In a real implementation, this would be stored in localStorage or a database
    const key = 'variant-sales-records';
    const stored = localStorage.getItem(key);
    if (!stored) {
      return [];
    }

    try {
      const parsed = JSON.parse(stored);
      return parsed.map(
        (sale: {
          id: string;
          variantId: string;
          productId: string;
          quantity: number;
          unitPrice: number;
          totalAmount: number;
          saleDate: string;
          customerId?: string;
          notes?: string;
          createdAt: string;
          updatedAt: string;
        }) => ({
          ...sale,
          saleDate: new Date(sale.saleDate),
          createdAt: new Date(sale.createdAt),
          updatedAt: new Date(sale.updatedAt),
        })
      );
    } catch {
      return [];
    }
  }

  private saveSaleRecord(sale: VariantSaleRecord): void {
    const allSales = this.getAllSales();
    const index = allSales.findIndex((s) => s.id === sale.id);

    if (index >= 0) {
      allSales[index] = sale;
    } else {
      allSales.push(sale);
    }

    const key = 'variant-sales-records';
    localStorage.setItem(key, JSON.stringify(allSales));
  }

  private getSaleRecord(saleId: string): VariantSaleRecord | null {
    const allSales = this.getAllSales();
    return allSales.find((sale) => sale.id === saleId) || null;
  }

  private deleteSaleRecord(saleId: string): void {
    const allSales = this.getAllSales();
    const filtered = allSales.filter((sale) => sale.id !== saleId);

    const key = 'variant-sales-records';
    localStorage.setItem(key, JSON.stringify(filtered));
  }
}

// Export singleton instance
export const variantSalesService = VariantSalesService.getInstance();
