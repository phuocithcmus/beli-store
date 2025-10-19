import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService, ProductFilter } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ResponseUtil } from '../common/utils/response.util';
import { Public } from '../common/decorators/public.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    const product = await this.productsService.create(createProductDto);
    return ResponseUtil.created(product, 'Product created successfully');
  }

  @Get()
  @Public()
  async findAll(@Query() filter: ProductFilter) {
    const result = await this.productsService.findAll(filter);
    return ResponseUtil.paginated(
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
      'Products retrieved successfully',
    );
  }

  @Get('categories')
  @Public()
  async getCategories() {
    const categories = await this.productsService.getCategories();
    return ResponseUtil.success(categories, 'Categories retrieved successfully');
  }

  @Get('statistics/categories')
  async getCategoryStatistics() {
    const statistics = await this.productsService.getCategoryStatistics();
    return ResponseUtil.success(statistics, 'Category statistics retrieved successfully');
  }

  @Get('alerts/stock')
  async getStockAlerts() {
    const alerts = await this.productsService.getStockAlerts();
    return ResponseUtil.success(alerts, 'Stock alerts retrieved successfully');
  }

  @Get('search')
  @Public()
  async searchProducts(@Query('q') searchTerm: string, @Query('limit') limit?: number) {
    const products = await this.productsService.searchProducts(searchTerm, limit);
    return ResponseUtil.success(products, 'Search results retrieved successfully');
  }

  @Get('code/:code')
  @Public()
  async findByCode(@Param('code') code: string) {
    const product = await this.productsService.findByCode(code);
    return ResponseUtil.success(product, 'Product retrieved successfully');
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    return ResponseUtil.success(product, 'Product retrieved successfully');
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    const product = await this.productsService.update(id, updateProductDto);
    return ResponseUtil.updated(product, 'Product updated successfully');
  }

  @Patch(':id/quantities')
  async updateQuantities(
    @Param('id') id: string,
    @Body() body: { remainingQuantity: number; soldQuantity: number },
  ) {
    const product = await this.productsService.updateQuantities(
      id,
      body.remainingQuantity,
      body.soldQuantity,
    );
    return ResponseUtil.updated(product, 'Product quantities updated successfully');
  }

  @Patch(':id/variants/:variantId')
  async addVariant(@Param('id') id: string, @Param('variantId') variantId: string) {
    const product = await this.productsService.addVariant(id, variantId);
    return ResponseUtil.updated(product, 'Variant added to product successfully');
  }

  @Delete(':id/variants/:variantId')
  async removeVariant(@Param('id') id: string, @Param('variantId') variantId: string) {
    const product = await this.productsService.removeVariant(id, variantId);
    return ResponseUtil.updated(product, 'Variant removed from product successfully');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const product = await this.productsService.remove(id);
    return ResponseUtil.success(product, 'Product deleted successfully');
  }
}
