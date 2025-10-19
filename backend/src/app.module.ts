import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { ProductVariantsModule } from './variants/product-variants.module';
import { ImportPhasesModule } from './imports/import-phases.module';
import { TransactionsModule } from './transactions/transactions.module';
import { RevenueEntriesModule } from './revenue/revenue-entries.module';
import { ChannelsModule } from './channels/channels.module';
import { ValidationModule } from './validation/validation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env.local', '.env'],
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/clothing_store_dev',
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),
    AuthModule,
    ProductsModule,
    ProductVariantsModule,
    ImportPhasesModule,
    TransactionsModule,
    RevenueEntriesModule,
    ChannelsModule,
    ValidationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
