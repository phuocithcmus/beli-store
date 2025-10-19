import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsDate,
  ValidateNested,
  IsMongoId,
  Min,
  Max,
  Length,
  Matches,
  ArrayMinSize,
  IsObject,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Types } from 'mongoose';
import {
  FeeType,
  FeeCalculationType,
  FeeFrequency,
  FeeTier,
  FeeCondition,
} from '../schemas/channel-fee-structure.schema';

class FeeTierDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  percentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  flatFee?: number;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  description?: string;
}

class FeeConditionDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  field: string;

  @IsString()
  @IsIn(['equals', 'greater_than', 'less_than', 'contains', 'in'])
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in';

  @IsNotEmpty()
  value: any;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  description?: string;
}

class MetadataDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  supportContact?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  documentationUrl?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastUpdatedBy?: string;
}

export class CreateChannelFeeStructureDto {
  @IsMongoId()
  @IsNotEmpty()
  @Transform(({ value }) => new Types.ObjectId(value))
  channelId: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'Code must contain only uppercase letters, numbers, underscores, and hyphens',
  })
  @Transform(({ value }) => value.toUpperCase())
  code: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  name: string;

  @IsEnum(FeeType)
  type: FeeType;

  @IsEnum(FeeCalculationType)
  calculationType: FeeCalculationType;

  @IsEnum(FeeFrequency)
  frequency: FeeFrequency;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  percentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  flatFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minimumFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maximumFee?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeTierDto)
  tiers?: FeeTier[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeConditionDto)
  conditions?: FeeCondition[];

  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter uppercase code' })
  @Transform(({ value }) => value?.toUpperCase())
  currency?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveFrom?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveTo?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map(tag => tag.toLowerCase().trim()) : [],
  )
  tags?: string[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MetadataDto)
  metadata?: {
    supportContact?: string;
    documentationUrl?: string;
    lastUpdatedBy?: string;
  };
}
