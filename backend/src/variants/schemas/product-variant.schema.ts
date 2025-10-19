import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductVariantDocument = ProductVariant & Document;

@Schema({
  timestamps: true,
  collection: 'productVariants',
  toJSON: {
    transform: function (doc, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class ProductVariant {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  })
  productId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
  })
  color: string;

  @Prop({
    required: true,
    trim: true,
    uppercase: true,
  })
  size: string;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
  })
  form: string;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  quantity: number;

  @Prop({
    min: 0,
    required: false,
  })
  purchasePrice?: number;

  @Prop({
    min: 0,
    required: false,
  })
  sellingPrice?: number;

  @Prop({
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true,
  })
  sku?: string;

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

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

// Compound unique index for variant uniqueness within a product
ProductVariantSchema.index(
  {
    productId: 1,
    color: 1,
    size: 1,
    form: 1,
  },
  { unique: true },
);

// Additional indexes for performance
ProductVariantSchema.index({ productId: 1, isActive: 1 });
ProductVariantSchema.index({ sku: 1 }, { unique: true, sparse: true });
ProductVariantSchema.index({ isActive: 1, quantity: 1 });

// Pre-save middleware to generate SKU if not provided
ProductVariantSchema.pre('save', async function (next) {
  this.updatedAt = new Date();

  if (!this.sku) {
    // Generate SKU: VAR-{COLOR}-{SIZE}-{FORM}
    this.sku = `VAR-${this.color.toUpperCase()}-${this.size}-${this.form.toUpperCase()}`;
  }

  next();
});

// Pre-findOneAndUpdate middleware to update timestamps
ProductVariantSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Virtual for stock status
ProductVariantSchema.virtual('stockStatus').get(function () {
  if (this.quantity === 0) return 'out-of-stock';
  if (this.quantity <= 2) return 'low-stock';
  return 'in-stock';
});

// Virtual for profit margin (if both prices are available)
ProductVariantSchema.virtual('profitMargin').get(function () {
  if (this.purchasePrice && this.sellingPrice) {
    return (((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100).toFixed(2);
  }
  return null;
});

// Virtual for display name
ProductVariantSchema.virtual('displayName').get(function () {
  return `${this.color} - ${this.size} - ${this.form}`;
});

// Include virtuals in JSON output
ProductVariantSchema.set('toJSON', { virtuals: true });
ProductVariantSchema.set('toObject', { virtuals: true });
