/**
 * Revenue Entry Storage Service
 * Handles storage operations for revenue entries across sales channels
 */

import type {
  RevenueEntry,
  RevenueEntryFormData,
  StorageSchema,
  PaginatedResponse,
  ApiResponse,
  Transaction,
} from '@/types';

export class RevenueService {
  private storageKey = 'clothing-store-data';

  private getData(): StorageSchema {
    if (typeof window === 'undefined') {
      // Default data for SSR
      return {
        products: [],
        importPhases: [],
        importPhaseProducts: [],
        transactions: [],
        revenueRecords: [],
        productVariants: [],
        revenueEntries: [],
        salesChannels: [],
        metadata: {
          version: '1.0.0',
          lastBackup: new Date(),
          recordCounts: {
            products: 0,
            revenueEntries: 0,
            salesChannels: 0,
          },
          schemaVersion: 2,
          variantSystemEnabled: true,
        },
      };
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return this.initializeDefaultData();
      }
      return JSON.parse(stored, (key, value) => {
        if (key.includes('Date') || key.includes('At')) {
          return new Date(value);
        }
        return value;
      });
    } catch (error) {
      console.error('Error loading data:', error);
      return this.initializeDefaultData();
    }
  }

  private saveData(data: StorageSchema): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
      throw new Error('Failed to save revenue data');
    }
  }

  private initializeDefaultData(): StorageSchema {
    return {
      products: [],
      importPhases: [],
      importPhaseProducts: [],
      transactions: [],
      revenueRecords: [],
      productVariants: [],
      revenueEntries: [],
      salesChannels: [
        {
          id: 'shopee-001',
          name: 'Shopee',
          type: 'online',
          isActive: true,
          metadata: { platform: 'shopee', commission: 0.025 },
        },
        {
          id: 'tiktok-001',
          name: 'TikTok Shop',
          type: 'online',
          isActive: true,
          metadata: { platform: 'tiktok', commission: 0.03 },
        },
        {
          id: 'manual-001',
          name: 'Direct Sales',
          type: 'manual',
          isActive: true,
          metadata: { platform: 'direct', commission: 0 },
        },
      ],
      metadata: {
        version: '1.0.0',
        lastBackup: new Date(),
        recordCounts: {
          products: 0,
          revenueEntries: 0,
          salesChannels: 3,
        },
        schemaVersion: 2,
        variantSystemEnabled: true,
      },
    };
  }

  private generateId(): string {
    return `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create revenue entry
  createRevenueEntry(
    entryData: RevenueEntryFormData
  ): ApiResponse<RevenueEntry> {
    try {
      const data = this.getData();

      // Validate product exists
      const product = data.products.find((p) => p.id === entryData.productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Validate sales channel exists
      const salesChannel = data.salesChannels.find(
        (sc) => sc.id === entryData.salesChannel
      );
      if (!salesChannel) {
        throw new Error('Sales channel not found');
      }

      // Validate variant if specified
      if (entryData.productVariantId) {
        const variant = data.productVariants.find(
          (v) => v.id === entryData.productVariantId
        );
        if (!variant || variant.productId !== entryData.productId) {
          throw new Error(
            'Product variant not found or does not belong to the specified product'
          );
        }
      }

      const now = new Date();
      const newEntry: RevenueEntry = {
        id: this.generateId(),
        productId: entryData.productId,
        productVariantId: entryData.productVariantId,
        productName: product.name,
        variantDetails: entryData.productVariantId
          ? this.getVariantDisplayName(data, entryData.productVariantId)
          : undefined,
        amount: parseFloat(entryData.amount),
        quantity: parseInt(entryData.quantity),
        unitPrice: parseFloat(entryData.amount) / parseInt(entryData.quantity),
        salesChannel: entryData.salesChannel,
        salesChannelName: salesChannel.name,
        saleDate: new Date(entryData.saleDate),
        notes: entryData.notes,
        createdAt: now,
        updatedAt: now,
      };

      data.revenueEntries.push(newEntry);
      data.metadata.recordCounts.revenueEntries = data.revenueEntries.length;
      data.metadata.lastBackup = now;

      // Update inventory - decrease stock for sold items
      this.updateInventoryForSale(data, newEntry);

      this.saveData(data);

      return {
        data: newEntry,
        message: 'Revenue entry created successfully',
      };
    } catch (error) {
      console.error('Error creating revenue entry:', error);
      return {
        data: {} as RevenueEntry,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create revenue entry',
      };
    }
  }

  // Get all revenue entries with optional filtering
  getRevenueEntries(filters?: {
    productId?: string;
    salesChannel?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): PaginatedResponse<RevenueEntry> {
    try {
      const data = this.getData();
      let entries = [...data.revenueEntries];

      // Apply filters
      if (filters?.productId) {
        entries = entries.filter(
          (entry) => entry.productId === filters.productId
        );
      }

      if (filters?.salesChannel) {
        entries = entries.filter(
          (entry) => entry.salesChannel === filters.salesChannel
        );
      }

      if (filters?.dateFrom) {
        entries = entries.filter(
          (entry) => entry.saleDate >= filters.dateFrom!
        );
      }

      if (filters?.dateTo) {
        entries = entries.filter((entry) => entry.saleDate <= filters.dateTo!);
      }

      // Sort by sale date (newest first)
      entries.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());

      // Apply pagination
      const total = entries.length;
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;
      const paginatedEntries = entries.slice(offset, offset + limit);

      return {
        data: paginatedEntries,
        total,
        hasMore: offset + limit < total,
        page: Math.floor(offset / limit) + 1,
        limit,
      };
    } catch (error) {
      console.error('Error getting revenue entries:', error);
      return {
        data: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  // Get revenue entry by ID
  getRevenueEntry(id: string): RevenueEntry | null {
    try {
      const data = this.getData();
      return data.revenueEntries.find((entry) => entry.id === id) || null;
    } catch (error) {
      console.error('Error getting revenue entry:', error);
      return null;
    }
  }

  // Update revenue entry
  updateRevenueEntry(
    id: string,
    updates: Partial<RevenueEntryFormData>
  ): ApiResponse<RevenueEntry> {
    try {
      const data = this.getData();
      const entryIndex = data.revenueEntries.findIndex(
        (entry) => entry.id === id
      );

      if (entryIndex === -1) {
        return {
          data: {} as RevenueEntry,
          error: 'Revenue entry not found',
        };
      }

      const currentEntry = data.revenueEntries[entryIndex];

      // Update product if changed
      if (updates.productId && updates.productId !== currentEntry.productId) {
        const product = data.products.find((p) => p.id === updates.productId);
        if (!product) {
          throw new Error('Product not found');
        }
        currentEntry.productId = updates.productId;
        currentEntry.productName = product.name;
        // Reset variant if product changed
        currentEntry.productVariantId = undefined;
        currentEntry.variantDetails = undefined;
      }

      // Update variant if changed
      if (updates.productVariantId !== undefined) {
        if (updates.productVariantId) {
          const variant = data.productVariants.find(
            (v) => v.id === updates.productVariantId
          );
          if (!variant || variant.productId !== currentEntry.productId) {
            throw new Error(
              'Product variant not found or does not belong to the specified product'
            );
          }
          currentEntry.productVariantId = updates.productVariantId;
          currentEntry.variantDetails = this.getVariantDisplayName(
            data,
            updates.productVariantId
          );
        } else {
          currentEntry.productVariantId = undefined;
          currentEntry.variantDetails = undefined;
        }
      }

      // Update sales channel if changed
      if (
        updates.salesChannel &&
        updates.salesChannel !== currentEntry.salesChannel
      ) {
        const salesChannel = data.salesChannels.find(
          (sc) => sc.id === updates.salesChannel
        );
        if (!salesChannel) {
          throw new Error('Sales channel not found');
        }
        currentEntry.salesChannel = updates.salesChannel;
        currentEntry.salesChannelName = salesChannel.name;
      }

      // Update fields
      if (updates.amount) {
        currentEntry.amount = parseFloat(updates.amount);
        currentEntry.unitPrice = currentEntry.amount / currentEntry.quantity;
      }

      if (updates.quantity) {
        currentEntry.quantity = parseInt(updates.quantity);
        currentEntry.unitPrice = currentEntry.amount / currentEntry.quantity;
      }

      if (updates.saleDate) {
        currentEntry.saleDate = new Date(updates.saleDate);
      }

      if (updates.notes !== undefined) {
        currentEntry.notes = updates.notes;
      }

      currentEntry.updatedAt = new Date();

      this.saveData(data);

      return {
        data: currentEntry,
        message: 'Revenue entry updated successfully',
      };
    } catch (error) {
      console.error('Error updating revenue entry:', error);
      return {
        data: {} as RevenueEntry,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update revenue entry',
      };
    }
  }

  // Delete revenue entry
  deleteRevenueEntry(id: string): ApiResponse<boolean> {
    try {
      const data = this.getData();
      const entryIndex = data.revenueEntries.findIndex(
        (entry) => entry.id === id
      );

      if (entryIndex === -1) {
        return {
          data: false,
          error: 'Revenue entry not found',
        };
      }

      data.revenueEntries.splice(entryIndex, 1);
      data.metadata.recordCounts.revenueEntries = data.revenueEntries.length;
      data.metadata.lastBackup = new Date();

      this.saveData(data);

      return {
        data: true,
        message: 'Revenue entry deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting revenue entry:', error);
      return {
        data: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete revenue entry',
      };
    }
  }

  // Helper method to get variant display name
  private getVariantDisplayName(
    data: StorageSchema,
    variantId: string
  ): string {
    const variant = data.productVariants.find((v) => v.id === variantId);
    if (!variant) {
      return 'Unknown Variant';
    }

    return `${variant.color} / ${variant.size} / ${variant.form} (${variant.sku})`;
  }

  // Get revenue summary by sales channel
  getRevenueBySalesChannel(
    dateFrom?: Date,
    dateTo?: Date
  ): Record<
    string,
    {
      totalRevenue: number;
      totalTransactions: number;
      averageOrderValue: number;
      channelName: string;
    }
  > {
    try {
      const data = this.getData();
      let entries = [...data.revenueEntries];

      // Apply date filters
      if (dateFrom) {
        entries = entries.filter((entry) => entry.saleDate >= dateFrom);
      }

      if (dateTo) {
        entries = entries.filter((entry) => entry.saleDate <= dateTo);
      }

      const summary: Record<
        string,
        {
          totalRevenue: number;
          totalTransactions: number;
          averageOrderValue: number;
          channelName: string;
        }
      > = {};

      entries.forEach((entry) => {
        if (!summary[entry.salesChannel]) {
          summary[entry.salesChannel] = {
            totalRevenue: 0,
            totalTransactions: 0,
            averageOrderValue: 0,
            channelName: entry.salesChannelName,
          };
        }

        summary[entry.salesChannel].totalRevenue += entry.amount;
        summary[entry.salesChannel].totalTransactions += 1;
      });

      // Calculate average order values
      Object.keys(summary).forEach((channelId) => {
        const channel = summary[channelId];
        channel.averageOrderValue =
          channel.totalTransactions > 0
            ? channel.totalRevenue / channel.totalTransactions
            : 0;
      });

      return summary;
    } catch (error) {
      console.error('Error getting revenue by sales channel:', error);
      return {};
    }
  }

  // Get revenue summary by product
  getRevenueByProduct(
    dateFrom?: Date,
    dateTo?: Date
  ): Record<
    string,
    {
      totalRevenue: number;
      totalQuantity: number;
      totalTransactions: number;
      productName: string;
    }
  > {
    try {
      const data = this.getData();
      let entries = [...data.revenueEntries];

      // Apply date filters
      if (dateFrom) {
        entries = entries.filter((entry) => entry.saleDate >= dateFrom);
      }

      if (dateTo) {
        entries = entries.filter((entry) => entry.saleDate <= dateTo);
      }

      const summary: Record<
        string,
        {
          totalRevenue: number;
          totalQuantity: number;
          totalTransactions: number;
          productName: string;
        }
      > = {};

      entries.forEach((entry) => {
        if (!summary[entry.productId]) {
          summary[entry.productId] = {
            totalRevenue: 0,
            totalQuantity: 0,
            totalTransactions: 0,
            productName: entry.productName,
          };
        }

        summary[entry.productId].totalRevenue += entry.amount;
        summary[entry.productId].totalQuantity += entry.quantity;
        summary[entry.productId].totalTransactions += 1;
      });

      return summary;
    } catch (error) {
      console.error('Error getting revenue by product:', error);
      return {};
    }
  }

  // Update inventory when a sale is made
  private updateInventoryForSale(
    data: StorageSchema,
    revenueEntry: RevenueEntry
  ): void {
    const quantity = revenueEntry.quantity;

    // Update product inventory (decrease sold quantity, increase sold count)
    const productIndex = data.products.findIndex(
      (p) => p.id === revenueEntry.productId
    );
    if (productIndex !== -1) {
      data.products[productIndex].remainingQuantity = Math.max(
        0,
        data.products[productIndex].remainingQuantity - quantity
      );
      data.products[productIndex].soldQuantity += quantity;
      data.products[productIndex].updatedAt = new Date();
    }

    // Update variant inventory if variant is specified
    if (revenueEntry.productVariantId) {
      const variantIndex = data.productVariants.findIndex(
        (v) => v.id === revenueEntry.productVariantId
      );
      if (variantIndex !== -1) {
        const variant = data.productVariants[variantIndex];
        // Decrease inventory count
        variant.inventoryCount = Math.max(0, variant.inventoryCount - quantity);
        // Increase sold count
        variant.soldCount += quantity;
        variant.updatedAt = new Date();
      }
    }

    // Create a sale transaction for tracking
    const transaction: Transaction = {
      id: this.generateId(),
      type: 'sale',
      productId: revenueEntry.productId,
      productVariantId: revenueEntry.productVariantId,
      quantity,
      unitPrice: revenueEntry.unitPrice,
      totalAmount: revenueEntry.amount,
      date: revenueEntry.saleDate,
      notes: `Sale via ${revenueEntry.salesChannelName}${revenueEntry.notes ? ` - ${revenueEntry.notes}` : ''}`,
      createdAt: new Date(),
    };

    data.transactions.push(transaction);
  }
}

export const revenueService = new RevenueService();
