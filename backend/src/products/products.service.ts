import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto, PaginationResponse } from '../common/dto/pagination.dto';

export interface ProductFilter extends PaginationDto {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
}

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

  async create(createProductDto: CreateProductDto): Promise<ProductDocument> {
    try {
      const product = await this.productModel.create(createProductDto);
      return product;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(
          `Product with code '${createProductDto.code}' already exists`,
        );
      }
      throw new BadRequestException('Failed to create product: ' + error.message);
    }
  }

  async findAll(filter: ProductFilter = {}): Promise<PaginationResponse<ProductDocument>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      category,
      search,
      minPrice,
      maxPrice,
      stockStatus,
    } = filter;

    // Build query filter
    const query: any = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.sellingPrice = {};
      if (minPrice !== undefined) query.sellingPrice.$gte = minPrice;
      if (maxPrice !== undefined) query.sellingPrice.$lte = maxPrice;
    }

    if (stockStatus) {
      switch (stockStatus) {
        case 'out-of-stock':
          query.remainingQuantity = 0;
          break;
        case 'low-stock':
          query.remainingQuantity = { $gt: 0, $lte: 5 };
          break;
        case 'in-stock':
          query.remainingQuantity = { $gt: 5 };
          break;
      }
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query with pagination
    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate('variants')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  async findOne(id: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findOne({ _id: id, isActive: true })
      .populate('variants')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    return product;
  }

  async findByCode(code: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findOne({ code: code.toUpperCase(), isActive: true })
      .populate('variants')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with code '${code}' not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductDocument> {
    try {
      const product = await this.productModel
        .findOneAndUpdate({ _id: id, isActive: true }, updateProductDto, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!product) {
        throw new NotFoundException(`Product with ID '${id}' not found`);
      }

      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update product: ' + error.message);
    }
  }

  async remove(id: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findOneAndUpdate({ _id: id, isActive: true }, { isActive: false }, { new: true })
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    return product;
  }

  async updateQuantities(
    id: string,
    remainingQuantity: number,
    soldQuantity: number,
  ): Promise<ProductDocument> {
    if (remainingQuantity < 0 || soldQuantity < 0) {
      throw new BadRequestException('Quantities must be non-negative');
    }

    const product = await this.productModel
      .findOneAndUpdate(
        { _id: id, isActive: true },
        { remainingQuantity, soldQuantity },
        { new: true },
      )
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    return product;
  }

  async addVariant(productId: string, variantId: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findOneAndUpdate(
        { _id: productId, isActive: true },
        { $addToSet: { variants: variantId } },
        { new: true },
      )
      .populate('variants')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID '${productId}' not found`);
    }

    return product;
  }

  async removeVariant(productId: string, variantId: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findOneAndUpdate(
        { _id: productId, isActive: true },
        { $pull: { variants: variantId } },
        { new: true },
      )
      .populate('variants')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID '${productId}' not found`);
    }

    return product;
  }

  async getCategories(): Promise<string[]> {
    return ['shirt', 'pants', 'jacket', 'dress', 'shoes', 'accessories'];
  }

  async getCategoryStatistics(): Promise<any[]> {
    return this.productModel.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$remainingQuantity' },
          totalSold: { $sum: '$soldQuantity' },
          avgPrice: { $avg: '$sellingPrice' },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  async getStockAlerts(): Promise<ProductDocument[]> {
    return this.productModel
      .find({
        isActive: true,
        remainingQuantity: { $lte: 5 },
      })
      .sort({ remainingQuantity: 1 })
      .exec();
  }

  async searchProducts(searchTerm: string, limit = 10): Promise<ProductDocument[]> {
    const searchRegex = new RegExp(searchTerm, 'i');

    return this.productModel
      .find({
        isActive: true,
        $or: [{ name: searchRegex }, { code: searchRegex }, { description: searchRegex }],
      })
      .limit(limit)
      .exec();
  }

  // Test utility method - only for testing
  async clearTestData(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      await this.productModel.deleteMany({}).exec();
    }
  }
}
