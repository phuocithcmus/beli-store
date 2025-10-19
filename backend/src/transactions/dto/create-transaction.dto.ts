import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsEmail,
  IsNotEmpty,
  Min,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { TransactionType, PaymentMethod, TransactionStatus } from '../schemas/transaction.schema';

export class TransactionItemDto {
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
  unitPrice: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  totalPrice: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discount?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  tax?: number = 0;
}

export class CreateTransactionDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.toUpperCase().trim())
  transactionId?: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus = TransactionStatus.PENDING;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  taxAmount?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discountAmount?: number = 0;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  netAmount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  paymentReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  customerName?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  customerEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  @Matches(/^[\+]?[1-9][\d]{0,15}$/, {
    message: 'Phone number must be a valid international format',
  })
  customerPhone?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value ? (Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value) : undefined,
  )
  salesChannelId?: Types.ObjectId;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  @ArrayMinSize(1, { message: 'At least one item is required' })
  items: TransactionItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  notes?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value ? (Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value) : undefined,
  )
  relatedTransactionId?: Types.ObjectId;
}
