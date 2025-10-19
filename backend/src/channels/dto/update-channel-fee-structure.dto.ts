import { PartialType } from '@nestjs/mapped-types';
import { CreateChannelFeeStructureDto } from './create-channel-fee-structure.dto';
import { IsOptional, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';

export class UpdateChannelFeeStructureDto extends PartialType(CreateChannelFeeStructureDto) {
  @IsOptional()
  @IsMongoId()
  @Transform(({ value }) => (value ? new Types.ObjectId(value) : undefined))
  channelId?: Types.ObjectId;
}
