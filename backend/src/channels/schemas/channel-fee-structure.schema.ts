import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type ChannelFeeStructureDocument = ChannelFeeStructure & Document;

export enum FeeType {
  TRANSACTION = 'transaction',
  SUBSCRIPTION = 'subscription',
  LISTING = 'listing',
  COMMISSION = 'commission',
  PAYMENT_PROCESSING = 'payment_processing',
  WITHDRAWAL = 'withdrawal',
  REFUND = 'refund',
  SETUP = 'setup',
  MAINTENANCE = 'maintenance',
  OTHER = 'other',
}

export enum FeeCalculationType {
  PERCENTAGE = 'percentage',
  FLAT = 'flat',
  TIERED = 'tiered',
  HYBRID = 'hybrid',
}

export enum FeeFrequency {
  PER_TRANSACTION = 'per_transaction',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  ONE_TIME = 'one_time',
}

export interface FeeTier {
  minAmount: number;
  maxAmount?: number;
  percentage?: number;
  flatFee?: number;
  description?: string;
}

export interface FeeCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: any;
  description?: string;
}

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'channelFeeStructures',
})
export class ChannelFeeStructure {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'SalesChannel',
    required: true,
    index: true,
  })
  channelId: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    match: /^[A-Z0-9_-]+$/,
    maxlength: 50,
  })
  code: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 200,
  })
  name: string;

  @Prop({
    type: String,
    enum: Object.values(FeeType),
    required: true,
    index: true,
  })
  type: FeeType;

  @Prop({
    type: String,
    enum: Object.values(FeeCalculationType),
    required: true,
  })
  calculationType: FeeCalculationType;

  @Prop({
    type: String,
    enum: Object.values(FeeFrequency),
    required: true,
  })
  frequency: FeeFrequency;

  @Prop({
    type: Number,
    min: 0,
    max: 100,
  })
  percentage?: number;

  @Prop({
    type: Number,
    min: 0,
  })
  flatFee?: number;

  @Prop({
    type: Number,
    min: 0,
  })
  minimumFee?: number;

  @Prop({
    type: Number,
    min: 0,
  })
  maximumFee?: number;

  @Prop({
    type: [
      {
        minAmount: { type: Number, required: true, min: 0 },
        maxAmount: { type: Number, min: 0 },
        percentage: { type: Number, min: 0, max: 100 },
        flatFee: { type: Number, min: 0 },
        description: { type: String, maxlength: 200 },
      },
    ],
    default: [],
  })
  tiers: FeeTier[];

  @Prop({
    type: [
      {
        field: { type: String, required: true, maxlength: 50 },
        operator: {
          type: String,
          required: true,
          enum: ['equals', 'greater_than', 'less_than', 'contains', 'in'],
        },
        value: { type: MongooseSchema.Types.Mixed, required: true },
        description: { type: String, maxlength: 200 },
      },
    ],
    default: [],
  })
  conditions: FeeCondition[];

  @Prop({
    type: String,
    uppercase: true,
    length: 3,
    match: /^[A-Z]{3}$/,
    default: 'USD',
  })
  currency: string;

  @Prop({
    trim: true,
    maxlength: 500,
  })
  description?: string;

  @Prop({
    default: true,
    index: true,
  })
  isActive: boolean;

  @Prop({
    type: Date,
  })
  effectiveFrom?: Date;

  @Prop({
    type: Date,
  })
  effectiveTo?: Date;

  @Prop({
    type: {
      totalApplied: { type: Number, default: 0, min: 0 },
      totalAmount: { type: Number, default: 0, min: 0 },
      lastAppliedDate: { type: Date },
      averageFeeAmount: { type: Number, default: 0, min: 0 },
      applicationCount: { type: Number, default: 0, min: 0 },
    },
    default: {},
  })
  statistics: {
    totalApplied: number;
    totalAmount: number;
    lastAppliedDate?: Date;
    averageFeeAmount: number;
    applicationCount: number;
  };

  @Prop({
    type: [{ type: String, lowercase: true, trim: true }],
    default: [],
    index: true,
  })
  tags: string[];

  @Prop({
    type: {
      supportContact: { type: String, maxlength: 100 },
      documentationUrl: { type: String, maxlength: 500 },
      lastUpdatedBy: { type: String, maxlength: 100 },
      changeLog: [
        {
          date: { type: Date, default: Date.now },
          change: { type: String, maxlength: 200 },
          updatedBy: { type: String, maxlength: 100 },
        },
      ],
    },
    default: {},
  })
  metadata: {
    supportContact?: string;
    documentationUrl?: string;
    lastUpdatedBy?: string;
    changeLog: Array<{
      date: Date;
      change: string;
      updatedBy: string;
    }>;
  };

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ChannelFeeStructureSchema = SchemaFactory.createForClass(ChannelFeeStructure);

// Virtual for checking if fee structure is currently active
ChannelFeeStructureSchema.virtual('isCurrentlyActive').get(function () {
  if (!this.isActive) return false;

  const now = new Date();

  if (this.effectiveFrom && now < this.effectiveFrom) return false;
  if (this.effectiveTo && now > this.effectiveTo) return false;

  return true;
});

// Virtual for effective status
ChannelFeeStructureSchema.virtual('effectiveStatus').get(function () {
  if (!this.isActive) return 'inactive';

  const now = new Date();

  if (this.effectiveFrom && now < this.effectiveFrom) return 'scheduled';
  if (this.effectiveTo && now > this.effectiveTo) return 'expired';

  return 'active';
});

// Virtual for average fee rate
ChannelFeeStructureSchema.virtual('averageFeeRate').get(function () {
  if (this.calculationType === FeeCalculationType.PERCENTAGE) {
    return this.percentage || 0;
  }

  if (this.calculationType === FeeCalculationType.TIERED && this.tiers.length > 0) {
    const totalPercentage = this.tiers.reduce((sum, tier) => sum + (tier.percentage || 0), 0);
    return totalPercentage / this.tiers.length;
  }

  return 0;
});

// Ensure virtuals are included in JSON output
ChannelFeeStructureSchema.set('toJSON', { virtuals: true });
ChannelFeeStructureSchema.set('toObject', { virtuals: true });

// Indexes
ChannelFeeStructureSchema.index({ channelId: 1, type: 1 });
ChannelFeeStructureSchema.index({ code: 1 }, { unique: true });
ChannelFeeStructureSchema.index({ isActive: 1, effectiveFrom: 1, effectiveTo: 1 });
ChannelFeeStructureSchema.index({ 'statistics.totalAmount': -1 });
ChannelFeeStructureSchema.index({ tags: 1 });

// Text search index
ChannelFeeStructureSchema.index({
  name: 'text',
  code: 'text',
  description: 'text',
  'metadata.supportContact': 'text',
});

// Pre-save middleware
ChannelFeeStructureSchema.pre('save', function (next) {
  this.updatedAt = new Date();

  // Validate fee structure based on calculation type
  if (this.calculationType === FeeCalculationType.PERCENTAGE && !this.percentage) {
    return next(new Error('Percentage is required for percentage-based fees'));
  }

  if (this.calculationType === FeeCalculationType.FLAT && !this.flatFee) {
    return next(new Error('Flat fee is required for flat fee structures'));
  }

  if (this.calculationType === FeeCalculationType.TIERED && this.tiers.length === 0) {
    return next(new Error('At least one tier is required for tiered fee structures'));
  }

  // Validate effective dates
  if (this.effectiveFrom && this.effectiveTo && this.effectiveFrom >= this.effectiveTo) {
    return next(new Error('Effective from date must be before effective to date'));
  }

  // Calculate statistics if needed
  if (this.statistics.applicationCount > 0) {
    this.statistics.averageFeeAmount =
      this.statistics.totalAmount / this.statistics.applicationCount;
  }

  next();
});

// Instance methods for fee calculation
ChannelFeeStructureSchema.methods.calculateFee = function (amount: number, context?: any): number {
  if (!this.isCurrentlyActive) {
    throw new Error('Fee structure is not currently active');
  }

  // Check conditions
  if (this.conditions.length > 0) {
    const conditionsMet = this.conditions.every(condition => {
      if (!context || !(condition.field in context)) return false;

      const fieldValue = context[condition.field];

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'greater_than':
          return fieldValue > condition.value;
        case 'less_than':
          return fieldValue < condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        default:
          return false;
      }
    });

    if (!conditionsMet) {
      return 0; // Conditions not met, no fee applies
    }
  }

  let calculatedFee = 0;

  switch (this.calculationType) {
    case FeeCalculationType.PERCENTAGE:
      calculatedFee = (amount * (this.percentage || 0)) / 100;
      break;

    case FeeCalculationType.FLAT:
      calculatedFee = this.flatFee || 0;
      break;

    case FeeCalculationType.TIERED:
      calculatedFee = this.calculateTieredFee(amount);
      break;

    case FeeCalculationType.HYBRID:
      const percentageFee = (amount * (this.percentage || 0)) / 100;
      calculatedFee = percentageFee + (this.flatFee || 0);
      break;

    default:
      calculatedFee = 0;
  }

  // Apply minimum and maximum fee constraints
  if (this.minimumFee !== undefined) {
    calculatedFee = Math.max(calculatedFee, this.minimumFee);
  }

  if (this.maximumFee !== undefined) {
    calculatedFee = Math.min(calculatedFee, this.maximumFee);
  }

  return parseFloat(calculatedFee.toFixed(2));
};

ChannelFeeStructureSchema.methods.calculateTieredFee = function (amount: number): number {
  if (this.tiers.length === 0) return 0;

  // Sort tiers by minAmount
  const sortedTiers = [...this.tiers].sort((a, b) => a.minAmount - b.minAmount);

  let totalFee = 0;
  let remainingAmount = amount;

  for (const tier of sortedTiers) {
    if (remainingAmount <= 0) break;

    const tierMin = tier.minAmount;
    const tierMax = tier.maxAmount || Infinity;

    if (amount <= tierMin) continue;

    const tierAmount = Math.min(
      remainingAmount,
      Math.max(0, tierMax - Math.max(tierMin, amount - remainingAmount)),
    );

    if (tierAmount > 0) {
      if (tier.percentage) {
        totalFee += (tierAmount * tier.percentage) / 100;
      }
      if (tier.flatFee) {
        totalFee += tier.flatFee;
      }
    }

    remainingAmount -= tierAmount;
  }

  return totalFee;
};
