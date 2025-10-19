import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ValidationService } from './validation.service';
import { ValidationController } from './validation.controller';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { ProductVariant, ProductVariantSchema } from '../variants/schemas/product-variant.schema';
import { ImportPhase, ImportPhaseSchema } from '../imports/schemas/import-phase.schema';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { RevenueEntry, RevenueEntrySchema } from '../revenue/schemas/revenue-entry.schema';
import { SalesChannel, SalesChannelSchema } from '../channels/schemas/sales-channel.schema';
import {
  ChannelFeeStructure,
  ChannelFeeStructureSchema,
} from '../channels/schemas/channel-fee-structure.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
      { name: ImportPhase.name, schema: ImportPhaseSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: RevenueEntry.name, schema: RevenueEntrySchema },
      { name: SalesChannel.name, schema: SalesChannelSchema },
      { name: ChannelFeeStructure.name, schema: ChannelFeeStructureSchema },
    ]),
  ],
  controllers: [ValidationController],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
