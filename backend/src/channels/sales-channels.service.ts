import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SalesChannel,
  SalesChannelDocument,
  ChannelType,
  ChannelStatus,
} from './schemas/sales-channel.schema';
import { CreateSalesChannelDto } from './dto/create-sales-channel.dto';
import { UpdateSalesChannelDto } from './dto/update-sales-channel.dto';

@Injectable()
export class SalesChannelsService {
  constructor(
    @InjectModel(SalesChannel.name)
    private salesChannelModel: Model<SalesChannelDocument>,
  ) {}

  async create(createSalesChannelDto: CreateSalesChannelDto): Promise<SalesChannel> {
    try {
      const salesChannel = new this.salesChannelModel(createSalesChannelDto);
      return await salesChannel.save();
    } catch (error) {
      if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`Sales channel ${duplicateField} already exists`);
      }
      throw error;
    }
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    type?: ChannelType;
    status?: ChannelStatus;
    isActive?: boolean;
    search?: string;
    tags?: string[];
    minRevenue?: number;
    maxRevenue?: number;
    sortBy?: 'name' | 'revenue' | 'orders' | 'created';
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      isActive,
      search,
      tags,
      minRevenue,
      maxRevenue,
      sortBy = 'created',
      sortOrder = 'desc',
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

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    if (minRevenue !== undefined || maxRevenue !== undefined) {
      filter['statistics.totalRevenue'] = {};
      if (minRevenue !== undefined) filter['statistics.totalRevenue'].$gte = minRevenue;
      if (maxRevenue !== undefined) filter['statistics.totalRevenue'].$lte = maxRevenue;
    }

    // Sort configuration
    const sortConfig: any = {};
    switch (sortBy) {
      case 'name':
        sortConfig.name = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'revenue':
        sortConfig['statistics.totalRevenue'] = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'orders':
        sortConfig['statistics.totalOrders'] = sortOrder === 'asc' ? 1 : -1;
        break;
      default:
        sortConfig.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    const skip = (page - 1) * limit;

    const [channels, total] = await Promise.all([
      this.salesChannelModel.find(filter).sort(sortConfig).skip(skip).limit(limit).exec(),
      this.salesChannelModel.countDocuments(filter).exec(),
    ]);

    return {
      channels,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<SalesChannel> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sales channel ID');
    }

    const channel = await this.salesChannelModel.findById(id).exec();

    if (!channel) {
      throw new NotFoundException('Sales channel not found');
    }

    return channel;
  }

  async findByCode(code: string): Promise<SalesChannel | null> {
    return this.salesChannelModel.findOne({ code: code.toUpperCase() }).exec();
  }

  async findByName(name: string): Promise<SalesChannel | null> {
    return this.salesChannelModel.findOne({ name: { $regex: `^${name}$`, $options: 'i' } }).exec();
  }

  async update(id: string, updateSalesChannelDto: UpdateSalesChannelDto): Promise<SalesChannel> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sales channel ID');
    }

    try {
      const channel = await this.salesChannelModel
        .findByIdAndUpdate(id, updateSalesChannelDto, { new: true, runValidators: true })
        .exec();

      if (!channel) {
        throw new NotFoundException('Sales channel not found');
      }

      return channel;
    } catch (error) {
      if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`Sales channel ${duplicateField} already exists`);
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: ChannelStatus): Promise<SalesChannel> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sales channel ID');
    }

    const channel = await this.salesChannelModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!channel) {
      throw new NotFoundException('Sales channel not found');
    }

    return channel;
  }

  async updateStatistics(
    id: string,
    updates: {
      totalSales?: number;
      totalOrders?: number;
      totalRevenue?: number;
      lastSaleDate?: Date;
      lastOrderDate?: Date;
    },
  ): Promise<SalesChannel> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sales channel ID');
    }

    const updateData: any = {};

    if (updates.totalSales !== undefined) {
      updateData['statistics.totalSales'] = updates.totalSales;
    }

    if (updates.totalOrders !== undefined) {
      updateData['statistics.totalOrders'] = updates.totalOrders;
    }

    if (updates.totalRevenue !== undefined) {
      updateData['statistics.totalRevenue'] = updates.totalRevenue;
    }

    if (updates.lastSaleDate) {
      updateData['statistics.lastSaleDate'] = updates.lastSaleDate;
    }

    if (updates.lastOrderDate) {
      updateData['statistics.lastOrderDate'] = updates.lastOrderDate;
    }

    // Calculate average order value
    const channel = await this.salesChannelModel.findById(id).exec();
    if (channel && updates.totalRevenue !== undefined && updates.totalOrders !== undefined) {
      updateData['statistics.averageOrderValue'] =
        updates.totalOrders > 0 ? updates.totalRevenue / updates.totalOrders : 0;
    }

    const updatedChannel = await this.salesChannelModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedChannel) {
      throw new NotFoundException('Sales channel not found');
    }

    return updatedChannel;
  }

  async incrementStatistics(
    id: string,
    increments: {
      sales?: number;
      orders?: number;
      revenue?: number;
    },
  ): Promise<SalesChannel> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sales channel ID');
    }

    const incData: any = {};

    if (increments.sales) {
      incData['statistics.totalSales'] = increments.sales;
    }

    if (increments.orders) {
      incData['statistics.totalOrders'] = increments.orders;
    }

    if (increments.revenue) {
      incData['statistics.totalRevenue'] = increments.revenue;
    }

    const channel = await this.salesChannelModel
      .findByIdAndUpdate(
        id,
        {
          $inc: incData,
          $set: { 'statistics.lastSaleDate': new Date() },
        },
        { new: true },
      )
      .exec();

    if (!channel) {
      throw new NotFoundException('Sales channel not found');
    }

    // Recalculate average order value
    if (channel.statistics.totalOrders > 0) {
      channel.statistics.averageOrderValue =
        channel.statistics.totalRevenue / channel.statistics.totalOrders;
      await channel.save();
    }

    return channel;
  }

  async addTag(id: string, tag: string): Promise<SalesChannel> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sales channel ID');
    }

    const channel = await this.salesChannelModel
      .findByIdAndUpdate(id, { $addToSet: { tags: tag.trim().toLowerCase() } }, { new: true })
      .exec();

    if (!channel) {
      throw new NotFoundException('Sales channel not found');
    }

    return channel;
  }

  async removeTag(id: string, tag: string): Promise<SalesChannel> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sales channel ID');
    }

    const channel = await this.salesChannelModel
      .findByIdAndUpdate(id, { $pull: { tags: tag.trim().toLowerCase() } }, { new: true })
      .exec();

    if (!channel) {
      throw new NotFoundException('Sales channel not found');
    }

    return channel;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sales channel ID');
    }

    const result = await this.salesChannelModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('Sales channel not found');
    }
  }

  async softDelete(id: string): Promise<SalesChannel> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sales channel ID');
    }

    const channel = await this.salesChannelModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!channel) {
      throw new NotFoundException('Sales channel not found');
    }

    return channel;
  }

  async getChannelAnalytics(options?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'type' | 'status';
  }) {
    const { startDate, endDate, groupBy } = options || {};

    const matchStage: any = { isActive: true };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    let groupField = '$type';
    if (groupBy === 'status') groupField = '$status';

    const analytics = await this.salesChannelModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupField,
          channelCount: { $sum: 1 },
          totalRevenue: { $sum: '$statistics.totalRevenue' },
          totalOrders: { $sum: '$statistics.totalOrders' },
          totalSales: { $sum: '$statistics.totalSales' },
          averageRevenue: { $avg: '$statistics.totalRevenue' },
          averageOrders: { $avg: '$statistics.totalOrders' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Overall summary
    const summary = await this.salesChannelModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalChannels: { $sum: 1 },
          activeChannels: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          totalRevenue: { $sum: '$statistics.totalRevenue' },
          totalOrders: { $sum: '$statistics.totalOrders' },
          totalSales: { $sum: '$statistics.totalSales' },
          averageRevenuePerChannel: { $avg: '$statistics.totalRevenue' },
        },
      },
    ]);

    return {
      summary: summary[0] || {},
      breakdown: analytics,
      groupBy: groupBy || 'type',
    };
  }

  async getTopPerformingChannels(limit: number = 10): Promise<SalesChannel[]> {
    return this.salesChannelModel
      .find({ isActive: true, status: ChannelStatus.ACTIVE })
      .sort({ 'statistics.totalRevenue': -1 })
      .limit(limit)
      .exec();
  }

  async getChannelsByType(type: ChannelType): Promise<SalesChannel[]> {
    return this.salesChannelModel
      .find({ type, isActive: true })
      .sort({ 'statistics.totalRevenue': -1 })
      .exec();
  }

  // Test helper methods
  async deleteAllForTesting(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('This method can only be used in test environment');
    }
    await this.salesChannelModel.deleteMany({}).exec();
  }

  async createForTesting(data: Partial<SalesChannel>): Promise<SalesChannel> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('This method can only be used in test environment');
    }
    const channel = new this.salesChannelModel(data);
    return channel.save();
  }
}
