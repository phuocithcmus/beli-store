import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsNotEmpty,
  Min,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { ImportStatus } from '../schemas/import-phase.schema';

export class ImportItemDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value))
  productId: Types.ObjectId;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value ? (Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value) : undefined,
  )
  variantId?: Types.ObjectId;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  unitCost: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  totalCost: number;
}

export class CreateImportPhaseDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.toUpperCase().trim())
  batchId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  supplierName: string;

  @IsOptional()
  @IsEnum(ImportStatus)
  status?: ImportStatus = ImportStatus.PENDING;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  totalCost: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  totalQuantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  notes?: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsDateString()
  actualDeliveryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  trackingNumber?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportItemDto)
  @ArrayMinSize(0)
  items?: ImportItemDto[];
}
