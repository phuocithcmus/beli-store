import { PartialType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsObject,
  IsArray,
  Min,
  MaxLength,
  ValidateNested,
  IsDateString,
  IsISO4217CurrencyCode,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  CreateRevenueEntryDto,
  ProductDataDto,
  AnalyticsDataDto,
} from './create-revenue-entry.dto';
import { RevenueType, RevenueStatus } from '../schemas/revenue-entry.schema';
import { Types } from 'mongoose';

export class UpdateRevenueEntryDto extends PartialType(CreateRevenueEntryDto) {
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value ? (Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value) : undefined,
  )
  transactionId?: Types.ObjectId;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value ? (Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value) : undefined,
  )
  salesChannelId?: Types.ObjectId;

  @IsOptional()
  @IsEnum(RevenueType)
  type?: RevenueType;

  @IsOptional()
  @IsEnum(RevenueStatus)
  status?: RevenueStatus;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  grossAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  costAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  netAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  feeAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsString()
  @IsISO4217CurrencyCode()
  @Transform(({ value }) => value?.toUpperCase().trim())
  currency?: string;

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
