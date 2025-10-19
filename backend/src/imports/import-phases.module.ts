import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImportPhasesService } from './import-phases.service';
import { ImportPhasesController } from './import-phases.controller';
import { ImportPhase, ImportPhaseSchema } from './schemas/import-phase.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ImportPhase.name, schema: ImportPhaseSchema }]),
    AuthModule,
  ],
  controllers: [ImportPhasesController],
  providers: [ImportPhasesService],
  exports: [ImportPhasesService],
})
export class ImportPhasesModule {}
