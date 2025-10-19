import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseEnumPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ChannelFeeStructuresService } from './channel-fee-structures.service';
import { CreateChannelFeeStructureDto } from './dto/create-channel-fee-structure.dto';
import { UpdateChannelFeeStructureDto } from './dto/update-channel-fee-structure.dto';
import {
  ChannelFeeStructure,
  FeeType,
  FeeCalculationType,
  FeeFrequency,
} from './schemas/channel-fee-structure.schema';

@Controller('channel-fee-structures')
export class ChannelFeeStructuresController {
  constructor(private readonly feeStructuresService: ChannelFeeStructuresService) {}

  @Post()
  async create(@Body() createDto: CreateChannelFeeStructureDto): Promise<ChannelFeeStructure> {
    return this.feeStructuresService.create(createDto);
  }

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('channelId') channelId?: string,
    @Query('type') type?: FeeType,
    @Query('calculationType') calculationType?: FeeCalculationType,
    @Query('frequency') frequency?: FeeFrequency,
    @Query('isActive') isActive?: boolean,
    @Query('currency') currency?: string,
    @Query('search') search?: string,
    @Query('tags') tags?: string | string[],
    @Query('effectiveDate') effectiveDate?: string,
    @Query('sortBy') sortBy?: 'name' | 'type' | 'totalAmount' | 'created',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const tagsArray = Array.isArray(tags) ? tags : tags ? [tags] : undefined;

    return this.feeStructuresService.findAll({
      page,
      limit,
      channelId,
      type,
      calculationType,
      frequency,
      isActive,
      currency,
      search,
      tags: tagsArray,
      effectiveDate,
      sortBy,
      sortOrder,
    });
  }

  @Get('analytics')
  async getAnalytics(
    @Query('channelId') channelId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: 'type' | 'calculationType' | 'frequency' | 'channel',
  ) {
    return this.feeStructuresService.getFeeAnalytics({
      channelId,
      startDate,
      endDate,
      groupBy,
    });
  }

  @Get('by-channel/:channelId')
  async getByChannel(
    @Param('channelId') channelId: string,
    @Query('type') type?: FeeType,
    @Query('isActive') isActive?: boolean,
    @Query('effectiveDate') effectiveDate?: string,
  ): Promise<ChannelFeeStructure[]> {
    const options: any = {};
    if (type) options.type = type;
    if (isActive !== undefined) options.isActive = isActive;
    if (effectiveDate) options.effectiveDate = new Date(effectiveDate);

    return this.feeStructuresService.findByChannel(channelId, options);
  }

  @Get('by-channel/:channelId/active')
  async getActiveByChannel(
    @Param('channelId') channelId: string,
    @Query('effectiveDate') effectiveDate?: string,
  ): Promise<ChannelFeeStructure[]> {
    const date = effectiveDate ? new Date(effectiveDate) : undefined;
    return this.feeStructuresService.getActiveByChannel(channelId, date);
  }

  @Get('by-code/:code')
  async findByCode(@Param('code') code: string): Promise<ChannelFeeStructure | null> {
    return this.feeStructuresService.findByCode(code);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ChannelFeeStructure> {
    return this.feeStructuresService.findOne(id);
  }

  @Post(':id/calculate-fee')
  async calculateFee(@Param('id') id: string, @Body() body: { amount: number; context?: any }) {
    return this.feeStructuresService.calculateFee(id, body.amount, body.context);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateChannelFeeStructureDto,
  ): Promise<ChannelFeeStructure> {
    return this.feeStructuresService.update(id, updateDto);
  }

  @Patch(':id/statistics')
  async updateStatistics(
    @Param('id') id: string,
    @Body()
    statistics: {
      totalApplied?: number;
      totalAmount?: number;
      lastAppliedDate?: Date;
      applicationCount?: number;
    },
  ): Promise<ChannelFeeStructure> {
    return this.feeStructuresService.updateStatistics(id, statistics);
  }

  @Patch(':id/statistics/increment')
  async incrementStatistics(
    @Param('id') id: string,
    @Body()
    increments: {
      applied?: number;
      amount?: number;
    },
  ): Promise<ChannelFeeStructure> {
    return this.feeStructuresService.incrementStatistics(id, increments);
  }

  @Post(':id/tags')
  async addTag(
    @Param('id') id: string,
    @Body() body: { tag: string },
  ): Promise<ChannelFeeStructure> {
    return this.feeStructuresService.addTag(id, body.tag);
  }

  @Delete(':id/tags/:tag')
  async removeTag(
    @Param('id') id: string,
    @Param('tag') tag: string,
  ): Promise<ChannelFeeStructure> {
    return this.feeStructuresService.removeTag(id, tag);
  }

  @Post(':id/changelog')
  async addChangeLogEntry(
    @Param('id') id: string,
    @Body() body: { change: string; updatedBy: string },
  ): Promise<ChannelFeeStructure> {
    return this.feeStructuresService.addChangeLogEntry(id, body.change, body.updatedBy);
  }

  @Delete(':id/soft')
  async softDelete(@Param('id') id: string): Promise<ChannelFeeStructure> {
    return this.feeStructuresService.softDelete(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.feeStructuresService.remove(id);
  }
}
