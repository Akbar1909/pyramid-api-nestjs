import { Module } from '@nestjs/common';
import { FacultyProgramsController } from './faculty-programs.controller';
import { FacultyProgramsService } from './faculty-programs.service';

@Module({
  controllers: [FacultyProgramsController],
  providers: [FacultyProgramsService],
  exports: [FacultyProgramsService],
})
export class FacultyProgramsModule {}
