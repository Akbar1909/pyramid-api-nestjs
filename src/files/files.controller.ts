import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { createReadStream } from 'node:fs';
import { Role, User } from '@prisma/client';
import type { Express } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UploadedFileResponseDto } from './dto/uploaded-file-response.dto';
import { FilesService } from './files.service';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a file (admin)' })
  @ApiOkResponse({ type: UploadedFileResponseDto })
  async upload(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<UploadedFileResponseDto> {
    if (!file) {
      throw new BadRequestException('Missing file field `file`');
    }
    return this.files.saveUpload(file, user);
  }

  @Get('uploads/:id/download')
  @ApiOperation({
    summary: 'Download stored file by StoredFile id',
    description:
      'Public. `GET /files/uploads/:id/download` — PDF, images, etc. `Content-Disposition: attachment`.',
  })
  @ApiParam({ name: 'id', description: 'StoredFile cuid' })
  @ApiProduces(
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  )
  @ApiOkResponse({ description: 'File bytes (attachment)' })
  @ApiNotFoundResponse()
  @Header('Cache-Control', 'private, max-age=0')
  async downloadById(@Param('id') id: string): Promise<StreamableFile> {
    const r = await this.files.resolveStoredFileForDownload(id);
    const name =
      r.originalName &&
      !r.originalName.includes('/') &&
      !r.originalName.includes('..')
        ? r.originalName
        : r.filename;
    return new StreamableFile(createReadStream(r.absolutePath), {
      type: r.mimeType,
      disposition: `attachment; filename="${name.replace(/"/g, '')}"`,
    });
  }

  @Get('uploads/:id')
  @ApiOperation({
    summary: 'View stored image by StoredFile id',
    description:
      'Public. `GET /files/uploads/:id`. Streams `image/*` only. For PDFs use `…/download`.',
  })
  @ApiParam({ name: 'id', description: 'StoredFile cuid' })
  @ApiProduces('image/jpeg', 'image/png', 'image/webp', 'image/gif')
  @ApiOkResponse({ description: 'Image bytes (inline)' })
  @ApiNotFoundResponse()
  @Header('Cache-Control', 'public, max-age=86400')
  async viewById(@Param('id') id: string): Promise<StreamableFile> {
    const { absolutePath, mimeType, filename } =
      await this.files.resolveImageByStoredFileId(id);
    return new StreamableFile(createReadStream(absolutePath), {
      type: mimeType,
      disposition: `inline; filename="${filename.replace(/"/g, '')}"`,
    });
  }

  @Delete('uploads/:id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete stored file (admin)',
    description:
      '`DELETE /files/uploads/:id` — `StoredFile` id only (from upload response).',
  })
  @ApiParam({ name: 'id', description: 'StoredFile cuid' })
  async remove(@Param('id') id: string) {
    await this.files.removeByStoredFileId(id);
  }
}
