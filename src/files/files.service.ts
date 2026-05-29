import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, type User } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Express } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { parseMaxFileBytes } from './files.constants';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/pjpeg': '.jpg',
  'image/png': '.png',
  'image/x-png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

const MAX_ORIGINAL_NAME_LEN = 500;

export type ResolvedImageFile = {
  absolutePath: string;
  mimeType: string;
  filename: string;
};

/** Any allowed `StoredFile` on disk (for download / streaming). */
export type ResolvedStoredFile = {
  absolutePath: string;
  mimeType: string;
  filename: string;
  originalName: string | null;
};

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    void this.ensureUploadDir();
  }

  getMaxFileBytes(): number {
    return parseMaxFileBytes(this.config.get<string>('FILES_MAX_BYTES'));
  }

  /** Absolute directory where uploaded blobs are stored. */
  getUploadRoot(): string {
    const dir =
      this.config.get<string>('FILES_UPLOAD_DIR')?.trim() || 'uploads';
    if (dir.startsWith('/')) {
      return resolve(dir);
    }
    return resolve(process.cwd(), dir);
  }

  /** Public URL path prefix (no trailing slash), e.g. `/files`. */
  getPublicPrefix(): string {
    const p = this.config.get<string>('FILES_PUBLIC_PREFIX')?.trim() || '/files';
    return p.replace(/\/$/, '') || '/files';
  }

  async ensureUploadDir(): Promise<void> {
    const root = this.getUploadRoot();
    await mkdir(root, { recursive: true });
  }

  /**
   * Resolve a `StoredFile` by id for download (`GET /files/uploads/:id/download`).
   * Any MIME type allowed at upload time (e.g. PDF, images).
   */
  async resolveStoredFileForDownload(
    storedFileId: string,
  ): Promise<ResolvedStoredFile> {
    const id = storedFileId.trim();
    if (!id || id.includes('/') || id.includes('..')) {
      throw new NotFoundException();
    }

    const row = await this.prisma.storedFile.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException();
    }

    const absolutePath = join(this.getUploadRoot(), row.filename);
    try {
      await access(absolutePath, constants.R_OK);
    } catch {
      throw new NotFoundException();
    }

    return {
      absolutePath,
      mimeType: row.mimeType,
      filename: row.filename,
      originalName: row.originalName,
    };
  }

  /**
   * Resolve a `StoredFile` id to an **image** on disk for `<img src>` (`GET /files/uploads/:id`).
   */
  async resolveImageByStoredFileId(storedFileId: string): Promise<ResolvedImageFile> {
    const r = await this.resolveStoredFileForDownload(storedFileId);
    if (!r.mimeType.startsWith('image/')) {
      throw new NotFoundException();
    }
    return {
      absolutePath: r.absolutePath,
      mimeType: r.mimeType,
      filename: r.filename,
    };
  }

  /**
   * Writes the blob to disk and creates a `StoredFile` row (authenticated uploader).
   */
  async saveUpload(
    file: Express.Multer.File,
    uploadedBy: User,
  ): Promise<{
    id: string;
    filename: string;
    originalName: string | null;
    url: string;
    mimeType: string;
    size: number;
  }> {
    return this.persistUploadedBuffer(file, uploadedBy.id);
  }

  /**
   * Public apply form: PDF only, `uploadedById` null (anonymous).
   */
  async saveAnonymousPdf(
    file: Express.Multer.File,
  ): Promise<{
    id: string;
    filename: string;
    originalName: string | null;
    url: string;
    mimeType: string;
    size: number;
  }> {
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF uploads are allowed for applications');
    }
    return this.persistUploadedBuffer(file, null);
  }

  private async persistUploadedBuffer(
    file: Express.Multer.File,
    uploadedById: string | null,
  ): Promise<{
    id: string;
    filename: string;
    originalName: string | null;
    url: string;
    mimeType: string;
    size: number;
  }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Missing file');
    }
    const max = this.getMaxFileBytes();
    if (file.size > max) {
      throw new BadRequestException(`File exceeds maximum size of ${max} bytes`);
    }

    const ext = MIME_TO_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        `Unsupported MIME type: ${file.mimetype}. Allowed: ${Object.keys(MIME_TO_EXT).join(', ')}`,
      );
    }

    const filename = `${randomUUID()}${ext}`;
    const root = this.getUploadRoot();
    await this.ensureUploadDir();
    const absolutePath = join(root, filename);
    try {
      await writeFile(absolutePath, file.buffer);
    } catch (e) {
      this.logger.error(`writeFile failed for ${filename}: ${e}`);
      throw new InternalServerErrorException(
        'Could not save the file to disk. Check FILES_UPLOAD_DIR permissions and disk space.',
      );
    }

    const prefix = this.getPublicPrefix();
    const url = `${prefix}/${encodeURIComponent(filename)}`;
    const originalName = this.sanitizeOriginalName(file.originalname);

    try {
      const row = await this.prisma.storedFile.create({
        data: {
          filename,
          originalName,
          url,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          uploadedById,
        },
      });
      return {
        id: row.id,
        filename: row.filename,
        originalName: row.originalName,
        url: row.url,
        mimeType: row.mimeType,
        size: row.sizeBytes,
      };
    } catch (e) {
      await unlink(absolutePath).catch(() => undefined);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(
          `storedFile.create failed: ${e.code} — ${e.message}`,
        );
        if (e.code === 'P2003') {
          throw new BadRequestException(
            uploadedById
              ? 'Could not link upload to your user. Try signing in again.'
              : 'Could not save file metadata.',
          );
        }
        if (e.code === 'P2021') {
          throw new InternalServerErrorException(
            'Database schema is missing or out of date. Run: npx prisma migrate deploy',
          );
        }
        throw new InternalServerErrorException(
          'Could not save file metadata. Check API logs for details.',
        );
      }
      if (e instanceof Prisma.PrismaClientValidationError) {
        this.logger.error(`storedFile.create validation: ${e.message}`);
        throw new BadRequestException('Invalid file metadata.');
      }
      this.logger.error(`storedFile.create unexpected: ${e}`);
      throw new InternalServerErrorException(
        'Could not save file metadata. Check API logs for details.',
      );
    }
  }

  /**
   * Deletes disk + DB row by `StoredFile` id (`DELETE /files/uploads/:id`).
   */
  async removeByStoredFileId(storedFileId: string): Promise<void> {
    const id = storedFileId.trim();
    if (!id || id.includes('/') || id.includes('..')) {
      throw new BadRequestException('Invalid id');
    }

    const row = await this.prisma.storedFile.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException();
    }

    const absolutePath = join(this.getUploadRoot(), row.filename);
    try {
      await unlink(absolutePath);
    } catch (e: unknown) {
      const code = (e as NodeJS.ErrnoException)?.code;
      if (code !== 'ENOENT') {
        this.logger.warn(`Failed to unlink ${row.filename}: ${e}`);
        throw e;
      }
    }

    await this.prisma.storedFile.delete({ where: { id: row.id } });
  }

  private sanitizeOriginalName(name: string | undefined): string | null {
    if (!name?.trim()) {
      return null;
    }
    const t = name.trim();
    return t.length > MAX_ORIGINAL_NAME_LEN
      ? t.slice(0, MAX_ORIGINAL_NAME_LEN)
      : t;
  }
}
