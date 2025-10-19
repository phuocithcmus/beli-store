import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({
  timestamps: true,
  collection: 'products',
  toJSON: {
    transform: function (doc, ret: any) {
      delete ret.__v;
      return ret;
    },
  },
})
export class Product {
  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true,
    uppercase: true,
  })
  code: string;

  @Prop({
    required: true,
    index: 'text',
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    enum: ['shirt', 'pants', 'jacket', 'dress', 'shoes', 'accessories'],
    index: true,
  })
  category: string;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  remainingQuantity: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  soldQuantity: number;

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
    type: [{ type: Types.ObjectId, ref: 'ProductVariant' }],
    default: [],
  })
  variants: Types.ObjectId[];

  @Prop({
    required: false,
    trim: true,
    index: 'text',
  })
  description?: string;

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

export const ProductSchema = SchemaFactory.createForClass(Product);

// Compound indexes for performance optimization
ProductSchema.index({ code: 1 }, { unique: true });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ isActive: 1, category: 1, createdAt: -1 });

// Pre-save middleware to update timestamps
ProductSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Pre-findOneAndUpdate middleware to update timestamps
ProductSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Virtual for total quantity
ProductSchema.virtual('totalQuantity').get(function () {
  return this.remainingQuantity + this.soldQuantity;
});

// Virtual for stock status
ProductSchema.virtual('stockStatus').get(function () {
  if (this.remainingQuantity === 0) return 'out-of-stock';
  if (this.remainingQuantity <= 5) return 'low-stock';
  return 'in-stock';
});

// Virtual for profit margin (if both prices are available)
ProductSchema.virtual('profitMargin').get(function () {
  if (this.purchasePrice && this.sellingPrice) {
    return (((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100).toFixed(2);
  }
  return null;
});

// Include virtuals in JSON output
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });
