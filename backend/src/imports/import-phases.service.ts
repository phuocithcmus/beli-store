import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ImportPhase, ImportPhaseDocument, ImportStatus } from './schemas/import-phase.schema';
import { CreateImportPhaseDto } from './dto/create-import-phase.dto';
import { UpdateImportPhaseDto } from './dto/update-import-phase.dto';

@Injectable()
export class ImportPhasesService {
  constructor(
    @InjectModel(ImportPhase.name)
    private importPhaseModel: Model<ImportPhaseDocument>,
  ) {}

  async create(createImportPhaseDto: CreateImportPhaseDto): Promise<ImportPhase> {
    try {
      const importPhase = new this.importPhaseModel(createImportPhaseDto);
      return await importPhase.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Batch ID already exists');
      }
      throw error;
    }
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    status?: ImportStatus;
    supplierName?: string;
    batchId?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
    overdue?: boolean;
  }) {
    const {
      page = 1,
      limit = 10,
      status,
      supplierName,
      batchId,
      isActive,
      startDate,
      endDate,
      overdue,
    } = options || {};

    const filter: any = {};

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (status) {
      filter.status = status;
    }

    if (supplierName) {
      filter.supplierName = { $regex: supplierName, $options: 'i' };
    }

    if (batchId) {
      filter.batchId = { $regex: batchId, $options: 'i' };
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (overdue) {
      filter.expectedDeliveryDate = { $lt: new Date() };
      filter.status = { $nin: [ImportStatus.COMPLETED, ImportStatus.CANCELLED] };
    }

    const skip = (page - 1) * limit;

    const [imports, total] = await Promise.all([
      this.importPhaseModel
        .find(filter)
        .populate('items.productId', 'name code category')
        .populate('items.variantId', 'color size form sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.importPhaseModel.countDocuments(filter).exec(),
    ]);

    return {
      imports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ImportPhase> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid import phase ID');
    }

    const importPhase = await this.importPhaseModel
      .findById(id)
      .populate('items.productId', 'name code category')
      .populate('items.variantId', 'color size form sku')
      .exec();

    if (!importPhase) {
      throw new NotFoundException('Import phase not found');
    }

    return importPhase;
  }

  async findByBatchId(batchId: string): Promise<ImportPhase | null> {
    return this.importPhaseModel
      .findOne({ batchId: batchId.toUpperCase() })
      .populate('items.productId', 'name code category')
      .populate('items.variantId', 'color size form sku')
      .exec();
  }

  async update(id: string, updateImportPhaseDto: UpdateImportPhaseDto): Promise<ImportPhase> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid import phase ID');
    }

    // Validate status transitions
    if (updateImportPhaseDto.status) {
      const currentPhase = await this.importPhaseModel.findById(id).exec();
      if (
        currentPhase &&
        !this.isValidStatusTransition(currentPhase.status, updateImportPhaseDto.status)
      ) {
        throw new BadRequestException(
          `Invalid status transition from ${currentPhase.status} to ${updateImportPhaseDto.status}`,
        );
      }
    }

    try {
      const importPhase = await this.importPhaseModel
        .findByIdAndUpdate(id, updateImportPhaseDto, { new: true, runValidators: true })
        .populate('items.productId', 'name code category')
        .populate('items.variantId', 'color size form sku')
        .exec();

      if (!importPhase) {
        throw new NotFoundException('Import phase not found');
      }

      return importPhase;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Batch ID already exists');
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: ImportStatus): Promise<ImportPhase> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid import phase ID');
    }

    const currentPhase = await this.importPhaseModel.findById(id).exec();
    if (!currentPhase) {
      throw new NotFoundException('Import phase not found');
    }

    if (!this.isValidStatusTransition(currentPhase.status, status)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentPhase.status} to ${status}`,
      );
    }

    const updateData: any = { status };
    const now = new Date();

    // Set appropriate timestamps based on status
    switch (status) {
      case ImportStatus.IN_PROGRESS:
        if (!currentPhase.startedAt) updateData.startedAt = now;
        break;
      case ImportStatus.COMPLETED:
        if (!currentPhase.completedAt) updateData.completedAt = now;
        if (!currentPhase.actualDeliveryDate) updateData.actualDeliveryDate = now;
        break;
      case ImportStatus.CANCELLED:
        if (!currentPhase.cancelledAt) updateData.cancelledAt = now;
        break;
    }

    const importPhase = await this.importPhaseModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('items.productId', 'name code category')
      .populate('items.variantId', 'color size form sku')
      .exec();

    return importPhase!;
  }

  async addItem(id: string, item: any): Promise<ImportPhase> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid import phase ID');
    }

    const importPhase = await this.importPhaseModel
      .findByIdAndUpdate(
        id,
        {
          $push: { items: item },
          $inc: {
            totalCost: item.totalCost,
            totalQuantity: item.quantity,
          },
        },
        { new: true },
      )
      .populate('items.productId', 'name code category')
      .populate('items.variantId', 'color size form sku')
      .exec();

    if (!importPhase) {
      throw new NotFoundException('Import phase not found');
    }

    return importPhase;
  }

  async removeItem(id: string, itemIndex: number): Promise<ImportPhase> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid import phase ID');
    }

    const importPhase = await this.importPhaseModel.findById(id).exec();
    if (!importPhase) {
      throw new NotFoundException('Import phase not found');
    }

    if (itemIndex < 0 || itemIndex >= importPhase.items.length) {
      throw new BadRequestException('Invalid item index');
    }

    const item = importPhase.items[itemIndex];

    importPhase.items.splice(itemIndex, 1);
    importPhase.totalCost -= item.totalCost;
    importPhase.totalQuantity -= item.quantity;

    const updatedPhase = await importPhase.save();

    await updatedPhase.populate('items.productId', 'name code category');
    await updatedPhase.populate('items.variantId', 'color size form sku');

    return updatedPhase;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid import phase ID');
    }

    const result = await this.importPhaseModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('Import phase not found');
    }
  }

  async softDelete(id: string): Promise<ImportPhase> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid import phase ID');
    }

    const importPhase = await this.importPhaseModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .populate('items.productId', 'name code category')
      .populate('items.variantId', 'color size form sku')
      .exec();

    if (!importPhase) {
      throw new NotFoundException('Import phase not found');
    }

    return importPhase;
  }

  async getImportStats(supplierId?: string) {
    const matchStage: any = { isActive: true };
    if (supplierId) {
      matchStage.supplierName = { $regex: supplierId, $options: 'i' };
    }

    const stats = await this.importPhaseModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalImports: { $sum: 1 },
          totalCost: { $sum: '$totalCost' },
          totalQuantity: { $sum: '$totalQuantity' },
          averageCost: { $avg: '$totalCost' },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', ImportStatus.PENDING] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', ImportStatus.IN_PROGRESS] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', ImportStatus.COMPLETED] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', ImportStatus.CANCELLED] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', ImportStatus.FAILED] }, 1, 0] },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalImports: 0,
        totalCost: 0,
        totalQuantity: 0,
        averageCost: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        failed: 0,
      }
    );
  }

  async getOverdueImports(): Promise<ImportPhase[]> {
    const now = new Date();
    return this.importPhaseModel
      .find({
        isActive: true,
        expectedDeliveryDate: { $lt: now },
        status: { $nin: [ImportStatus.COMPLETED, ImportStatus.CANCELLED] },
      })
      .populate('items.productId', 'name code category')
      .populate('items.variantId', 'color size form sku')
      .sort({ expectedDeliveryDate: 1 })
      .exec();
  }

  async getImportsBySupplier(supplierName: string): Promise<ImportPhase[]> {
    return this.importPhaseModel
      .find({
        isActive: true,
        supplierName: { $regex: supplierName, $options: 'i' },
      })
      .populate('items.productId', 'name code category')
      .populate('items.variantId', 'color size form sku')
      .sort({ createdAt: -1 })
      .exec();
  }

  private isValidStatusTransition(currentStatus: ImportStatus, newStatus: ImportStatus): boolean {
    const transitions: Record<ImportStatus, ImportStatus[]> = {
      [ImportStatus.PENDING]: [ImportStatus.IN_PROGRESS, ImportStatus.CANCELLED],
      [ImportStatus.IN_PROGRESS]: [
        ImportStatus.COMPLETED,
        ImportStatus.FAILED,
        ImportStatus.CANCELLED,
      ],
      [ImportStatus.COMPLETED]: [], // Terminal state
      [ImportStatus.CANCELLED]: [], // Terminal state
      [ImportStatus.FAILED]: [ImportStatus.PENDING, ImportStatus.CANCELLED], // Can retry
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
  }

  // Test helper methods
  async deleteAllForTesting(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('This method can only be used in test environment');
    }
    await this.importPhaseModel.deleteMany({}).exec();
  }

  async createForTesting(data: Partial<ImportPhase>): Promise<ImportPhase> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('This method can only be used in test environment');
    }
    const importPhase = new this.importPhaseModel(data);
    return importPhase.save();
  }
}
