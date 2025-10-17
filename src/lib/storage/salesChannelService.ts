/**
 * Sales Channel Storage Service
 * Handles storage operations for sales channels (Shopee, TikTok, manual, etc.)
 */

import type { SalesChannel, StorageSchema, ApiResponse } from '@/types';

export class SalesChannelService {
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
        importFees: [],
        channelFeeStructures: [],
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
          feeSystemEnabled: true,
          channelFeeSystemEnabled: true,
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
      throw new Error('Failed to save sales channel data');
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
      importFees: [],
      channelFeeStructures: [],
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
        feeSystemEnabled: true,
        channelFeeSystemEnabled: true,
      },
    };
  }

  private generateId(): string {
    return `sc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get all sales channels
  getSalesChannels(): SalesChannel[] {
    try {
      const data = this.getData();
      return data.salesChannels;
    } catch (error) {
      console.error('Error getting sales channels:', error);
      return [];
    }
  }

  // Get active sales channels only
  getActiveSalesChannels(): SalesChannel[] {
    try {
      const data = this.getData();
      return data.salesChannels.filter((channel) => channel.isActive);
    } catch (error) {
      console.error('Error getting active sales channels:', error);
      return [];
    }
  }

  // Get sales channel by ID
  getSalesChannel(id: string): SalesChannel | null {
    try {
      const data = this.getData();
      return data.salesChannels.find((channel) => channel.id === id) || null;
    } catch (error) {
      console.error('Error getting sales channel:', error);
      return null;
    }
  }

  // Create new sales channel
  createSalesChannel(channelData: {
    name: string;
    type: 'online' | 'manual' | 'partner';
    metadata?: Record<string, unknown>;
  }): ApiResponse<SalesChannel> {
    try {
      const data = this.getData();

      // Check if channel name already exists
      const existingChannel = data.salesChannels.find(
        (channel) =>
          channel.name.toLowerCase() === channelData.name.toLowerCase()
      );

      if (existingChannel) {
        return {
          data: {} as SalesChannel,
          error: 'Sales channel with this name already exists',
        };
      }

      const newChannel: SalesChannel = {
        id: this.generateId(),
        name: channelData.name,
        type: channelData.type,
        isActive: true,
        metadata: channelData.metadata || {},
      };

      data.salesChannels.push(newChannel);
      data.metadata.recordCounts.salesChannels = data.salesChannels.length;
      data.metadata.lastBackup = new Date();

      this.saveData(data);

      return {
        data: newChannel,
        message: 'Sales channel created successfully',
      };
    } catch (error) {
      console.error('Error creating sales channel:', error);
      return {
        data: {} as SalesChannel,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create sales channel',
      };
    }
  }

  // Update sales channel
  updateSalesChannel(
    id: string,
    updates: {
      name?: string;
      type?: 'online' | 'manual' | 'partner';
      isActive?: boolean;
      metadata?: Record<string, unknown>;
    }
  ): ApiResponse<SalesChannel> {
    try {
      const data = this.getData();
      const channelIndex = data.salesChannels.findIndex(
        (channel) => channel.id === id
      );

      if (channelIndex === -1) {
        return {
          data: {} as SalesChannel,
          error: 'Sales channel not found',
        };
      }

      const currentChannel = data.salesChannels[channelIndex];

      // Check for name conflicts if name is being updated
      if (updates.name && updates.name !== currentChannel.name) {
        const existingChannel = data.salesChannels.find(
          (channel) =>
            channel.name.toLowerCase() === updates.name?.toLowerCase() &&
            channel.id !== id
        );

        if (existingChannel) {
          return {
            data: {} as SalesChannel,
            error: 'Sales channel with this name already exists',
          };
        }
      }

      // Update fields
      if (updates.name) {
        currentChannel.name = updates.name;
      }

      if (updates.type) {
        currentChannel.type = updates.type;
      }

      if (updates.isActive !== undefined) {
        currentChannel.isActive = updates.isActive;
      }

      if (updates.metadata) {
        currentChannel.metadata = {
          ...currentChannel.metadata,
          ...updates.metadata,
        };
      }

      data.metadata.lastBackup = new Date();
      this.saveData(data);

      return {
        data: currentChannel,
        message: 'Sales channel updated successfully',
      };
    } catch (error) {
      console.error('Error updating sales channel:', error);
      return {
        data: {} as SalesChannel,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update sales channel',
      };
    }
  }

  // Delete sales channel (only if no revenue entries exist)
  deleteSalesChannel(id: string): ApiResponse<boolean> {
    try {
      const data = this.getData();
      const channelIndex = data.salesChannels.findIndex(
        (channel) => channel.id === id
      );

      if (channelIndex === -1) {
        return {
          data: false,
          error: 'Sales channel not found',
        };
      }

      // Check if there are any revenue entries using this channel
      const revenueEntriesUsingChannel = data.revenueEntries.filter(
        (entry) => entry.salesChannel === id
      );

      if (revenueEntriesUsingChannel.length > 0) {
        return {
          data: false,
          error: `Cannot delete sales channel. It has ${revenueEntriesUsingChannel.length} revenue entries. Deactivate instead.`,
        };
      }

      data.salesChannels.splice(channelIndex, 1);
      data.metadata.recordCounts.salesChannels = data.salesChannels.length;
      data.metadata.lastBackup = new Date();

      this.saveData(data);

      return {
        data: true,
        message: 'Sales channel deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting sales channel:', error);
      return {
        data: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete sales channel',
      };
    }
  }

  // Get sales channel performance metrics
  getChannelPerformance(
    channelId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): {
    totalRevenue: number;
    totalTransactions: number;
    averageOrderValue: number;
    totalQuantity: number;
  } {
    try {
      const data = this.getData();
      let entries = data.revenueEntries.filter(
        (entry) => entry.salesChannel === channelId
      );

      // Apply date filters
      if (dateFrom) {
        entries = entries.filter((entry) => entry.saleDate >= dateFrom);
      }

      if (dateTo) {
        entries = entries.filter((entry) => entry.saleDate <= dateTo);
      }

      const totalRevenue = entries.reduce(
        (sum, entry) => sum + entry.amount,
        0
      );
      const totalTransactions = entries.length;
      const totalQuantity = entries.reduce(
        (sum, entry) => sum + entry.quantity,
        0
      );
      const averageOrderValue =
        totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      return {
        totalRevenue,
        totalTransactions,
        averageOrderValue,
        totalQuantity,
      };
    } catch (error) {
      console.error('Error getting channel performance:', error);
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        averageOrderValue: 0,
        totalQuantity: 0,
      };
    }
  }

  // Get all channels performance comparison
  getAllChannelsPerformance(
    dateFrom?: Date,
    dateTo?: Date
  ): Record<
    string,
    {
      channelName: string;
      totalRevenue: number;
      totalTransactions: number;
      averageOrderValue: number;
      totalQuantity: number;
      marketShare: number;
    }
  > {
    try {
      const data = this.getData();
      const result: Record<
        string,
        {
          channelName: string;
          totalRevenue: number;
          totalTransactions: number;
          averageOrderValue: number;
          totalQuantity: number;
          marketShare: number;
        }
      > = {};

      let totalOverallRevenue = 0;

      // First pass: calculate metrics for each channel
      data.salesChannels.forEach((channel) => {
        const performance = this.getChannelPerformance(
          channel.id,
          dateFrom,
          dateTo
        );
        totalOverallRevenue += performance.totalRevenue;

        result[channel.id] = {
          channelName: channel.name,
          ...performance,
          marketShare: 0, // Will be calculated in second pass
        };
      });

      // Second pass: calculate market share
      Object.keys(result).forEach((channelId) => {
        result[channelId].marketShare =
          totalOverallRevenue > 0
            ? (result[channelId].totalRevenue / totalOverallRevenue) * 100
            : 0;
      });

      return result;
    } catch (error) {
      console.error('Error getting all channels performance:', error);
      return {};
    }
  }
}

export const salesChannelService = new SalesChannelService();
