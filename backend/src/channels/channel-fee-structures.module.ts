import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChannelFeeStructuresService } from './channel-fee-structures.service';
import { ChannelFeeStructuresController } from './channel-fee-structures.controller';
import {
  ChannelFeeStructure,
  ChannelFeeStructureSchema,
} from './schemas/channel-fee-structure.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChannelFeeStructure.name, schema: ChannelFeeStructureSchema },
    ]),
  ],
  controllers: [ChannelFeeStructuresController],
  providers: [ChannelFeeStructuresService],
  exports: [ChannelFeeStructuresService],
})
export class ChannelFeeStructuresModule {}
