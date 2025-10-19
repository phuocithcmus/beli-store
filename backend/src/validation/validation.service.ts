import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { ProductVariant, ProductVariantDocument } from '../variants/schemas/product-variant.schema';
import { ImportPhase, ImportPhaseDocument } from '../imports/schemas/import-phase.schema';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { RevenueEntry, RevenueEntryDocument } from '../revenue/schemas/revenue-entry.schema';
import { SalesChannel, SalesChannelDocument } from '../channels/schemas/sales-channel.schema';
import {
  ChannelFeeStructure,
  ChannelFeeStructureDocument,
} from '../channels/schemas/channel-fee-structure.schema';

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductVariant.name) private variantModel: Model<ProductVariantDocument>,
    @InjectModel(ImportPhase.name) private importModel: Model<ImportPhaseDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(RevenueEntry.name) private revenueModel: Model<RevenueEntryDocument>,
    @InjectModel(SalesChannel.name) private channelModel: Model<SalesChannelDocument>,
    @InjectModel(ChannelFeeStructure.name) private feeModel: Model<ChannelFeeStructureDocument>,
  ) {}

  async validateAllEntities(): Promise<{
    success: boolean;
    results: any;
    errors: string[];
  }> {
    const results: any = {};
    const errors: string[] = [];

    try {
      // Validate each entity
      this.logger.log('Starting entity validation...');

      // Check Products
      try {
        const productCount = await this.productModel.countDocuments().exec();
        results.products = { count: productCount, status: 'connected' };
        this.logger.log(`✅ Products: ${productCount} documents, connection OK`);
      } catch (error) {
        errors.push(`Products validation failed: ${error.message}`);
        results.products = { status: 'error', error: error.message };
      }

      // Check Product Variants
      try {
        const variantCount = await this.variantModel.countDocuments().exec();
        results.variants = { count: variantCount, status: 'connected' };
        this.logger.log(`✅ Product Variants: ${variantCount} documents, connection OK`);
      } catch (error) {
        errors.push(`Product Variants validation failed: ${error.message}`);
        results.variants = { status: 'error', error: error.message };
      }

      // Check Import Phases
      try {
        const importCount = await this.importModel.countDocuments().exec();
        results.imports = { count: importCount, status: 'connected' };
        this.logger.log(`✅ Import Phases: ${importCount} documents, connection OK`);
      } catch (error) {
        errors.push(`Import Phases validation failed: ${error.message}`);
        results.imports = { status: 'error', error: error.message };
      }

      // Check Transactions
      try {
        const transactionCount = await this.transactionModel.countDocuments().exec();
        results.transactions = { count: transactionCount, status: 'connected' };
        this.logger.log(`✅ Transactions: ${transactionCount} documents, connection OK`);
      } catch (error) {
        errors.push(`Transactions validation failed: ${error.message}`);
        results.transactions = { status: 'error', error: error.message };
      }

      // Check Revenue Entries
      try {
        const revenueCount = await this.revenueModel.countDocuments().exec();
        results.revenue = { count: revenueCount, status: 'connected' };
        this.logger.log(`✅ Revenue Entries: ${revenueCount} documents, connection OK`);
      } catch (error) {
        errors.push(`Revenue Entries validation failed: ${error.message}`);
        results.revenue = { status: 'error', error: error.message };
      }

      // Check Sales Channels
      try {
        const channelCount = await this.channelModel.countDocuments().exec();
        results.channels = { count: channelCount, status: 'connected' };
        this.logger.log(`✅ Sales Channels: ${channelCount} documents, connection OK`);
      } catch (error) {
        errors.push(`Sales Channels validation failed: ${error.message}`);
        results.channels = { status: 'error', error: error.message };
      }

      // Check Channel Fee Structures
      try {
        const feeCount = await this.feeModel.countDocuments().exec();
        results.feeStructures = { count: feeCount, status: 'connected' };
        this.logger.log(`✅ Channel Fee Structures: ${feeCount} documents, connection OK`);
      } catch (error) {
        errors.push(`Channel Fee Structures validation failed: ${error.message}`);
        results.feeStructures = { status: 'error', error: error.message };
      }

      // Validate indexes
      try {
        const indexes = await this.validateIndexes();
        results.indexes = indexes;
        this.logger.log(`✅ Database indexes validated`);
      } catch (error) {
        errors.push(`Index validation failed: ${error.message}`);
        results.indexes = { status: 'error', error: error.message };
      }

      const success = errors.length === 0;

      if (success) {
        this.logger.log('🎉 All entity validations passed successfully!');
      } else {
        this.logger.error(`❌ Validation completed with ${errors.length} errors`);
      }

      return { success, results, errors };
    } catch (error) {
      this.logger.error(`Validation process failed: ${error.message}`);
      return {
        success: false,
        results,
        errors: [...errors, `Validation process error: ${error.message}`],
      };
    }
  }

  private async validateIndexes(): Promise<any> {
    const indexResults: any = {};

    // Check Products indexes
    const productIndexes = await this.productModel.collection.getIndexes();
    indexResults.products = Object.keys(productIndexes).length;

    // Check Sales Channels indexes
    const channelIndexes = await this.channelModel.collection.getIndexes();
    indexResults.channels = Object.keys(channelIndexes).length;

    // Check Fee Structures indexes
    const feeIndexes = await this.feeModel.collection.getIndexes();
    indexResults.feeStructures = Object.keys(feeIndexes).length;

    return {
      status: 'validated',
      indexCounts: indexResults,
      totalIndexes: Object.values(indexResults).reduce(
        (sum: number, count: number) => sum + count,
        0,
      ),
    };
  }

  async validateReferentialIntegrity(): Promise<{
    success: boolean;
    results: any;
    issues: string[];
  }> {
    const results: any = {};
    const issues: string[] = [];

    try {
      this.logger.log('Starting referential integrity validation...');

      // Check Product-Variant relationships
      try {
        const productsWithoutVariants = await this.productModel.aggregate([
          {
            $lookup: {
              from: 'productvariants',
              localField: '_id',
              foreignField: 'productId',
              as: 'variants',
            },
          },
          {
            $match: {
              variants: { $size: 0 },
            },
          },
          {
            $count: 'count',
          },
        ]);

        const orphanedVariants = await this.variantModel.aggregate([
          {
            $lookup: {
              from: 'products',
              localField: 'productId',
              foreignField: '_id',
              as: 'product',
            },
          },
          {
            $match: {
              product: { $size: 0 },
            },
          },
          {
            $count: 'count',
          },
        ]);

        results.productVariantIntegrity = {
          productsWithoutVariants: productsWithoutVariants[0]?.count || 0,
          orphanedVariants: orphanedVariants[0]?.count || 0,
        };

        if (orphanedVariants[0]?.count > 0) {
          issues.push(`Found ${orphanedVariants[0].count} orphaned product variants`);
        }

        this.logger.log(`✅ Product-Variant integrity checked`);
      } catch (error) {
        issues.push(`Product-Variant integrity check failed: ${error.message}`);
      }

      // Check Channel-FeeStructure relationships
      try {
        const orphanedFeeStructures = await this.feeModel.aggregate([
          {
            $lookup: {
              from: 'saleschannels',
              localField: 'channelId',
              foreignField: '_id',
              as: 'channel',
            },
          },
          {
            $match: {
              channel: { $size: 0 },
            },
          },
          {
            $count: 'count',
          },
        ]);

        results.channelFeeIntegrity = {
          orphanedFeeStructures: orphanedFeeStructures[0]?.count || 0,
        };

        if (orphanedFeeStructures[0]?.count > 0) {
          issues.push(`Found ${orphanedFeeStructures[0].count} orphaned fee structures`);
        }

        this.logger.log(`✅ Channel-FeeStructure integrity checked`);
      } catch (error) {
        issues.push(`Channel-FeeStructure integrity check failed: ${error.message}`);
      }

      const success = issues.length === 0;

      if (success) {
        this.logger.log('🎉 Referential integrity validation passed!');
      } else {
        this.logger.warn(`⚠️ Found ${issues.length} referential integrity issues`);
      }

      return { success, results, issues };
    } catch (error) {
      this.logger.error(`Referential integrity validation failed: ${error.message}`);
      return {
        success: false,
        results,
        issues: [...issues, `Validation error: ${error.message}`],
      };
    }
  }

  async getSystemSummary(): Promise<any> {
    try {
      const [entityValidation, integrityValidation] = await Promise.all([
        this.validateAllEntities(),
        this.validateReferentialIntegrity(),
      ]);

      return {
        timestamp: new Date().toISOString(),
        system: {
          status: entityValidation.success && integrityValidation.success ? 'healthy' : 'issues',
          totalEntities: 7,
          entitiesImplemented: Object.keys(entityValidation.results).length,
        },
        entities: entityValidation.results,
        integrity: integrityValidation.results,
        summary: {
          totalErrors: entityValidation.errors.length,
          totalIssues: integrityValidation.issues.length,
          allHealthy: entityValidation.success && integrityValidation.success,
        },
        errors: entityValidation.errors,
        issues: integrityValidation.issues,
      };
    } catch (error) {
      this.logger.error(`System summary generation failed: ${error.message}`);
      throw error;
    }
  }
}
