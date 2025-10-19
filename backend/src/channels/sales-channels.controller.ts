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
import { SalesChannelsService } from './sales-channels.service';
import { CreateSalesChannelDto } from './dto/create-sales-channel.dto';
import { UpdateSalesChannelDto } from './dto/update-sales-channel.dto';
import { SalesChannel, ChannelType, ChannelStatus } from './schemas/sales-channel.schema';

@Controller('sales-channels')
export class SalesChannelsController {
  constructor(private readonly salesChannelsService: SalesChannelsService) {}

  @Post()
  async create(@Body() createSalesChannelDto: CreateSalesChannelDto): Promise<SalesChannel> {
    return this.salesChannelsService.create(createSalesChannelDto);
  }

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: ChannelType,
    @Query('status') status?: ChannelStatus,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('tags') tags?: string | string[],
    @Query('minRevenue') minRevenue?: number,
    @Query('maxRevenue') maxRevenue?: number,
    @Query('sortBy') sortBy?: 'name' | 'revenue' | 'orders' | 'created',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const tagsArray = Array.isArray(tags) ? tags : tags ? [tags] : undefined;

    return this.salesChannelsService.findAll({
      page,
      limit,
      type,
      status,
      isActive,
      search,
      tags: tagsArray,
      minRevenue,
      maxRevenue,
      sortBy,
      sortOrder,
    });
  }

  @Get('analytics')
  async getAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: 'type' | 'status',
  ) {
    return this.salesChannelsService.getChannelAnalytics({
      startDate,
      endDate,
      groupBy,
    });
  }

  @Get('top-performing')
  async getTopPerforming(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<SalesChannel[]> {
    return this.salesChannelsService.getTopPerformingChannels(limit);
  }

  @Get('by-type/:type')
  async getByType(
    @Param('type', new ParseEnumPipe(ChannelType)) type: ChannelType,
  ): Promise<SalesChannel[]> {
    return this.salesChannelsService.getChannelsByType(type);
  }

  @Get('by-code/:code')
  async findByCode(@Param('code') code: string): Promise<SalesChannel | null> {
    return this.salesChannelsService.findByCode(code);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SalesChannel> {
    return this.salesChannelsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSalesChannelDto: UpdateSalesChannelDto,
  ): Promise<SalesChannel> {
    return this.salesChannelsService.update(id, updateSalesChannelDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ChannelStatus },
  ): Promise<SalesChannel> {
    return this.salesChannelsService.updateStatus(id, body.status);
  }

  @Patch(':id/statistics')
  async updateStatistics(
    @Param('id') id: string,
    @Body()
    statistics: {
      totalSales?: number;
      totalOrders?: number;
      totalRevenue?: number;
      lastSaleDate?: Date;
      lastOrderDate?: Date;
    },
  ): Promise<SalesChannel> {
    return this.salesChannelsService.updateStatistics(id, statistics);
  }

  @Patch(':id/statistics/increment')
  async incrementStatistics(
    @Param('id') id: string,
    @Body()
    increments: {
      sales?: number;
      orders?: number;
      revenue?: number;
    },
  ): Promise<SalesChannel> {
    return this.salesChannelsService.incrementStatistics(id, increments);
  }

  @Post(':id/tags')
  async addTag(@Param('id') id: string, @Body() body: { tag: string }): Promise<SalesChannel> {
    return this.salesChannelsService.addTag(id, body.tag);
  }

  @Delete(':id/tags/:tag')
  async removeTag(@Param('id') id: string, @Param('tag') tag: string): Promise<SalesChannel> {
    return this.salesChannelsService.removeTag(id, tag);
  }

  @Delete(':id/soft')
  async softDelete(@Param('id') id: string): Promise<SalesChannel> {
    return this.salesChannelsService.softDelete(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.salesChannelsService.remove(id);
  }
}
