import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  IsEmail,
  IsUrl,
  IsNotEmpty,
  Min,
  Max,
  MaxLength,
  ValidateNested,
  IsISO4217CurrencyCode,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ChannelType, ChannelStatus } from '../schemas/sales-channel.schema';

export class AddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  zipCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  @Transform(({ value }) => value?.toUpperCase().trim())
  @Matches(/^[A-Z]{2}$/, { message: 'Country must be a 2-letter ISO code' })
  country?: string = 'US';
}

export class ConfigurationDto {
  @IsOptional()
  @IsString()
  @IsISO4217CurrencyCode()
  @Transform(({ value }) => value?.toUpperCase().trim())
  currency?: string = 'USD';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  timezone?: string = 'UTC';

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Transform(({ value }) => value?.toLowerCase().trim())
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/, {
    message: 'Language must be in ISO format (e.g., en, en-US)',
  })
  language?: string = 'en';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  taxRate?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  shippingFeeFlat?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  shippingFeePercentage?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minimumOrderAmount?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maximumOrderAmount?: number;
}

export class IntegrationSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  apiKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  secretKey?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  accessToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  refreshToken?: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, string>;
}

export class CreateSalesChannelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.toUpperCase().trim())
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Code must contain only uppercase letters, numbers, and underscores',
  })
  code?: string;

  @IsEnum(ChannelType)
  type: ChannelType;

  @IsOptional()
  @IsEnum(ChannelStatus)
  status?: ChannelStatus = ChannelStatus.ACTIVE;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  website?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  @Matches(/^[\+]?[1-9][\d]{0,15}$/, {
    message: 'Phone number must be a valid international format',
  })
  contactPhone?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ConfigurationDto)
  configuration?: ConfigurationDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => IntegrationSettingsDto)
  integrationSettings?: IntegrationSettingsDto;

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
