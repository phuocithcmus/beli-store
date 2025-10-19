import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ChannelFeeStructure,
  ChannelFeeStructureDocument,
  FeeType,
  FeeCalculationType,
  FeeFrequency,
} from './schemas/channel-fee-structure.schema';
import { CreateChannelFeeStructureDto } from './dto/create-channel-fee-structure.dto';
import { UpdateChannelFeeStructureDto } from './dto/update-channel-fee-structure.dto';

@Injectable()
export class ChannelFeeStructuresService {
  constructor(
    @InjectModel(ChannelFeeStructure.name)
    private feeStructureModel: Model<ChannelFeeStructureDocument>,
  ) {}

  async create(createDto: CreateChannelFeeStructureDto): Promise<ChannelFeeStructure> {
    try {
      const feeStructure = new this.feeStructureModel(createDto);
      return await feeStructure.save();
    } catch (error) {
      if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`Fee structure ${duplicateField} already exists`);
      }
      throw error;
    }
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    channelId?: string;
    type?: FeeType;
    calculationType?: FeeCalculationType;
    frequency?: FeeFrequency;
    isActive?: boolean;
    currency?: string;
    search?: string;
    tags?: string[];
    effectiveDate?: string;
    sortBy?: 'name' | 'type' | 'totalAmount' | 'created';
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 10,
      channelId,
      type,
      calculationType,
      frequency,
      isActive,
      currency,
      search,
      tags,
      effectiveDate,
      sortBy = 'created',
      sortOrder = 'desc',
    } = options || {};

    const filter: any = {};

    if (channelId) {
      filter.channelId = new Types.ObjectId(channelId);
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (type) {
      filter.type = type;
    }

    if (calculationType) {
      filter.calculationType = calculationType;
    }

    if (frequency) {
      filter.frequency = frequency;
    }

    if (currency) {
      filter.currency = currency.toUpperCase();
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags.map(tag => tag.toLowerCase()) };
    }

    if (effectiveDate) {
      const date = new Date(effectiveDate);
      filter.$and = [
        { $or: [{ effectiveFrom: { $lte: date } }, { effectiveFrom: null }] },
        { $or: [{ effectiveTo: { $gte: date } }, { effectiveTo: null }] },
      ];
    }

    // Sort configuration
    const sortConfig: any = {};
    switch (sortBy) {
      case 'name':
        sortConfig.name = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'type':
        sortConfig.type = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'totalAmount':
        sortConfig['statistics.totalAmount'] = sortOrder === 'asc' ? 1 : -1;
        break;
      default:
        sortConfig.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    const skip = (page - 1) * limit;

    const [feeStructures, total] = await Promise.all([
      this.feeStructureModel
        .find(filter)
        .populate('channelId', 'name code type')
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.feeStructureModel.countDocuments(filter).exec(),
    ]);

    return {
      feeStructures,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ChannelFeeStructure> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid fee structure ID');
    }

    const feeStructure = await this.feeStructureModel
      .findById(id)
      .populate('channelId', 'name code type')
      .exec();

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return feeStructure;
  }

  async findByCode(code: string): Promise<ChannelFeeStructure | null> {
    return this.feeStructureModel
      .findOne({ code: code.toUpperCase() })
      .populate('channelId', 'name code type')
      .exec();
  }

  async findByChannel(
    channelId: string,
    options?: {
      type?: FeeType;
      isActive?: boolean;
      effectiveDate?: Date;
    },
  ): Promise<ChannelFeeStructure[]> {
    if (!Types.ObjectId.isValid(channelId)) {
      throw new BadRequestException('Invalid channel ID');
    }

    const filter: any = { channelId: new Types.ObjectId(channelId) };

    if (options?.type) {
      filter.type = options.type;
    }

    if (options?.isActive !== undefined) {
      filter.isActive = options.isActive;
    }

    if (options?.effectiveDate) {
      filter.$and = [
        { $or: [{ effectiveFrom: { $lte: options.effectiveDate } }, { effectiveFrom: null }] },
        { $or: [{ effectiveTo: { $gte: options.effectiveDate } }, { effectiveTo: null }] },
      ];
    }

    return this.feeStructureModel
      .find(filter)
      .populate('channelId', 'name code type')
      .sort({ type: 1, createdAt: -1 })
      .exec();
  }

  async update(id: string, updateDto: UpdateChannelFeeStructureDto): Promise<ChannelFeeStructure> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid fee structure ID');
    }

    try {
      const feeStructure = await this.feeStructureModel
        .findByIdAndUpdate(id, updateDto, { new: true, runValidators: true })
        .populate('channelId', 'name code type')
        .exec();

      if (!feeStructure) {
        throw new NotFoundException('Fee structure not found');
      }

      return feeStructure;
    } catch (error) {
      if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`Fee structure ${duplicateField} already exists`);
      }
      throw error;
    }
  }

  async updateStatistics(
    id: string,
    updates: {
      totalApplied?: number;
      totalAmount?: number;
      lastAppliedDate?: Date;
      applicationCount?: number;
    },
  ): Promise<ChannelFeeStructure> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid fee structure ID');
    }

    const updateData: any = {};

    if (updates.totalApplied !== undefined) {
      updateData['statistics.totalApplied'] = updates.totalApplied;
    }

    if (updates.totalAmount !== undefined) {
      updateData['statistics.totalAmount'] = updates.totalAmount;
    }

    if (updates.lastAppliedDate) {
      updateData['statistics.lastAppliedDate'] = updates.lastAppliedDate;
    }

    if (updates.applicationCount !== undefined) {
      updateData['statistics.applicationCount'] = updates.applicationCount;
    }

    // Calculate average fee amount
    const feeStructure = await this.feeStructureModel.findById(id).exec();
    if (
      feeStructure &&
      updates.totalAmount !== undefined &&
      updates.applicationCount !== undefined
    ) {
      updateData['statistics.averageFeeAmount'] =
        updates.applicationCount > 0 ? updates.totalAmount / updates.applicationCount : 0;
    }

    const updatedFeeStructure = await this.feeStructureModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('channelId', 'name code type')
      .exec();

    if (!updatedFeeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return updatedFeeStructure;
  }

  async incrementStatistics(
    id: string,
    increments: {
      applied?: number;
      amount?: number;
    },
  ): Promise<ChannelFeeStructure> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid fee structure ID');
    }

    const incData: any = {};

    if (increments.applied) {
      incData['statistics.totalApplied'] = increments.applied;
      incData['statistics.applicationCount'] = increments.applied;
    }

    if (increments.amount) {
      incData['statistics.totalAmount'] = increments.amount;
    }

    const feeStructure = await this.feeStructureModel
      .findByIdAndUpdate(
        id,
        {
          $inc: incData,
          $set: { 'statistics.lastAppliedDate': new Date() },
        },
        { new: true },
      )
      .populate('channelId', 'name code type')
      .exec();

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    // Recalculate average fee amount
    if (feeStructure.statistics.applicationCount > 0) {
      feeStructure.statistics.averageFeeAmount =
        feeStructure.statistics.totalAmount / feeStructure.statistics.applicationCount;
      await feeStructure.save();
    }

    return feeStructure;
  }

  async calculateFee(
    id: string,
    amount: number,
    context?: any,
  ): Promise<{
    feeStructure: ChannelFeeStructure;
    calculatedFee: number;
    breakdown: any;
  }> {
    const feeStructure = await this.findOne(id);

    try {
      const calculatedFee = (feeStructure as any).calculateFee(amount, context);

      const breakdown = {
        originalAmount: amount,
        feeType: feeStructure.type,
        calculationType: feeStructure.calculationType,
        appliedPercentage: feeStructure.percentage,
        appliedFlatFee: feeStructure.flatFee,
        minimumFee: feeStructure.minimumFee,
        maximumFee: feeStructure.maximumFee,
        finalFee: calculatedFee,
      };

      return {
        feeStructure,
        calculatedFee,
        breakdown,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async addTag(id: string, tag: string): Promise<ChannelFeeStructure> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid fee structure ID');
    }

    const feeStructure = await this.feeStructureModel
      .findByIdAndUpdate(id, { $addToSet: { tags: tag.trim().toLowerCase() } }, { new: true })
      .populate('channelId', 'name code type')
      .exec();

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return feeStructure;
  }

  async removeTag(id: string, tag: string): Promise<ChannelFeeStructure> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid fee structure ID');
    }

    const feeStructure = await this.feeStructureModel
      .findByIdAndUpdate(id, { $pull: { tags: tag.trim().toLowerCase() } }, { new: true })
      .populate('channelId', 'name code type')
      .exec();

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return feeStructure;
  }

  async addChangeLogEntry(
    id: string,
    change: string,
    updatedBy: string,
  ): Promise<ChannelFeeStructure> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid fee structure ID');
    }

    const feeStructure = await this.feeStructureModel
      .findByIdAndUpdate(
        id,
        {
          $push: {
            'metadata.changeLog': {
              date: new Date(),
              change,
              updatedBy,
            },
          },
          $set: { 'metadata.lastUpdatedBy': updatedBy },
        },
        { new: true },
      )
      .populate('channelId', 'name code type')
      .exec();

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return feeStructure;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid fee structure ID');
    }

    const result = await this.feeStructureModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('Fee structure not found');
    }
  }

  async softDelete(id: string): Promise<ChannelFeeStructure> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid fee structure ID');
    }

    const feeStructure = await this.feeStructureModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .populate('channelId', 'name code type')
      .exec();

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return feeStructure;
  }

  async getFeeAnalytics(options?: {
    channelId?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: 'type' | 'calculationType' | 'frequency' | 'channel';
  }) {
    const { channelId, startDate, endDate, groupBy } = options || {};

    const matchStage: any = { isActive: true };

    if (channelId) {
      matchStage.channelId = new Types.ObjectId(channelId);
    }

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    let groupField = '$type';
    if (groupBy === 'calculationType') groupField = '$calculationType';
    if (groupBy === 'frequency') groupField = '$frequency';
    if (groupBy === 'channel') groupField = '$channelId';

    const analytics = await this.feeStructureModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupField,
          feeStructureCount: { $sum: 1 },
          totalFeesCollected: { $sum: '$statistics.totalAmount' },
          totalApplications: { $sum: '$statistics.applicationCount' },
          averageFeeAmount: { $avg: '$statistics.averageFeeAmount' },
          maxFeeAmount: { $max: '$statistics.totalAmount' },
          minFeeAmount: { $min: '$statistics.totalAmount' },
        },
      },
      { $sort: { totalFeesCollected: -1 } },
    ]);

    // Overall summary
    const summary = await this.feeStructureModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalFeeStructures: { $sum: 1 },
          activeFeeStructures: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          totalFeesCollected: { $sum: '$statistics.totalAmount' },
          totalApplications: { $sum: '$statistics.applicationCount' },
          averageFeePerStructure: { $avg: '$statistics.totalAmount' },
        },
      },
    ]);

    return {
      summary: summary[0] || {},
      breakdown: analytics,
      groupBy: groupBy || 'type',
    };
  }

  async getActiveByChannel(
    channelId: string,
    effectiveDate?: Date,
  ): Promise<ChannelFeeStructure[]> {
    return this.findByChannel(channelId, {
      isActive: true,
      effectiveDate: effectiveDate || new Date(),
    });
  }

  // Test helper methods
  async deleteAllForTesting(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('This method can only be used in test environment');
    }
    await this.feeStructureModel.deleteMany({}).exec();
  }

  async createForTesting(data: Partial<ChannelFeeStructure>): Promise<ChannelFeeStructure> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('This method can only be used in test environment');
    }
    const feeStructure = new this.feeStructureModel(data);
    return feeStructure.save();
  }
}
