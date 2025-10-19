import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Product code must contain only uppercase letters, numbers, and hyphens',
  })
  @MaxLength(50)
  @Transform(({ value }) => value?.toString().toUpperCase().trim())
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => value?.toString().trim())
  name: string;

  @IsEnum(['shirt', 'pants', 'jacket', 'dress', 'shoes', 'accessories'], {
    message: 'Category must be one of: shirt, pants, jacket, dress, shoes, accessories',
  })
  category: string;

  @IsNumber()
  @Min(0, { message: 'Remaining quantity must be non-negative' })
  @Transform(({ value }) => parseInt(value, 10))
  remainingQuantity: number;

  @IsNumber()
  @Min(0, { message: 'Sold quantity must be non-negative' })
  @Transform(({ value }) => parseInt(value, 10))
  soldQuantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Purchase price must be non-negative' })
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Selling price must be non-negative' })
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  sellingPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.toString().trim())
  description?: string;
}
