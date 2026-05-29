import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProgramApplicationStatus } from '@prisma/client';
import type { Express } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { CreateProgramApplicationDto } from './dto/create-program-application.dto';
import { UpdateProgramApplicationDto } from './dto/update-program-application.dto';

const MAX_APPLICATION_FILES = 15;

@Injectable()
export class ProgramApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
  ) {}

  async create(dto: CreateProgramApplicationDto, files: Express.Multer.File[]) {
    const list = files ?? [];
    if (list.length > MAX_APPLICATION_FILES) {
      throw new BadRequestException(
        `At most ${MAX_APPLICATION_FILES} files are allowed`,
      );
    }

    const dob = new Date(dto.dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      throw new BadRequestException('Invalid date of birth');
    }
    this.assertReasonableDob(dob);

    let facultyProgramId: string | null = null;
    if (dto.facultyProgramId) {
      const fp = await this.prisma.facultyProgram.findFirst({
        where: { id: dto.facultyProgramId, isPublished: true },
        select: { id: true },
      });
      if (!fp) {
        throw new BadRequestException('Invalid or unpublished faculty program');
      }
      facultyProgramId = fp.id;
    }

    const storedIds: string[] = [];
    try {
      for (const f of list) {
        const row = await this.files.saveAnonymousPdf(f);
        storedIds.push(row.id);
      }

      return await this.prisma.$transaction(async (tx) => {
        const app = await tx.programApplication.create({
          data: {
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            email: dto.email.trim().toLowerCase(),
            dateOfBirth: dob,
            citizenship: dto.citizenship,
            facultyProgramId,
            status: ProgramApplicationStatus.SUBMITTED,
          },
        });
        for (const storedFileId of storedIds) {
          await tx.programApplicationAttachment.create({
            data: { applicationId: app.id, storedFileId },
          });
        }
        return {
          id: app.id,
          createdAt: app.createdAt,
        };
      });
    } catch (e) {
      for (const id of storedIds) {
        await this.files.removeByStoredFileId(id).catch(() => undefined);
      }
      throw e;
    }
  }

  findAllAdmin() {
    return this.prisma.programApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        facultyProgram: { select: { id: true, title: true } },
        _count: { select: { attachments: true } },
      },
    });
  }

  async findOneAdmin(id: string) {
    const row = await this.prisma.programApplication.findUnique({
      where: { id },
      include: {
        facultyProgram: {
          select: { id: true, title: true, description: true, iconKey: true },
        },
        attachments: {
          include: {
            storedFile: {
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                sizeBytes: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });
    if (!row) {
      throw new NotFoundException();
    }
    return row;
  }

  async update(id: string, dto: UpdateProgramApplicationDto) {
    await this.findOneAdmin(id);
    if (dto.status === undefined && dto.adminNotes === undefined) {
      throw new BadRequestException('Provide at least one of status or adminNotes');
    }
    return this.prisma.programApplication.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.adminNotes !== undefined
          ? { adminNotes: dto.adminNotes.trim() || null }
          : {}),
      },
      include: {
        facultyProgram: {
          select: { id: true, title: true, description: true, iconKey: true },
        },
        attachments: {
          include: {
            storedFile: {
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                sizeBytes: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    const row = await this.prisma.programApplication.findUnique({
      where: { id },
      include: { attachments: { select: { storedFileId: true } } },
    });
    if (!row) {
      throw new NotFoundException();
    }
    const storedFileIds = row.attachments.map((a) => a.storedFileId);
    await this.prisma.programApplication.delete({ where: { id } });
    for (const storedFileId of storedFileIds) {
      await this.files.removeByStoredFileId(storedFileId).catch(() => undefined);
    }
  }

  private assertReasonableDob(dob: Date) {
    const now = new Date();
    if (dob.getTime() > now.getTime()) {
      throw new BadRequestException('Date of birth cannot be in the future');
    }
    const min = new Date(now);
    min.setUTCFullYear(min.getUTCFullYear() - 120);
    if (dob.getTime() < min.getTime()) {
      throw new BadRequestException('Date of birth is not valid');
    }
    const maxYoung = new Date(now);
    maxYoung.setUTCFullYear(maxYoung.getUTCFullYear() - 13);
    if (dob.getTime() > maxYoung.getTime()) {
      throw new BadRequestException('Applicants must be at least 13 years old');
    }
  }
}
