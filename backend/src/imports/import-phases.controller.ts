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
import { ImportPhasesService } from './import-phases.service';
import { CreateImportPhaseDto } from './dto/create-import-phase.dto';
import { UpdateImportPhaseDto } from './dto/update-import-phase.dto';
import { ImportStatus } from './schemas/import-phase.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('import-phases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportPhasesController {
  constructor(private readonly importPhasesService: ImportPhasesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createImportPhaseDto: CreateImportPhaseDto) {
    const importPhase = await this.importPhasesService.create(createImportPhaseDto);
    return {
      success: true,
      message: 'Import phase created successfully',
      data: importPhase,
    };
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('status') status?: ImportStatus,
    @Query('supplierName') supplierName?: string,
    @Query('batchId') batchId?: string,
    @Query('isActive') isActive?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('overdue') overdue?: string,
  ) {
    const options = {
      page,
      limit,
      status,
      supplierName,
      batchId,
      isActive: isActive ? isActive === 'true' : undefined,
      startDate,
      endDate,
      overdue: overdue ? overdue === 'true' : undefined,
    };

    const result = await this.importPhasesService.findAll(options);

    return {
      success: true,
      message: 'Import phases retrieved successfully',
      data: result,
    };
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getStats(@Query('supplierId') supplierId?: string) {
    const stats = await this.importPhasesService.getImportStats(supplierId);
    return {
      success: true,
      message: 'Import statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('overdue')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getOverdue() {
    const imports = await this.importPhasesService.getOverdueImports();
    return {
      success: true,
      message: 'Overdue imports retrieved successfully',
      data: imports,
    };
  }

  @Get('supplier/:supplierName')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findBySupplier(@Param('supplierName') supplierName: string) {
    const imports = await this.importPhasesService.getImportsBySupplier(supplierName);
    return {
      success: true,
      message: 'Imports by supplier retrieved successfully',
      data: imports,
    };
  }

  @Get('batch/:batchId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findByBatchId(@Param('batchId') batchId: string) {
    const importPhase = await this.importPhasesService.findByBatchId(batchId);

    if (!importPhase) {
      return {
        success: false,
        message: 'Import phase not found',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Import phase retrieved successfully',
      data: importPhase,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async findOne(@Param('id') id: string) {
    const importPhase = await this.importPhasesService.findOne(id);
    return {
      success: true,
      message: 'Import phase retrieved successfully',
      data: importPhase,
    };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async update(@Param('id') id: string, @Body() updateImportPhaseDto: UpdateImportPhaseDto) {
    const importPhase = await this.importPhasesService.update(id, updateImportPhaseDto);
    return {
      success: true,
      message: 'Import phase updated successfully',
      data: importPhase,
    };
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async updateStatus(@Param('id') id: string, @Body('status') status: ImportStatus) {
    const importPhase = await this.importPhasesService.updateStatus(id, status);
    return {
      success: true,
      message: 'Import phase status updated successfully',
      data: importPhase,
    };
  }

  @Post(':id/items')
  @Roles(Role.ADMIN, Role.MANAGER)
  async addItem(@Param('id') id: string, @Body() item: any) {
    const importPhase = await this.importPhasesService.addItem(id, item);
    return {
      success: true,
      message: 'Item added to import phase successfully',
      data: importPhase,
    };
  }

  @Delete(':id/items/:itemIndex')
  @Roles(Role.ADMIN, Role.MANAGER)
  async removeItem(@Param('id') id: string, @Param('itemIndex', ParseIntPipe) itemIndex: number) {
    const importPhase = await this.importPhasesService.removeItem(id, itemIndex);
    return {
      success: true,
      message: 'Item removed from import phase successfully',
      data: importPhase,
    };
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN, Role.MANAGER)
  async softDelete(@Param('id') id: string) {
    const importPhase = await this.importPhasesService.softDelete(id);
    return {
      success: true,
      message: 'Import phase deactivated successfully',
      data: importPhase,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.importPhasesService.remove(id);
    return {
      success: true,
      message: 'Import phase deleted successfully',
    };
  }
}
