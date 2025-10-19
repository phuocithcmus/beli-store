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
import { ProductVariantsService } from './product-variants.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('product-variants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductVariantsController {
  constructor(private readonly productVariantsService: ProductVariantsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductVariantDto: CreateProductVariantDto) {
    const variant = await this.productVariantsService.create(createProductVariantDto);
    return {
      success: true,
      message: 'Product variant created successfully',
      data: variant,
    };
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findAll(
    @Query('productId') productId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('isActive') isActive?: string,
    @Query('inStock') inStock?: string,
    @Query('color') color?: string,
    @Query('size') size?: string,
    @Query('form') form?: string,
  ) {
    const options = {
      page,
      limit,
      isActive: isActive ? isActive === 'true' : undefined,
      inStock: inStock ? inStock === 'true' : undefined,
      color,
      size,
      form,
    };

    const result = await this.productVariantsService.findAll(productId, options);

    return {
      success: true,
      message: 'Product variants retrieved successfully',
      data: result,
    };
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getStats(@Query('productId') productId?: string) {
    const stats = await this.productVariantsService.getVariantStats(productId);
    return {
      success: true,
      message: 'Variant statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('low-stock')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getLowStock(@Query('threshold', new DefaultValuePipe(2), ParseIntPipe) threshold?: number) {
    const variants = await this.productVariantsService.getLowStockVariants(threshold);
    return {
      success: true,
      message: 'Low stock variants retrieved successfully',
      data: variants,
    };
  }

  @Get('out-of-stock')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getOutOfStock() {
    const variants = await this.productVariantsService.getOutOfStockVariants();
    return {
      success: true,
      message: 'Out of stock variants retrieved successfully',
      data: variants,
    };
  }

  @Get('product/:productId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findByProduct(@Param('productId') productId: string) {
    const variants = await this.productVariantsService.findByProduct(productId);
    return {
      success: true,
      message: 'Product variants retrieved successfully',
      data: variants,
    };
  }

  @Get('sku/:sku')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findBySku(@Param('sku') sku: string) {
    const variant = await this.productVariantsService.findBySku(sku);

    if (!variant) {
      return {
        success: false,
        message: 'Variant not found',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Variant retrieved successfully',
      data: variant,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findOne(@Param('id') id: string) {
    const variant = await this.productVariantsService.findOne(id);
    return {
      success: true,
      message: 'Product variant retrieved successfully',
      data: variant,
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async update(@Param('id') id: string, @Body() updateProductVariantDto: UpdateProductVariantDto) {
    const variant = await this.productVariantsService.update(id, updateProductVariantDto);
    return {
      success: true,
      message: 'Product variant updated successfully',
      data: variant,
    };
  }

  @Patch(':id/quantity')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async updateQuantity(@Param('id') id: string, @Body('quantity', ParseIntPipe) quantity: number) {
    const variant = await this.productVariantsService.updateQuantity(id, quantity);
    return {
      success: true,
      message: 'Variant quantity updated successfully',
      data: variant,
    };
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN, Role.MANAGER)
  async softDelete(@Param('id') id: string) {
    const variant = await this.productVariantsService.softDelete(id);
    return {
      success: true,
      message: 'Product variant deactivated successfully',
      data: variant,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.productVariantsService.remove(id);
    return {
      success: true,
      message: 'Product variant deleted successfully',
    };
  }
}
