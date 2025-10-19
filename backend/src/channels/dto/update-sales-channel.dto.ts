import { PartialType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsObject,
  IsArray,
  IsEmail,
  IsUrl,
  MaxLength,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  CreateSalesChannelDto,
  AddressDto,
  ConfigurationDto,
  IntegrationSettingsDto,
} from './create-sales-channel.dto';
import { ChannelType, ChannelStatus } from '../schemas/sales-channel.schema';

export class UpdateSalesChannelDto extends PartialType(CreateSalesChannelDto) {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.toUpperCase().trim())
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Code must contain only uppercase letters, numbers, and underscores',
  })
  code?: string;

  @IsOptional()
  @IsEnum(ChannelType)
  type?: ChannelType;

  @IsOptional()
  @IsEnum(ChannelStatus)
  status?: ChannelStatus;

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
