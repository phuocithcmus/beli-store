import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RevenueEntryDocument = RevenueEntry & Document;

export enum RevenueType {
  SALE = 'sale',
  REFUND = 'refund',
  FEE = 'fee',
  DISCOUNT = 'discount',
  TAX = 'tax',
  COMMISSION = 'commission',
  SHIPPING = 'shipping',
  OTHER = 'other',
}

export enum RevenueStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
}

@Schema({
  timestamps: true,
  collection: 'revenueEntries',
  toJSON: {
    transform: function (doc, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class RevenueEntry {
  @Prop({
    required: true,
    trim: true,
    unique: true,
    uppercase: true,
  })
  entryId: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Transaction',
    required: true,
    index: true,
  })
  transactionId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'SalesChannel',
    required: false,
    index: true,
  })
  salesChannelId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: RevenueType,
    required: true,
    index: true,
  })
  type: RevenueType;

  @Prop({
    type: String,
    enum: RevenueStatus,
    default: RevenueStatus.PENDING,
    index: true,
  })
  status: RevenueStatus;

  @Prop({
    required: true,
  })
  amount: number; // Can be positive or negative

  @Prop({
    required: true,
    min: 0,
  })
  grossAmount: number;

  @Prop({
    min: 0,
    default: 0,
  })
  costAmount: number;

  @Prop({
    default: 0,
  })
  netAmount: number; // grossAmount - costAmount

  @Prop({
    min: 0,
    default: 0,
  })
  feeAmount: number;

  @Prop({
    min: 0,
    default: 0,
  })
  taxAmount: number;

  @Prop({
    required: true,
    trim: true,
    default: 'USD',
  })
  currency: string;

  @Prop({
    required: false,
    trim: true,
  })
  description?: string;

  @Prop({
    required: false,
  })
  recordedDate?: Date;

  @Prop({
    required: false,
  })
  settledDate?: Date;

  @Prop({
    type: {
      productId: { type: Types.ObjectId, ref: 'Product', required: false },
      variantId: { type: Types.ObjectId, ref: 'ProductVariant', required: false },
      quantity: { type: Number, required: false },
      unitCost: { type: Number, required: false },
      unitPrice: { type: Number, required: false },
      margin: { type: Number, required: false },
    },
    required: false,
  })
  productData?: {
    productId?: Types.ObjectId;
    variantId?: Types.ObjectId;
    quantity?: number;
    unitCost?: number;
    unitPrice?: number;
    margin?: number;
  };

  @Prop({
    type: {
      customerName: { type: String, required: false },
      customerEmail: { type: String, required: false },
      region: { type: String, required: false },
      segment: { type: String, required: false },
    },
    required: false,
  })
  analyticsData?: {
    customerName?: string;
    customerEmail?: string;
    region?: string;
    segment?: string;
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

export const RevenueEntrySchema = SchemaFactory.createForClass(RevenueEntry);

// Indexes for performance and analytics
RevenueEntrySchema.index({ entryId: 1 }, { unique: true });
RevenueEntrySchema.index({ transactionId: 1 });
RevenueEntrySchema.index({ salesChannelId: 1, createdAt: -1 });
RevenueEntrySchema.index({ type: 1, status: 1 });
RevenueEntrySchema.index({ recordedDate: -1 });
RevenueEntrySchema.index({ settledDate: -1 });
RevenueEntrySchema.index({ isActive: 1, status: 1 });
RevenueEntrySchema.index({ currency: 1, createdAt: -1 });

// Compound indexes for analytics
RevenueEntrySchema.index({
  type: 1,
  salesChannelId: 1,
  recordedDate: -1,
});
RevenueEntrySchema.index({
  'analyticsData.region': 1,
  type: 1,
  recordedDate: -1,
});

// Text search index
RevenueEntrySchema.index({
  entryId: 'text',
  description: 'text',
  'analyticsData.customerName': 'text',
  'analyticsData.customerEmail': 'text',
});

// Pre-save middleware
RevenueEntrySchema.pre('save', async function (next) {
  this.updatedAt = new Date();

  // Auto-generate entryId if not provided
  if (!this.entryId) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14);
    const typePrefix = this.type.toUpperCase().substring(0, 3);
    this.entryId = `REV-${typePrefix}-${timestamp}`;
  }

  // Calculate net amount
  this.netAmount = this.grossAmount - this.costAmount;

  // Set recorded date if not provided and status is confirmed
  if (this.status === RevenueStatus.CONFIRMED && !this.recordedDate) {
    this.recordedDate = new Date();
  }

  // Calculate profit margin if product data is available
  if (this.productData && this.productData.unitPrice && this.productData.unitCost) {
    this.productData.margin =
      ((this.productData.unitPrice - this.productData.unitCost) / this.productData.unitPrice) * 100;
  }

  next();
});

// Pre-findOneAndUpdate middleware
RevenueEntrySchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Virtual for profit amount
RevenueEntrySchema.virtual('profitAmount').get(function () {
  if (this.type === RevenueType.SALE) {
    return this.netAmount - this.feeAmount - this.taxAmount;
  }
  return 0;
});

// Virtual for profit margin percentage
RevenueEntrySchema.virtual('profitMarginPercentage').get(function () {
  if (this.type === RevenueType.SALE && this.grossAmount > 0) {
    const profit = this.netAmount - this.feeAmount - this.taxAmount;
    return ((profit / this.grossAmount) * 100).toFixed(2);
  }
  return 0;
});

// Virtual for settlement status
RevenueEntrySchema.virtual('settlementStatus').get(function () {
  if (this.settledDate) return 'settled';
  if (this.status === RevenueStatus.CONFIRMED) return 'pending-settlement';
  return 'unconfirmed';
});

// Virtual for days to settlement
RevenueEntrySchema.virtual('daysToSettlement').get(function () {
  if (this.recordedDate && this.settledDate) {
    const recorded = new Date(this.recordedDate);
    const settled = new Date(this.settledDate);
    const diffTime = Math.abs(settled.getTime() - recorded.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual for age in days
RevenueEntrySchema.virtual('ageInDays').get(function () {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Include virtuals in JSON output
RevenueEntrySchema.set('toJSON', { virtuals: true });
RevenueEntrySchema.set('toObject', { virtuals: true });
