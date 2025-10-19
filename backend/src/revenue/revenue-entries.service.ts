import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RevenueEntry,
  RevenueEntryDocument,
  RevenueType,
  RevenueStatus,
} from './schemas/revenue-entry.schema';
import { CreateRevenueEntryDto } from './dto/create-revenue-entry.dto';
import { UpdateRevenueEntryDto } from './dto/update-revenue-entry.dto';

@Injectable()
export class RevenueEntriesService {
  constructor(
    @InjectModel(RevenueEntry.name)
    private revenueEntryModel: Model<RevenueEntryDocument>,
  ) {}

  async create(createRevenueEntryDto: CreateRevenueEntryDto): Promise<RevenueEntry> {
    try {
      const revenueEntry = new this.revenueEntryModel(createRevenueEntryDto);
      return await revenueEntry.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Revenue entry ID already exists');
      }
      throw error;
    }
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    type?: RevenueType;
    status?: RevenueStatus;
    transactionId?: string;
    salesChannelId?: string;
    currency?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
    minAmount?: number;
    maxAmount?: number;
    region?: string;
    tags?: string[];
  }) {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      transactionId,
      salesChannelId,
      currency,
      startDate,
      endDate,
      isActive,
      minAmount,
      maxAmount,
      region,
      tags,
    } = options || {};

    const filter: any = {};

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    if (transactionId) {
      filter.transactionId = new Types.ObjectId(transactionId);
    }

    if (salesChannelId) {
      filter.salesChannelId = new Types.ObjectId(salesChannelId);
    }

    if (currency) {
      filter.currency = currency.toUpperCase();
    }

    if (region) {
      filter['analyticsData.region'] = { $regex: region, $options: 'i' };
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    if (startDate || endDate) {
      filter.recordedDate = {};
      if (startDate) filter.recordedDate.$gte = new Date(startDate);
      if (endDate) filter.recordedDate.$lte = new Date(endDate);
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      filter.amount = {};
      if (minAmount !== undefined) filter.amount.$gte = minAmount;
      if (maxAmount !== undefined) filter.amount.$lte = maxAmount;
    }

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.revenueEntryModel
        .find(filter)
        .populate('transactionId', 'transactionId type status customerName')
        .populate('salesChannelId', 'name type')
        .populate('productData.productId', 'name code category')
        .populate('productData.variantId', 'color size form sku')
        .sort({ recordedDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.revenueEntryModel.countDocuments(filter).exec(),
    ]);

    return {
      entries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<RevenueEntry> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid revenue entry ID');
    }

    const entry = await this.revenueEntryModel
      .findById(id)
      .populate('transactionId', 'transactionId type status customerName')
      .populate('salesChannelId', 'name type')
      .populate('productData.productId', 'name code category')
      .populate('productData.variantId', 'color size form sku')
      .exec();

    if (!entry) {
      throw new NotFoundException('Revenue entry not found');
    }

    return entry;
  }

  async findByEntryId(entryId: string): Promise<RevenueEntry | null> {
    return this.revenueEntryModel
      .findOne({ entryId: entryId.toUpperCase() })
      .populate('transactionId', 'transactionId type status customerName')
      .populate('salesChannelId', 'name type')
      .populate('productData.productId', 'name code category')
      .populate('productData.variantId', 'color size form sku')
      .exec();
  }

  async findByTransaction(transactionId: string): Promise<RevenueEntry[]> {
    if (!Types.ObjectId.isValid(transactionId)) {
      throw new BadRequestException('Invalid transaction ID');
    }

    return this.revenueEntryModel
      .find({
        transactionId: new Types.ObjectId(transactionId),
        isActive: true,
      })
      .populate('salesChannelId', 'name type')
      .populate('productData.productId', 'name code category')
      .populate('productData.variantId', 'color size form sku')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, updateRevenueEntryDto: UpdateRevenueEntryDto): Promise<RevenueEntry> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid revenue entry ID');
    }

    try {
      const entry = await this.revenueEntryModel
        .findByIdAndUpdate(id, updateRevenueEntryDto, { new: true, runValidators: true })
        .populate('transactionId', 'transactionId type status customerName')
        .populate('salesChannelId', 'name type')
        .populate('productData.productId', 'name code category')
        .populate('productData.variantId', 'color size form sku')
        .exec();

      if (!entry) {
        throw new NotFoundException('Revenue entry not found');
      }

      return entry;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Revenue entry ID already exists');
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: RevenueStatus): Promise<RevenueEntry> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid revenue entry ID');
    }

    const updateData: any = { status };

    // Set timestamps based on status
    if (status === RevenueStatus.CONFIRMED && !updateData.recordedDate) {
      updateData.recordedDate = new Date();
    }

    const entry = await this.revenueEntryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('transactionId', 'transactionId type status customerName')
      .populate('salesChannelId', 'name type')
      .populate('productData.productId', 'name code category')
      .populate('productData.variantId', 'color size form sku')
      .exec();

    if (!entry) {
      throw new NotFoundException('Revenue entry not found');
    }

    return entry;
  }

  async addTag(id: string, tag: string): Promise<RevenueEntry> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid revenue entry ID');
    }

    const entry = await this.revenueEntryModel
      .findByIdAndUpdate(id, { $addToSet: { tags: tag.trim().toLowerCase() } }, { new: true })
      .populate('transactionId', 'transactionId type status customerName')
      .populate('salesChannelId', 'name type')
      .exec();

    if (!entry) {
      throw new NotFoundException('Revenue entry not found');
    }

    return entry;
  }

  async removeTag(id: string, tag: string): Promise<RevenueEntry> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid revenue entry ID');
    }

    const entry = await this.revenueEntryModel
      .findByIdAndUpdate(id, { $pull: { tags: tag.trim().toLowerCase() } }, { new: true })
      .populate('transactionId', 'transactionId type status customerName')
      .populate('salesChannelId', 'name type')
      .exec();

    if (!entry) {
      throw new NotFoundException('Revenue entry not found');
    }

    return entry;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid revenue entry ID');
    }

    const result = await this.revenueEntryModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('Revenue entry not found');
    }
  }

  async softDelete(id: string): Promise<RevenueEntry> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid revenue entry ID');
    }

    const entry = await this.revenueEntryModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .populate('transactionId', 'transactionId type status customerName')
      .populate('salesChannelId', 'name type')
      .exec();

    if (!entry) {
      throw new NotFoundException('Revenue entry not found');
    }

    return entry;
  }

  async getRevenueAnalytics(options?: {
    type?: RevenueType;
    salesChannelId?: string;
    currency?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month' | 'year';
  }) {
    const { type, salesChannelId, currency, startDate, endDate, groupBy = 'month' } = options || {};

    const matchStage: any = {
      isActive: true,
      status: RevenueStatus.CONFIRMED,
    };

    if (type) matchStage.type = type;
    if (salesChannelId) matchStage.salesChannelId = new Types.ObjectId(salesChannelId);
    if (currency) matchStage.currency = currency.toUpperCase();
    if (startDate || endDate) {
      matchStage.recordedDate = {};
      if (startDate) matchStage.recordedDate.$gte = new Date(startDate);
      if (endDate) matchStage.recordedDate.$lte = new Date(endDate);
    }

    // Define grouping format based on groupBy parameter
    const groupFormats = {
      day: { $dateToString: { format: '%Y-%m-%d', date: '$recordedDate' } },
      week: { $dateToString: { format: '%Y-W%U', date: '$recordedDate' } },
      month: { $dateToString: { format: '%Y-%m', date: '$recordedDate' } },
      year: { $dateToString: { format: '%Y', date: '$recordedDate' } },
    };

    const analytics = await this.revenueEntryModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupFormats[groupBy],
          totalRevenue: { $sum: '$amount' },
          totalGross: { $sum: '$grossAmount' },
          totalCost: { $sum: '$costAmount' },
          totalNet: { $sum: '$netAmount' },
          totalFees: { $sum: '$feeAmount' },
          totalTax: { $sum: '$taxAmount' },
          entryCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          profitAmount: { $sum: { $subtract: ['$netAmount', '$feeAmount'] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Overall summary
    const summary = await this.revenueEntryModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalGross: { $sum: '$grossAmount' },
          totalCost: { $sum: '$costAmount' },
          totalNet: { $sum: '$netAmount' },
          totalFees: { $sum: '$feeAmount' },
          totalTax: { $sum: '$taxAmount' },
          totalEntries: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          profitAmount: { $sum: { $subtract: ['$netAmount', '$feeAmount'] } },
        },
      },
    ]);

    return {
      summary: summary[0] || {},
      timeline: analytics,
      groupBy,
    };
  }

  async getTopPerformingProducts(options?: {
    salesChannelId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const { salesChannelId, startDate, endDate, limit = 10 } = options || {};

    const matchStage: any = {
      isActive: true,
      status: RevenueStatus.CONFIRMED,
      type: RevenueType.SALE,
      'productData.productId': { $exists: true },
    };

    if (salesChannelId) matchStage.salesChannelId = new Types.ObjectId(salesChannelId);
    if (startDate || endDate) {
      matchStage.recordedDate = {};
      if (startDate) matchStage.recordedDate.$gte = new Date(startDate);
      if (endDate) matchStage.recordedDate.$lte = new Date(endDate);
    }

    return this.revenueEntryModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$productData.productId',
          totalRevenue: { $sum: '$amount' },
          totalQuantity: { $sum: '$productData.quantity' },
          averagePrice: { $avg: '$productData.unitPrice' },
          saleCount: { $sum: 1 },
          totalProfit: { $sum: { $subtract: ['$netAmount', '$costAmount'] } },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
    ]);
  }

  // Test helper methods
  async deleteAllForTesting(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('This method can only be used in test environment');
    }
    await this.revenueEntryModel.deleteMany({}).exec();
  }

  async createForTesting(data: Partial<RevenueEntry>): Promise<RevenueEntry> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('This method can only be used in test environment');
    }
    const entry = new this.revenueEntryModel(data);
    return entry.save();
  }
}
