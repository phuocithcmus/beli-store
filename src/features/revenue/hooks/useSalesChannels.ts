import { useState, useEffect, useCallback } from 'react';
import { salesChannelService } from '@/lib/storage/salesChannelService';
import type { SalesChannel } from '@/types';
import type { UseSalesChannelsReturn } from '@/features/revenue/types/revenue';

/**
 * Custom hook for sales channel management operations
 * Provides CRUD operations and state management for sales channels
 */
export function useSalesChannels(): UseSalesChannelsReturn {
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all sales channels
  const loadChannels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const channelsData = salesChannelService.getSalesChannels();
      setChannels(channelsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load sales channels'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new sales channel
  const createChannel = useCallback(
    async (data: {
      name: string;
      type: 'online' | 'manual' | 'partner';
      metadata?: Record<string, unknown>;
    }): Promise<boolean> => {
      try {
        setError(null);

        const response = salesChannelService.createSalesChannel({
          name: data.name,
          type: data.type,
          metadata: data.metadata || {},
        });

        if (!response.error) {
          // Refresh the channels list
          await loadChannels();
          return true;
        } else {
          setError(response.error);
          return false;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create sales channel'
        );
        return false;
      }
    },
    [loadChannels]
  );

  // Update existing sales channel
  const updateChannel = useCallback(
    async (
      id: string,
      data: {
        name?: string;
        type?: 'online' | 'manual' | 'partner';
        isActive?: boolean;
        metadata?: Record<string, unknown>;
      }
    ): Promise<boolean> => {
      try {
        setError(null);

        const response = salesChannelService.updateSalesChannel(id, {
          name: data.name,
          type: data.type,
          isActive: data.isActive,
          metadata: data.metadata,
        });

        if (!response.error) {
          // Refresh the channels list
          await loadChannels();
          return true;
        } else {
          setError(response.error);
          return false;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update sales channel'
        );
        return false;
      }
    },
    [loadChannels]
  );

  // Delete sales channel
  const deleteChannel = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);

        const response = salesChannelService.deleteSalesChannel(id);

        if (!response.error) {
          // Refresh the channels list
          await loadChannels();
          return true;
        } else {
          setError(response.error);
          return false;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to delete sales channel'
        );
        return false;
      }
    },
    [loadChannels]
  );

  // Refresh channels data
  const refreshChannels = useCallback(async () => {
    await loadChannels();
  }, [loadChannels]);

  // Get only active channels
  const activeChannels = channels.filter((channel) => channel.isActive);

  // Load channels on mount
  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  return {
    channels,
    activeChannels,
    loading,
    error,
    createChannel,
    updateChannel,
    deleteChannel,
    refreshChannels,
  };
}
