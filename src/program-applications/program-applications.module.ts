import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProgramApplicationsController } from './program-applications.controller';
import { ProgramApplicationsService } from './program-applications.service';

@Module({
  imports: [PrismaModule, FilesModule],
  controllers: [ProgramApplicationsController],
  providers: [ProgramApplicationsService],
})
export class ProgramApplicationsModule {}
