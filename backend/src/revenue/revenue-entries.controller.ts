import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { RevenueEntriesService } from './revenue-entries.service';
import { CreateRevenueEntryDto } from './dto/create-revenue-entry.dto';
import { UpdateRevenueEntryDto } from './dto/update-revenue-entry.dto';
import { RevenueType, RevenueStatus } from './schemas/revenue-entry.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('revenue-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RevenueEntriesController {
  constructor(private readonly revenueEntriesService: RevenueEntriesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRevenueEntryDto: CreateRevenueEntryDto) {
    const entry = await this.revenueEntriesService.create(createRevenueEntryDto);
    return {
      success: true,
      message: 'Revenue entry created successfully',
      data: entry,
    };
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('type') type?: RevenueType,
    @Query('status') status?: RevenueStatus,
    @Query('transactionId') transactionId?: string,
    @Query('salesChannelId') salesChannelId?: string,
    @Query('currency') currency?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('isActive') isActive?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('region') region?: string,
    @Query('tags') tags?: string,
  ) {
    const options = {
      page,
      limit,
      type,
      status,
      transactionId,
      salesChannelId,
      currency,
      startDate,
      endDate,
      isActive: isActive ? isActive === 'true' : undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      region,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
    };

    const result = await this.revenueEntriesService.findAll(options);

    return {
      success: true,
      message: 'Revenue entries retrieved successfully',
      data: result,
    };
  }

  @Get('analytics')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getAnalytics(
    @Query('type') type?: RevenueType,
    @Query('salesChannelId') salesChannelId?: string,
    @Query('currency') currency?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month' | 'year',
  ) {
    const analytics = await this.revenueEntriesService.getRevenueAnalytics({
      type,
      salesChannelId,
      currency,
      startDate,
      endDate,
      groupBy,
    });
    return {
      success: true,
      message: 'Revenue analytics retrieved successfully',
      data: analytics,
    };
  }

  @Get('top-products')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getTopProducts(
    @Query('salesChannelId') salesChannelId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    const products = await this.revenueEntriesService.getTopPerformingProducts({
      salesChannelId,
      startDate,
      endDate,
      limit,
    });
    return {
      success: true,
      message: 'Top performing products retrieved successfully',
      data: products,
    };
  }

  @Get('transaction/:transactionId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findByTransaction(@Param('transactionId') transactionId: string) {
    const entries = await this.revenueEntriesService.findByTransaction(transactionId);
    return {
      success: true,
      message: 'Revenue entries by transaction retrieved successfully',
      data: entries,
    };
  }

  @Get('entry-id/:entryId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findByEntryId(@Param('entryId') entryId: string) {
    const entry = await this.revenueEntriesService.findByEntryId(entryId);

    if (!entry) {
      return {
        success: false,
        message: 'Revenue entry not found',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Revenue entry retrieved successfully',
      data: entry,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findOne(@Param('id') id: string) {
    const entry = await this.revenueEntriesService.findOne(id);
    return {
      success: true,
      message: 'Revenue entry retrieved successfully',
      data: entry,
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async update(@Param('id') id: string, @Body() updateRevenueEntryDto: UpdateRevenueEntryDto) {
    const entry = await this.revenueEntriesService.update(id, updateRevenueEntryDto);
    return {
      success: true,
      message: 'Revenue entry updated successfully',
      data: entry,
    };
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateStatus(@Param('id') id: string, @Body('status') status: RevenueStatus) {
    const entry = await this.revenueEntriesService.updateStatus(id, status);
    return {
      success: true,
      message: 'Revenue entry status updated successfully',
      data: entry,
    };
  }

  @Post(':id/tags')
  @Roles(Role.ADMIN, Role.MANAGER)
  async addTag(@Param('id') id: string, @Body('tag') tag: string) {
    const entry = await this.revenueEntriesService.addTag(id, tag);
    return {
      success: true,
      message: 'Tag added to revenue entry successfully',
      data: entry,
    };
  }

  @Delete(':id/tags/:tag')
  @Roles(Role.ADMIN, Role.MANAGER)
  async removeTag(@Param('id') id: string, @Param('tag') tag: string) {
    const entry = await this.revenueEntriesService.removeTag(id, tag);
    return {
      success: true,
      message: 'Tag removed from revenue entry successfully',
      data: entry,
    };
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN, Role.MANAGER)
  async softDelete(@Param('id') id: string) {
    const entry = await this.revenueEntriesService.softDelete(id);
    return {
      success: true,
      message: 'Revenue entry deactivated successfully',
      data: entry,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.revenueEntriesService.remove(id);
    return {
      success: true,
      message: 'Revenue entry deleted successfully',
    };
  }
}
