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
import { PROGRAM_APPLICATION_DOCUMENT_TYPES } from './program-application-document-types';
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
      'Multipart body: personal fields, optional `facultyProgramId`, `supplementaryAnswers` (JSON string), `documentTypes` (JSON array aligned with `files`), plus zero or more PDF `files`.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'firstName',
        'lastName',
        'email',
        'phone',
        'dateOfBirth',
        'citizenship',
        'preferredStartDate',
      ],
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        dateOfBirth: { type: 'string', format: 'date' },
        citizenship: { type: 'string', enum: ['CA', 'US', 'UK', 'INT'] },
        preferredStartDate: { type: 'string', format: 'date' },
        facultyProgramId: { type: 'string' },
        supplementaryAnswers: {
          type: 'string',
          description: 'JSON object, e.g. {"whyProgram":"…"}',
        },
        documentTypes: {
          type: 'string',
          description: `JSON array aligned with files, e.g. ["transcript","government_id"]. Allowed: ${PROGRAM_APPLICATION_DOCUMENT_TYPES.join(', ')}`,
        },
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

  @Get('track/:token')
  @ApiOperation({
    summary: 'Track application status (public)',
    description:
      'Returns status and program info for the `trackingToken` returned when the application was submitted.',
  })
  track(@Param('token') token: string) {
    return this.applications.findByTrackingToken(token);
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
    description:
      'Set `status`, `adminNotes`, interview fields, or `enrolledAt`. Setting status to `ENROLLED` auto-fills `enrolledAt` when omitted.',
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
