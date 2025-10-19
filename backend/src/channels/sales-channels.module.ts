import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesChannelsService } from './sales-channels.service';
import { SalesChannelsController } from './sales-channels.controller';
import { SalesChannel, SalesChannelSchema } from './schemas/sales-channel.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: SalesChannel.name, schema: SalesChannelSchema }])],
  controllers: [SalesChannelsController],
  providers: [SalesChannelsService],
  exports: [SalesChannelsService],
})
export class SalesChannelsModule {}
