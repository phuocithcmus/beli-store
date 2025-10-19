import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateProductDto extends PartialType(OmitType(CreateProductDto, ['code'] as const)) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
