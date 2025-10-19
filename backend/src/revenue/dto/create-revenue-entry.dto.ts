import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  IsNotEmpty,
  Min,
  MaxLength,
  ValidateNested,
  IsDateString,
  IsISO4217CurrencyCode,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { RevenueType, RevenueStatus } from '../schemas/revenue-entry.schema';

export class ProductDataDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value ? (Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value) : undefined,
  )
  productId?: Types.ObjectId;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value ? (Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value) : undefined,
  )
  variantId?: Types.ObjectId;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  margin?: number;
}

export class AnalyticsDataDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.toLowerCase().trim())
  customerEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  segment?: string;
}

export class CreateRevenueEntryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.toUpperCase().trim())
  entryId?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value))
  transactionId: Types.ObjectId;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value ? (Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value) : undefined,
  )
  salesChannelId?: Types.ObjectId;

  @IsEnum(RevenueType)
  type: RevenueType;

  @IsOptional()
  @IsEnum(RevenueStatus)
  status?: RevenueStatus = RevenueStatus.PENDING;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  grossAmount: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  costAmount?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  netAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  feeAmount?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  taxAmount?: number = 0;

  @IsOptional()
  @IsString()
  @IsISO4217CurrencyCode()
  @Transform(({ value }) => value?.toUpperCase().trim())
  currency?: string = 'USD';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsOptional()
  @IsDateString()
  recordedDate?: string;

  @IsOptional()
  @IsDateString()
  settledDate?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ProductDataDto)
  productData?: ProductDataDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AnalyticsDataDto)
  analyticsData?: AnalyticsDataDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map(tag => tag.trim().toLowerCase()) : [],
  )
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
