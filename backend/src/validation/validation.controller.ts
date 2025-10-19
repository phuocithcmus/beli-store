import { Controller, Get } from '@nestjs/common';
import { ValidationService } from './validation.service';

@Controller('validation')
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Get('entities')
  async validateEntities() {
    return this.validationService.validateAllEntities();
  }

  @Get('integrity')
  async validateIntegrity() {
    return this.validationService.validateReferentialIntegrity();
  }

  @Get('summary')
  async getSystemSummary() {
    return this.validationService.getSystemSummary();
  }
}
