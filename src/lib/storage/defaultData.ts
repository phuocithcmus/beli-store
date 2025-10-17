import type { SalesChannel } from '@/types';

/**
 * Default sales channels configuration
 * These are the primary sales channels used in the clothing store
 */
export const DEFAULT_SALES_CHANNELS: SalesChannel[] = [
  {
    id: 'shopee',
    name: 'Shopee',
    type: 'online',
    isActive: true,
    metadata: {
      commissionRate: 0.025, // 2.5% commission
      description: 'Major e-commerce marketplace platform',
      platform: 'marketplace',
    },
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    type: 'online',
    isActive: true,
    metadata: {
      commissionRate: 0.03, // 3.0% commission
      description: 'Social commerce platform integrated with TikTok',
      platform: 'social',
    },
  },
  {
    id: 'manual-sales',
    name: 'Manual Sales',
    type: 'manual',
    isActive: true,
    metadata: {
      commissionRate: 0, // No commission for direct sales
      description:
        'Direct sales through manual processes (in-person, phone, etc.)',
      platform: 'direct',
    },
  },
];

/**
 * Get default sales channel by ID
 */
export function getDefaultSalesChannel(id: string): SalesChannel | undefined {
  return DEFAULT_SALES_CHANNELS.find((channel) => channel.id === id);
}

/**
 * Get all active default sales channels
 */
export function getActiveSalesChannels(): SalesChannel[] {
  return DEFAULT_SALES_CHANNELS.filter((channel) => channel.isActive);
}

/**
 * Get sales channels by type
 */
export function getSalesChannelsByType(
  type: SalesChannel['type']
): SalesChannel[] {
  return DEFAULT_SALES_CHANNELS.filter((channel) => channel.type === type);
}
