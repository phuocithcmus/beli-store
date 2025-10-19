import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RevenueEntriesService } from './revenue-entries.service';
import { RevenueEntriesController } from './revenue-entries.controller';
import { RevenueEntry, RevenueEntrySchema } from './schemas/revenue-entry.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RevenueEntry.name, schema: RevenueEntrySchema }]),
    AuthModule,
  ],
  controllers: [RevenueEntriesController],
  providers: [RevenueEntriesService],
  exports: [RevenueEntriesService],
})
export class RevenueEntriesModule {}
