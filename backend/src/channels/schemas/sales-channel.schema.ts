import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SalesChannelDocument = SalesChannel & Document;

export enum ChannelType {
  ONLINE = 'online',
  PHYSICAL_STORE = 'physical_store',
  MARKETPLACE = 'marketplace',
  SOCIAL_MEDIA = 'social_media',
  WHOLESALE = 'wholesale',
  MOBILE_APP = 'mobile_app',
  OTHER = 'other',
}

export enum ChannelStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  MAINTENANCE = 'maintenance',
}

@Schema({
  timestamps: true,
  collection: 'salesChannels',
  toJSON: {
    transform: function (doc, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class SalesChannel {
  @Prop({
    required: true,
    trim: true,
    unique: true,
  })
  name: string;

  @Prop({
    required: true,
    trim: true,
    unique: true,
    uppercase: true,
  })
  code: string;

  @Prop({
    type: String,
    enum: ChannelType,
    required: true,
    index: true,
  })
  type: ChannelType;

  @Prop({
    type: String,
    enum: ChannelStatus,
    default: ChannelStatus.ACTIVE,
    index: true,
  })
  status: ChannelStatus;

  @Prop({
    required: false,
    trim: true,
  })
  description?: string;

  @Prop({
    required: false,
    trim: true,
  })
  website?: string;

  @Prop({
    required: false,
    trim: true,
  })
  contactEmail?: string;

  @Prop({
    required: false,
    trim: true,
  })
  contactPhone?: string;

  @Prop({
    type: {
      street: { type: String, required: false },
      city: { type: String, required: false },
      state: { type: String, required: false },
      zipCode: { type: String, required: false },
      country: { type: String, required: false, default: 'US' },
    },
    required: false,
  })
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  @Prop({
    type: {
      currency: { type: String, required: true, default: 'USD' },
      timezone: { type: String, required: false, default: 'UTC' },
      language: { type: String, required: false, default: 'en' },
      taxRate: { type: Number, required: false, min: 0, max: 100, default: 0 },
      shippingFeeFlat: { type: Number, required: false, min: 0, default: 0 },
      shippingFeePercentage: { type: Number, required: false, min: 0, max: 100, default: 0 },
      minimumOrderAmount: { type: Number, required: false, min: 0, default: 0 },
      maximumOrderAmount: { type: Number, required: false, min: 0 },
    },
    required: false,
  })
  configuration?: {
    currency?: string;
    timezone?: string;
    language?: string;
    taxRate?: number;
    shippingFeeFlat?: number;
    shippingFeePercentage?: number;
    minimumOrderAmount?: number;
    maximumOrderAmount?: number;
  };

  @Prop({
    type: {
      apiKey: { type: String, required: false },
      secretKey: { type: String, required: false },
      webhookUrl: { type: String, required: false },
      accessToken: { type: String, required: false },
      refreshToken: { type: String, required: false },
      customFields: { type: Map, of: String, required: false },
    },
    required: false,
    select: false, // Don't include in regular queries for security
  })
  integrationSettings?: {
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    accessToken?: string;
    refreshToken?: string;
    customFields?: Map<string, string>;
  };

  @Prop({
    type: {
      totalSales: { type: Number, default: 0, min: 0 },
      totalOrders: { type: Number, default: 0, min: 0 },
      totalRevenue: { type: Number, default: 0, min: 0 },
      averageOrderValue: { type: Number, default: 0, min: 0 },
      lastSaleDate: { type: Date, required: false },
      lastOrderDate: { type: Date, required: false },
    },
    default: {},
  })
  statistics: {
    totalSales: number;
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    lastSaleDate?: Date;
    lastOrderDate?: Date;
  };

  @Prop({
    type: [String],
    default: [],
  })
  tags: string[];

  @Prop({
    type: Map,
    of: String,
    default: {},
  })
  metadata: Map<string, string>;

  @Prop({
    default: true,
    index: true,
  })
  isActive: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const SalesChannelSchema = SchemaFactory.createForClass(SalesChannel);

// Indexes for performance
SalesChannelSchema.index({ name: 1 }, { unique: true });
SalesChannelSchema.index({ code: 1 }, { unique: true });
SalesChannelSchema.index({ type: 1, status: 1 });
SalesChannelSchema.index({ isActive: 1, status: 1 });
SalesChannelSchema.index({ 'statistics.totalRevenue': -1 });
SalesChannelSchema.index({ 'statistics.lastSaleDate': -1 });

// Text search index
SalesChannelSchema.index({
  name: 'text',
  description: 'text',
  code: 'text',
});

// Pre-save middleware
SalesChannelSchema.pre('save', async function (next) {
  this.updatedAt = new Date();

  // Auto-generate code if not provided
  if (!this.code) {
    const nameCode = this.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substring(0, 10);
    const timestamp = Date.now().toString().slice(-4);
    this.code = `${nameCode}_${timestamp}`;
  }

  // Calculate average order value
  if (this.statistics.totalOrders > 0) {
    this.statistics.averageOrderValue = this.statistics.totalRevenue / this.statistics.totalOrders;
  }

  // Set default configuration values
  if (!this.configuration) {
    this.configuration = {
      currency: 'USD',
      timezone: 'UTC',
      language: 'en',
      taxRate: 0,
      shippingFeeFlat: 0,
      shippingFeePercentage: 0,
      minimumOrderAmount: 0,
    };
  }

  next();
});

// Pre-findOneAndUpdate middleware
SalesChannelSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Virtual for performance rating
SalesChannelSchema.virtual('performanceRating').get(function () {
  if (this.statistics.totalOrders === 0) return 'new';
  if (this.statistics.averageOrderValue > 100) return 'excellent';
  if (this.statistics.averageOrderValue > 50) return 'good';
  if (this.statistics.averageOrderValue > 25) return 'average';
  return 'poor';
});

// Virtual for activity status
SalesChannelSchema.virtual('activityStatus').get(function () {
  if (!this.statistics.lastSaleDate) return 'no-sales';

  const now = new Date();
  const lastSale = new Date(this.statistics.lastSaleDate);
  const daysSinceLastSale = Math.floor(
    (now.getTime() - lastSale.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSinceLastSale <= 7) return 'very-active';
  if (daysSinceLastSale <= 30) return 'active';
  if (daysSinceLastSale <= 90) return 'moderate';
  return 'inactive';
});

// Virtual for revenue per order
SalesChannelSchema.virtual('revenuePerOrder').get(function () {
  if (this.statistics.totalOrders > 0) {
    return (this.statistics.totalRevenue / this.statistics.totalOrders).toFixed(2);
  }
  return 0;
});

// Virtual for display name
SalesChannelSchema.virtual('displayName').get(function () {
  return `${this.name} (${this.type.toUpperCase()})`;
});

// Virtual for is online channel
SalesChannelSchema.virtual('isOnlineChannel').get(function () {
  return [
    ChannelType.ONLINE,
    ChannelType.MARKETPLACE,
    ChannelType.SOCIAL_MEDIA,
    ChannelType.MOBILE_APP,
  ].includes(this.type);
});

// Include virtuals in JSON output
SalesChannelSchema.set('toJSON', { virtuals: true });
SalesChannelSchema.set('toObject', { virtuals: true });
