import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { parseMaxFileBytes } from '../files/files.constants';
import { CreateProgramApplicationDto } from './dto/create-program-application.dto';
import { UpdateProgramApplicationDto } from './dto/update-program-application.dto';
import { ProgramApplicationsService } from './program-applications.service';

@ApiTags('Program applications')
@Controller('program-applications')
export class ProgramApplicationsController {
  constructor(private readonly applications: ProgramApplicationsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Submit an application (public)',
    description:
      'Multipart body: text fields (`firstName`, `lastName`, `email`, `dateOfBirth`, `citizenship`, optional `facultyProgramId`) plus zero or more `files` (PDF only).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'dateOfBirth', 'citizenship'],
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string' },
        dateOfBirth: { type: 'string', format: 'date' },
        citizenship: { type: 'string', enum: ['CA', 'US', 'UK', 'INT'] },
        facultyProgramId: { type: 'string' },
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 15, {
      storage: memoryStorage(),
      limits: {
        fileSize: parseMaxFileBytes(process.env.FILES_MAX_BYTES),
        files: 15,
      },
    }),
  )
  create(
    @Body() dto: CreateProgramApplicationDto,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
  ) {
    return this.applications.create(dto, files ?? []);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List program applications (admin)' })
  findAll() {
    return this.applications.findAllAdmin();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get program application by id (admin)' })
  findOne(@Param('id') id: string) {
    return this.applications.findOneAdmin(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update program application (admin)',
    description: 'Typically used to set `status` or internal `adminNotes`.',
  })
  update(@Param('id') id: string, @Body() dto: UpdateProgramApplicationDto) {
    return this.applications.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete program application (admin)',
    description: 'Removes attachment files from disk and database.',
  })
  async remove(@Param('id') id: string) {
    await this.applications.remove(id);
  }
}
