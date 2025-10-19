import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
  TransactionType,
  TransactionStatus,
} from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    try {
      const transaction = new this.transactionModel(createTransactionDto);
      return await transaction.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Transaction ID already exists');
      }
      throw error;
    }
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    type?: TransactionType;
    status?: TransactionStatus;
    customerEmail?: string;
    salesChannelId?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
    minAmount?: number;
    maxAmount?: number;
  }) {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      customerEmail,
      salesChannelId,
      startDate,
      endDate,
      isActive,
      minAmount,
      maxAmount,
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

    if (customerEmail) {
      filter.customerEmail = { $regex: customerEmail, $options: 'i' };
    }

    if (salesChannelId) {
      filter.salesChannelId = new Types.ObjectId(salesChannelId);
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      filter.netAmount = {};
      if (minAmount !== undefined) filter.netAmount.$gte = minAmount;
      if (maxAmount !== undefined) filter.netAmount.$lte = maxAmount;
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .populate('items.productId', 'name code category')
        .populate('items.variantId', 'color size form sku')
        .populate('salesChannelId', 'name type')
        .populate('relatedTransactionId', 'transactionId type status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(filter).exec(),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Transaction> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID');
    }

    const transaction = await this.transactionModel
      .findById(id)
      .populate('items.productId', 'name code category')
      .populate('items.variantId', 'color size form sku')
      .populate('salesChannelId', 'name type')
      .populate('relatedTransactionId', 'transactionId type status')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async findByTransactionId(transactionId: string): Promise<Transaction | null> {
    return this.transactionModel
      .findOne({ transactionId: transactionId.toUpperCase() })
      .populate('items.productId', 'name code category')
      .populate('items.variantId', 'color size form sku')
      .populate('salesChannelId', 'name type')
      .populate('relatedTransactionId', 'transactionId type status')
      .exec();
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID');
    }

    // Validate status transitions
    if (updateTransactionDto.status) {
      const currentTransaction = await this.transactionModel.findById(id).exec();
      if (
        currentTransaction &&
        !this.isValidStatusTransition(currentTransaction.status, updateTransactionDto.status)
      ) {
        throw new BadRequestException(
          `Invalid status transition from ${currentTransaction.status} to ${updateTransactionDto.status}`,
        );
      }
    }

    try {
      const transaction = await this.transactionModel
        .findByIdAndUpdate(id, updateTransactionDto, { new: true, runValidators: true })
        .populate('items.productId', 'name code category')
        .populate('items.variantId', 'color size form sku')
        .populate('salesChannelId', 'name type')
        .populate('relatedTransactionId', 'transactionId type status')
        .exec();

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      return transaction;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Transaction ID already exists');
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID');
    }

    const currentTransaction = await this.transactionModel.findById(id).exec();
    if (!currentTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (!this.isValidStatusTransition(currentTransaction.status, status)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentTransaction.status} to ${status}`,
      );
    }

    const updateData: any = { status };

    // Set processedAt timestamp when completing transaction
    if (status === TransactionStatus.COMPLETED && !currentTransaction.processedAt) {
      updateData.processedAt = new Date();
    }

    const transaction = await this.transactionModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('items.productId', 'name code category')
      .populate('items.variantId', 'color size form sku')
      .populate('salesChannelId', 'name type')
      .populate('relatedTransactionId', 'transactionId type status')
      .exec();

    return transaction!;
  }

  async addItem(id: string, item: any): Promise<Transaction> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID');
    }

    const transaction = await this.transactionModel
      .findByIdAndUpdate(
        id,
        {
          $push: { items: item },
          $inc: {
            totalAmount: item.totalPrice,
            discountAmount: item.discount || 0,
            taxAmount: item.tax || 0,
            netAmount: item.totalPrice - (item.discount || 0) + (item.tax || 0),
          },
        },
        { new: true },
      )
      .populate('items.productId', 'name code category')
      .populate('items.variantId', 'color size form sku')
      .populate('salesChannelId', 'name type')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async removeItem(id: string, itemIndex: number): Promise<Transaction> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID');
    }

    const transaction = await this.transactionModel.findById(id).exec();
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (itemIndex < 0 || itemIndex >= transaction.items.length) {
      throw new BadRequestException('Invalid item index');
    }

    const item = transaction.items[itemIndex];

    transaction.items.splice(itemIndex, 1);
    transaction.totalAmount -= item.totalPrice;
    transaction.discountAmount -= item.discount || 0;
    transaction.taxAmount -= item.tax || 0;
    transaction.netAmount =
      transaction.totalAmount - transaction.discountAmount + transaction.taxAmount;

    const updatedTransaction = await transaction.save();

    await updatedTransaction.populate('items.productId', 'name code category');
    await updatedTransaction.populate('items.variantId', 'color size form sku');
    await updatedTransaction.populate('salesChannelId', 'name type');

    return updatedTransaction;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID');
    }

    const result = await this.transactionModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('Transaction not found');
    }
  }

  async softDelete(id: string): Promise<Transaction> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID');
    }

    const transaction = await this.transactionModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .populate('items.productId', 'name code category')
      .populate('items.variantId', 'color size form sku')
      .populate('salesChannelId', 'name type')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async getTransactionStats(options?: {
    type?: TransactionType;
    salesChannelId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { type, salesChannelId, startDate, endDate } = options || {};

    const matchStage: any = { isActive: true };

    if (type) matchStage.type = type;
    if (salesChannelId) matchStage.salesChannelId = new Types.ObjectId(salesChannelId);
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const stats = await this.transactionModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$type', TransactionType.SALE] }, '$netAmount', 0] },
          },
          totalPurchases: {
            $sum: { $cond: [{ $eq: ['$type', TransactionType.PURCHASE] }, '$netAmount', 0] },
          },
          totalRefunds: {
            $sum: { $cond: [{ $eq: ['$type', TransactionType.REFUND] }, '$netAmount', 0] },
          },
          averageTransactionValue: { $avg: '$netAmount' },
          totalTax: { $sum: '$taxAmount' },
          totalDiscount: { $sum: '$discountAmount' },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', TransactionStatus.PENDING] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', TransactionStatus.COMPLETED] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', TransactionStatus.CANCELLED] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', TransactionStatus.FAILED] }, 1, 0] },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalTransactions: 0,
        totalRevenue: 0,
        totalPurchases: 0,
        totalRefunds: 0,
        averageTransactionValue: 0,
        totalTax: 0,
        totalDiscount: 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
        failed: 0,
      }
    );
  }

  async getCustomerTransactions(customerEmail: string): Promise<Transaction[]> {
    return this.transactionModel
      .find({
        isActive: true,
        customerEmail: { $regex: customerEmail, $options: 'i' },
      })
      .populate('items.productId', 'name code category')
      .populate('items.variantId', 'color size form sku')
      .populate('salesChannelId', 'name type')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getRelatedTransactions(transactionId: string): Promise<Transaction[]> {
    if (!Types.ObjectId.isValid(transactionId)) {
      throw new BadRequestException('Invalid transaction ID');
    }

    return this.transactionModel
      .find({
        isActive: true,
        relatedTransactionId: new Types.ObjectId(transactionId),
      })
      .populate('items.productId', 'name code category')
      .populate('items.variantId', 'color size form sku')
      .populate('salesChannelId', 'name type')
      .sort({ createdAt: -1 })
      .exec();
  }

  private isValidStatusTransition(
    currentStatus: TransactionStatus,
    newStatus: TransactionStatus,
  ): boolean {
    const transitions: Record<TransactionStatus, TransactionStatus[]> = {
      [TransactionStatus.PENDING]: [
        TransactionStatus.COMPLETED,
        TransactionStatus.CANCELLED,
        TransactionStatus.FAILED,
      ],
      [TransactionStatus.COMPLETED]: [TransactionStatus.REFUNDED], // Can only be refunded
      [TransactionStatus.CANCELLED]: [], // Terminal state
      [TransactionStatus.FAILED]: [TransactionStatus.PENDING], // Can retry
      [TransactionStatus.REFUNDED]: [], // Terminal state
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
  }

  // Test helper methods
  async deleteAllForTesting(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('This method can only be used in test environment');
    }
    await this.transactionModel.deleteMany({}).exec();
  }

  async createForTesting(data: Partial<Transaction>): Promise<Transaction> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('This method can only be used in test environment');
    }
    const transaction = new this.transactionModel(data);
    return transaction.save();
  }
}
