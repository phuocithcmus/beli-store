import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateProductVariantDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value))
  productId: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }) => value?.toLowerCase().trim())
  color: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @Transform(({ value }) => value?.toUpperCase().trim())
  @Matches(/^(XS|S|M|L|XL|XXL|XXXL|\d+)$/, {
    message: 'Size must be one of: XS, S, M, L, XL, XXL, XXXL or a number',
  })
  size: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }) => value?.toLowerCase().trim())
  form: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  sellingPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.toUpperCase().trim())
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'SKU must contain only uppercase letters, numbers, and hyphens',
  })
  sku?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean = true;
}
