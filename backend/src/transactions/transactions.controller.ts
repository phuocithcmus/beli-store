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
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionType, TransactionStatus } from './schemas/transaction.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    const transaction = await this.transactionsService.create(createTransactionDto);
    return {
      success: true,
      message: 'Transaction created successfully',
      data: transaction,
    };
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('type') type?: TransactionType,
    @Query('status') status?: TransactionStatus,
    @Query('customerEmail') customerEmail?: string,
    @Query('salesChannelId') salesChannelId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('isActive') isActive?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
  ) {
    const options = {
      page,
      limit,
      type,
      status,
      customerEmail,
      salesChannelId,
      startDate,
      endDate,
      isActive: isActive ? isActive === 'true' : undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
    };

    const result = await this.transactionsService.findAll(options);

    return {
      success: true,
      message: 'Transactions retrieved successfully',
      data: result,
    };
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getStats(
    @Query('type') type?: TransactionType,
    @Query('salesChannelId') salesChannelId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.transactionsService.getTransactionStats({
      type,
      salesChannelId,
      startDate,
      endDate,
    });
    return {
      success: true,
      message: 'Transaction statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('customer/:email')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findByCustomer(@Param('email') email: string) {
    const transactions = await this.transactionsService.getCustomerTransactions(email);
    return {
      success: true,
      message: 'Customer transactions retrieved successfully',
      data: transactions,
    };
  }

  @Get('transaction-id/:transactionId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findByTransactionId(@Param('transactionId') transactionId: string) {
    const transaction = await this.transactionsService.findByTransactionId(transactionId);

    if (!transaction) {
      return {
        success: false,
        message: 'Transaction not found',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Transaction retrieved successfully',
      data: transaction,
    };
  }

  @Get(':id/related')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getRelatedTransactions(@Param('id') id: string) {
    const transactions = await this.transactionsService.getRelatedTransactions(id);
    return {
      success: true,
      message: 'Related transactions retrieved successfully',
      data: transactions,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findOne(@Param('id') id: string) {
    const transaction = await this.transactionsService.findOne(id);
    return {
      success: true,
      message: 'Transaction retrieved successfully',
      data: transaction,
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    const transaction = await this.transactionsService.update(id, updateTransactionDto);
    return {
      success: true,
      message: 'Transaction updated successfully',
      data: transaction,
    };
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async updateStatus(@Param('id') id: string, @Body('status') status: TransactionStatus) {
    const transaction = await this.transactionsService.updateStatus(id, status);
    return {
      success: true,
      message: 'Transaction status updated successfully',
      data: transaction,
    };
  }

  @Post(':id/items')
  @Roles(Role.ADMIN, Role.MANAGER)
  async addItem(@Param('id') id: string, @Body() item: any) {
    const transaction = await this.transactionsService.addItem(id, item);
    return {
      success: true,
      message: 'Item added to transaction successfully',
      data: transaction,
    };
  }

  @Delete(':id/items/:itemIndex')
  @Roles(Role.ADMIN, Role.MANAGER)
  async removeItem(@Param('id') id: string, @Param('itemIndex', ParseIntPipe) itemIndex: number) {
    const transaction = await this.transactionsService.removeItem(id, itemIndex);
    return {
      success: true,
      message: 'Item removed from transaction successfully',
      data: transaction,
    };
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN, Role.MANAGER)
  async softDelete(@Param('id') id: string) {
    const transaction = await this.transactionsService.softDelete(id);
    return {
      success: true,
      message: 'Transaction deactivated successfully',
      data: transaction,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.transactionsService.remove(id);
    return {
      success: true,
      message: 'Transaction deleted successfully',
    };
  }
}
