import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ImportPhaseDocument = ImportPhase & Document;

export enum ImportStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

@Schema({
  timestamps: true,
  collection: 'importPhases',
  toJSON: {
    transform: function (doc, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class ImportPhase {
  @Prop({
    required: true,
    trim: true,
    unique: true,
    uppercase: true,
  })
  batchId: string;

  @Prop({
    required: true,
    trim: true,
  })
  supplierName: string;

  @Prop({
    type: String,
    enum: ImportStatus,
    default: ImportStatus.PENDING,
    index: true,
  })
  status: ImportStatus;

  @Prop({
    required: true,
    min: 0,
  })
  totalCost: number;

  @Prop({
    required: true,
    min: 0,
  })
  totalQuantity: number;

  @Prop({
    required: false,
    trim: true,
  })
  notes?: string;

  @Prop({
    required: false,
  })
  expectedDeliveryDate?: Date;

  @Prop({
    required: false,
  })
  actualDeliveryDate?: Date;

  @Prop({
    required: false,
    trim: true,
  })
  invoiceNumber?: string;

  @Prop({
    required: false,
    trim: true,
  })
  trackingNumber?: string;

  @Prop({
    type: [
      {
        productId: { type: Types.ObjectId, ref: 'Product', required: true },
        variantId: { type: Types.ObjectId, ref: 'ProductVariant', required: false },
        quantity: { type: Number, required: true, min: 1 },
        unitCost: { type: Number, required: true, min: 0 },
        totalCost: { type: Number, required: true, min: 0 },
      },
    ],
    default: [],
  })
  items: {
    productId: Types.ObjectId;
    variantId?: Types.ObjectId;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];

  @Prop({
    required: false,
  })
  startedAt?: Date;

  @Prop({
    required: false,
  })
  completedAt?: Date;

  @Prop({
    required: false,
  })
  cancelledAt?: Date;

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

export const ImportPhaseSchema = SchemaFactory.createForClass(ImportPhase);

// Indexes for performance
ImportPhaseSchema.index({ batchId: 1 }, { unique: true });
ImportPhaseSchema.index({ status: 1, createdAt: -1 });
ImportPhaseSchema.index({ supplierName: 1, status: 1 });
ImportPhaseSchema.index({ expectedDeliveryDate: 1 });
ImportPhaseSchema.index({ isActive: 1, status: 1 });

// Text search index
ImportPhaseSchema.index({
  batchId: 'text',
  supplierName: 'text',
  notes: 'text',
  invoiceNumber: 'text',
  trackingNumber: 'text',
});

// Pre-save middleware
ImportPhaseSchema.pre('save', async function (next) {
  this.updatedAt = new Date();

  // Auto-generate batchId if not provided
  if (!this.batchId) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14);
    this.batchId = `IMP-${timestamp}`;
  }

  // Calculate total cost from items if not provided
  if (this.items && this.items.length > 0) {
    this.totalCost = this.items.reduce((sum, item) => sum + item.totalCost, 0);
    this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Set timestamps based on status changes
  if (this.isModified('status')) {
    const now = new Date();
    switch (this.status) {
      case ImportStatus.IN_PROGRESS:
        if (!this.startedAt) this.startedAt = now;
        break;
      case ImportStatus.COMPLETED:
        if (!this.completedAt) this.completedAt = now;
        if (!this.actualDeliveryDate) this.actualDeliveryDate = now;
        break;
      case ImportStatus.CANCELLED:
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
    }
  }

  next();
});

// Pre-findOneAndUpdate middleware
ImportPhaseSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Virtual for duration (if completed)
ImportPhaseSchema.virtual('duration').get(function () {
  if (this.startedAt && this.completedAt) {
    const diffTime = Math.abs(this.completedAt.getTime() - this.startedAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
});

// Virtual for average cost per item
ImportPhaseSchema.virtual('averageCostPerItem').get(function () {
  if (this.totalQuantity && this.totalQuantity > 0) {
    return (this.totalCost / this.totalQuantity).toFixed(2);
  }
  return 0;
});

// Virtual for completion percentage
ImportPhaseSchema.virtual('completionPercentage').get(function () {
  switch (this.status) {
    case ImportStatus.PENDING:
      return 0;
    case ImportStatus.IN_PROGRESS:
      return 50;
    case ImportStatus.COMPLETED:
      return 100;
    case ImportStatus.CANCELLED:
    case ImportStatus.FAILED:
      return 0;
    default:
      return 0;
  }
});

// Virtual for delivery status
ImportPhaseSchema.virtual('deliveryStatus').get(function () {
  if (!this.expectedDeliveryDate) return 'no-date-set';

  const now = new Date();
  const expected = new Date(this.expectedDeliveryDate);

  if (this.actualDeliveryDate) {
    const actual = new Date(this.actualDeliveryDate);
    return actual <= expected ? 'on-time' : 'delayed';
  }

  if (this.status === ImportStatus.COMPLETED) {
    return 'delivered';
  }

  return now > expected ? 'overdue' : 'pending';
});

// Include virtuals in JSON output
ImportPhaseSchema.set('toJSON', { virtuals: true });
ImportPhaseSchema.set('toObject', { virtuals: true });
