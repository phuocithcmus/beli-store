import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  SALE = 'sale',
  PURCHASE = 'purchase',
  RETURN = 'return',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  CREDIT = 'credit',
  OTHER = 'other',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Schema({
  timestamps: true,
  collection: 'transactions',
  toJSON: {
    transform: function (doc, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class Transaction {
  @Prop({
    required: true,
    trim: true,
    unique: true,
    uppercase: true,
  })
  transactionId: string;

  @Prop({
    type: String,
    enum: TransactionType,
    required: true,
    index: true,
  })
  type: TransactionType;

  @Prop({
    type: String,
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
    index: true,
  })
  status: TransactionStatus;

  @Prop({
    required: true,
    min: 0,
  })
  totalAmount: number;

  @Prop({
    min: 0,
    default: 0,
  })
  taxAmount: number;

  @Prop({
    min: 0,
    default: 0,
  })
  discountAmount: number;

  @Prop({
    required: true,
    min: 0,
  })
  netAmount: number;

  @Prop({
    type: String,
    enum: PaymentMethod,
    required: true,
  })
  paymentMethod: PaymentMethod;

  @Prop({
    required: false,
    trim: true,
  })
  paymentReference?: string;

  @Prop({
    required: false,
    trim: true,
  })
  customerName?: string;

  @Prop({
    required: false,
    trim: true,
  })
  customerEmail?: string;

  @Prop({
    required: false,
    trim: true,
  })
  customerPhone?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'SalesChannel',
    required: false,
    index: true,
  })
  salesChannelId?: Types.ObjectId;

  @Prop({
    type: [
      {
        productId: { type: Types.ObjectId, ref: 'Product', required: true },
        variantId: { type: Types.ObjectId, ref: 'ProductVariant', required: false },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        tax: { type: Number, default: 0, min: 0 },
      },
    ],
    default: [],
  })
  items: {
    productId: Types.ObjectId;
    variantId?: Types.ObjectId;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discount: number;
    tax: number;
  }[];

  @Prop({
    required: false,
    trim: true,
  })
  notes?: string;

  @Prop({
    required: false,
  })
  processedAt?: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'Transaction',
    required: false,
  })
  relatedTransactionId?: Types.ObjectId; // For returns/refunds

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

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Indexes for performance
TransactionSchema.index({ transactionId: 1 }, { unique: true });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ salesChannelId: 1, createdAt: -1 });
TransactionSchema.index({ customerEmail: 1 });
TransactionSchema.index({ isActive: 1, status: 1 });

// Text search index
TransactionSchema.index({
  transactionId: 'text',
  customerName: 'text',
  customerEmail: 'text',
  paymentReference: 'text',
  notes: 'text',
});

// Pre-save middleware
TransactionSchema.pre('save', async function (next) {
  this.updatedAt = new Date();

  // Auto-generate transactionId if not provided
  if (!this.transactionId) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14);
    const typePrefix = this.type.toUpperCase().substring(0, 3);
    this.transactionId = `${typePrefix}-${timestamp}`;
  }

  // Calculate amounts from items if not provided
  if (this.items && this.items.length > 0) {
    const itemsTotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const itemsDiscount = this.items.reduce((sum, item) => sum + item.discount, 0);
    const itemsTax = this.items.reduce((sum, item) => sum + item.tax, 0);

    if (!this.totalAmount) this.totalAmount = itemsTotal;
    if (!this.discountAmount) this.discountAmount = itemsDiscount;
    if (!this.taxAmount) this.taxAmount = itemsTax;
    if (!this.netAmount) this.netAmount = this.totalAmount - this.discountAmount + this.taxAmount;
  }

  // Set processedAt timestamp when status changes to completed
  if (
    this.isModified('status') &&
    this.status === TransactionStatus.COMPLETED &&
    !this.processedAt
  ) {
    this.processedAt = new Date();
  }

  next();
});

// Pre-findOneAndUpdate middleware
TransactionSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Virtual for profit (for sales)
TransactionSchema.virtual('estimatedProfit').get(function () {
  if (this.type === TransactionType.SALE && this.items) {
    // This would need to calculate based on cost prices from product/variant data
    // For now, return a placeholder calculation
    return (this.netAmount * 0.3).toFixed(2); // Assuming 30% profit margin
  }
  return 0;
});

// Virtual for item count
TransactionSchema.virtual('itemCount').get(function () {
  if (this.items) {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
  return 0;
});

// Virtual for average item price
TransactionSchema.virtual('averageItemPrice').get(function () {
  if (this.items && this.items.length > 0) {
    const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    return totalItems > 0 ? (this.totalAmount / totalItems).toFixed(2) : 0;
  }
  return 0;
});

// Virtual for transaction age in days
TransactionSchema.virtual('ageInDays').get(function () {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for processing time (if completed)
TransactionSchema.virtual('processingTimeMinutes').get(function () {
  if (this.processedAt) {
    const created = new Date(this.createdAt);
    const processed = new Date(this.processedAt);
    const diffTime = Math.abs(processed.getTime() - created.getTime());
    return Math.floor(diffTime / (1000 * 60));
  }
  return null;
});

// Include virtuals in JSON output
TransactionSchema.set('toJSON', { virtuals: true });
TransactionSchema.set('toObject', { virtuals: true });
