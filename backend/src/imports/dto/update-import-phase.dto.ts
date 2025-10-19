import { PartialType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsDateString,
  Min,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateImportPhaseDto, ImportItemDto } from './create-import-phase.dto';
import { ImportStatus } from '../schemas/import-phase.schema';

export class UpdateImportPhaseDto extends PartialType(CreateImportPhaseDto) {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  supplierName?: string;

  @IsOptional()
  @IsEnum(ImportStatus)
  status?: ImportStatus;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  totalCost?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  totalQuantity?: number;

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
