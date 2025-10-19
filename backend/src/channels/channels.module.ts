import { Module } from '@nestjs/common';
import { SalesChannelsModule } from './sales-channels.module';
import { ChannelFeeStructuresModule } from './channel-fee-structures.module';

@Module({
  imports: [SalesChannelsModule, ChannelFeeStructuresModule],
  exports: [SalesChannelsModule, ChannelFeeStructuresModule],
})
export class ChannelsModule {}
