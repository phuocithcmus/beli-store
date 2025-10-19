import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductVariant, ProductVariantDocument } from './schemas/product-variant.schema';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Injectable()
export class ProductVariantsService {
  constructor(
    @InjectModel(ProductVariant.name)
    private productVariantModel: Model<ProductVariantDocument>,
  ) {}

  async create(createProductVariantDto: CreateProductVariantDto): Promise<ProductVariant> {
    try {
      const productVariant = new this.productVariantModel(createProductVariantDto);
      return await productVariant.save();
    } catch (error) {
      if (error.code === 11000) {
        const duplicateKey = Object.keys(error.keyPattern)[0];
        if (duplicateKey === 'sku') {
          throw new ConflictException('SKU already exists');
        }
        // Duplicate variant combination
        throw new ConflictException('Product variant with this combination already exists');
      }
      throw error;
    }
  }

  async findAll(
    productId?: string,
    options?: {
      page?: number;
      limit?: number;
      isActive?: boolean;
      inStock?: boolean;
      color?: string;
      size?: string;
      form?: string;
    },
  ) {
    const { page = 1, limit = 10, isActive, inStock, color, size, form } = options || {};

    const filter: any = {};

    if (productId) {
      filter.productId = new Types.ObjectId(productId);
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (inStock !== undefined) {
      filter.quantity = inStock ? { $gt: 0 } : 0;
    }

    if (color) {
      filter.color = { $regex: color, $options: 'i' };
    }

    if (size) {
      filter.size = size.toUpperCase();
    }

    if (form) {
      filter.form = { $regex: form, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [variants, total] = await Promise.all([
      this.productVariantModel
        .find(filter)
        .populate('productId', 'name code category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productVariantModel.countDocuments(filter).exec(),
    ]);

    return {
      variants,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ProductVariant> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid variant ID');
    }

    const variant = await this.productVariantModel
      .findById(id)
      .populate('productId', 'name code category')
      .exec();

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    return variant;
  }

  async findByProduct(productId: string): Promise<ProductVariant[]> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    return this.productVariantModel
      .find({ productId: new Types.ObjectId(productId), isActive: true })
      .sort({ color: 1, size: 1, form: 1 })
      .exec();
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    return this.productVariantModel
      .findOne({ sku: sku.toUpperCase() })
      .populate('productId', 'name code category')
      .exec();
  }

  async update(
    id: string,
    updateProductVariantDto: UpdateProductVariantDto,
  ): Promise<ProductVariant> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid variant ID');
    }

    try {
      const variant = await this.productVariantModel
        .findByIdAndUpdate(id, updateProductVariantDto, { new: true, runValidators: true })
        .populate('productId', 'name code category')
        .exec();

      if (!variant) {
        throw new NotFoundException('Product variant not found');
      }

      return variant;
    } catch (error) {
      if (error.code === 11000) {
        const duplicateKey = Object.keys(error.keyPattern)[0];
        if (duplicateKey === 'sku') {
          throw new ConflictException('SKU already exists');
        }
        throw new ConflictException('Product variant with this combination already exists');
      }
      throw error;
    }
  }

  async updateQuantity(id: string, quantity: number): Promise<ProductVariant> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid variant ID');
    }

    if (quantity < 0) {
      throw new BadRequestException('Quantity cannot be negative');
    }

    const variant = await this.productVariantModel
      .findByIdAndUpdate(id, { quantity }, { new: true, runValidators: true })
      .populate('productId', 'name code category')
      .exec();

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    return variant;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid variant ID');
    }

    const result = await this.productVariantModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('Product variant not found');
    }
  }

  async softDelete(id: string): Promise<ProductVariant> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid variant ID');
    }

    const variant = await this.productVariantModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .populate('productId', 'name code category')
      .exec();

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    return variant;
  }

  async getVariantStats(productId?: string) {
    const matchStage: any = {};
    if (productId) {
      matchStage.productId = new Types.ObjectId(productId);
    }

    const stats = await this.productVariantModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalVariants: { $sum: 1 },
          activeVariants: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          totalQuantity: { $sum: '$quantity' },
          outOfStock: {
            $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] },
          },
          lowStock: {
            $sum: {
              $cond: [{ $and: [{ $gt: ['$quantity', 0] }, { $lte: ['$quantity', 2] }] }, 1, 0],
            },
          },
          inStock: {
            $sum: { $cond: [{ $gt: ['$quantity', 2] }, 1, 0] },
          },
          averageQuantity: { $avg: '$quantity' },
        },
      },
    ]);

    return (
      stats[0] || {
        totalVariants: 0,
        activeVariants: 0,
        totalQuantity: 0,
        outOfStock: 0,
        lowStock: 0,
        inStock: 0,
        averageQuantity: 0,
      }
    );
  }

  async getLowStockVariants(threshold: number = 2): Promise<ProductVariant[]> {
    return this.productVariantModel
      .find({
        isActive: true,
        quantity: { $gt: 0, $lte: threshold },
      })
      .populate('productId', 'name code category')
      .sort({ quantity: 1 })
      .exec();
  }

  async getOutOfStockVariants(): Promise<ProductVariant[]> {
    return this.productVariantModel
      .find({
        isActive: true,
        quantity: 0,
      })
      .populate('productId', 'name code category')
      .sort({ updatedAt: -1 })
      .exec();
  }

  // Test helper methods
  async deleteAllForTesting(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('This method can only be used in test environment');
    }
    await this.productVariantModel.deleteMany({}).exec();
  }

  async createForTesting(data: Partial<ProductVariant>): Promise<ProductVariant> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('This method can only be used in test environment');
    }
    const variant = new this.productVariantModel(data);
    return variant.save();
  }
}
