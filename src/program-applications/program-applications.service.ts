import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProgramApplicationStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import type { Express } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { CreateProgramApplicationDto } from './dto/create-program-application.dto';
import { UpdateProgramApplicationDto } from './dto/update-program-application.dto';
import { PROGRAM_APPLICATION_DOCUMENT_TYPES } from './program-application-document-types';

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

    const preferredStartDate = new Date(dto.preferredStartDate);
    if (Number.isNaN(preferredStartDate.getTime())) {
      throw new BadRequestException('Invalid preferred start date');
    }

    const documentTypes = this.resolveDocumentTypes(dto.documentTypes, list.length);

    let facultyProgramId: string | null = null;
    if (dto.facultyProgramId) {
      const fp = await this.prisma.facultyProgram.findFirst({
        where: { id: dto.facultyProgramId, isPublished: true },
        select: { id: true, acceptingApplications: true },
      });
      if (!fp) {
        throw new BadRequestException('Invalid or unpublished faculty program');
      }
      if (!fp.acceptingApplications) {
        throw new BadRequestException(
          'This program is not accepting applications yet',
        );
      }
      facultyProgramId = fp.id;
    }

    const trackingToken = randomBytes(24).toString('hex');
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
            phone: dto.phone.trim(),
            dateOfBirth: dob,
            citizenship: dto.citizenship,
            preferredStartDate,
            supplementaryAnswers: dto.supplementaryAnswers ?? undefined,
            facultyProgramId,
            status: ProgramApplicationStatus.SUBMITTED,
            trackingToken,
          },
        });
        for (let i = 0; i < storedIds.length; i++) {
          await tx.programApplicationAttachment.create({
            data: {
              applicationId: app.id,
              storedFileId: storedIds[i],
              documentType: documentTypes[i],
            },
          });
        }
        return {
          id: app.id,
          trackingToken: app.trackingToken,
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

  async findByTrackingToken(token: string) {
    const row = await this.prisma.programApplication.findUnique({
      where: { trackingToken: token.trim() },
      select: {
        id: true,
        status: true,
        preferredStartDate: true,
        interviewScheduledAt: true,
        enrolledAt: true,
        createdAt: true,
        updatedAt: true,
        facultyProgram: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
    if (!row) {
      throw new NotFoundException();
    }
    return row;
  }

  findAllAdmin() {
    return this.prisma.programApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        facultyProgram: { select: { id: true, title: true, slug: true } },
        _count: { select: { attachments: true } },
      },
    });
  }

  async findOneAdmin(id: string) {
    const row = await this.prisma.programApplication.findUnique({
      where: { id },
      include: this.adminInclude(),
    });
    if (!row) {
      throw new NotFoundException();
    }
    return row;
  }

  async update(id: string, dto: UpdateProgramApplicationDto) {
    await this.findOneAdmin(id);
    if (
      dto.status === undefined &&
      dto.adminNotes === undefined &&
      dto.interviewScheduledAt === undefined &&
      dto.interviewNotes === undefined &&
      dto.enrolledAt === undefined
    ) {
      throw new BadRequestException('Provide at least one field to update');
    }

    const data: {
      status?: ProgramApplicationStatus;
      adminNotes?: string | null;
      interviewScheduledAt?: Date | null;
      interviewNotes?: string | null;
      enrolledAt?: Date | null;
    } = {};

    if (dto.status !== undefined) {
      data.status = dto.status;
      if (
        dto.status === ProgramApplicationStatus.ENROLLED &&
        dto.enrolledAt === undefined
      ) {
        data.enrolledAt = new Date();
      }
    }
    if (dto.adminNotes !== undefined) {
      data.adminNotes = dto.adminNotes.trim() || null;
    }
    if (dto.interviewScheduledAt !== undefined) {
      if (dto.interviewScheduledAt === null) {
        data.interviewScheduledAt = null;
      } else {
        const at = new Date(dto.interviewScheduledAt);
        if (Number.isNaN(at.getTime())) {
          throw new BadRequestException('Invalid interviewScheduledAt');
        }
        data.interviewScheduledAt = at;
      }
    }
    if (dto.interviewNotes !== undefined) {
      data.interviewNotes = dto.interviewNotes.trim() || null;
    }
    if (dto.enrolledAt !== undefined) {
      if (dto.enrolledAt === null) {
        data.enrolledAt = null;
      } else {
        const at = new Date(dto.enrolledAt);
        if (Number.isNaN(at.getTime())) {
          throw new BadRequestException('Invalid enrolledAt');
        }
        data.enrolledAt = at;
      }
    }

    return this.prisma.programApplication.update({
      where: { id },
      data,
      include: this.adminInclude(),
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

  private adminInclude() {
    return {
      facultyProgram: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          iconKey: true,
        },
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
    } as const;
  }

  private resolveDocumentTypes(
    documentTypes: string[] | undefined,
    fileCount: number,
  ): (string | null)[] {
    if (fileCount === 0) {
      return [];
    }
    if (!documentTypes || documentTypes.length === 0) {
      return Array.from({ length: fileCount }, () => 'other');
    }
    if (documentTypes.length !== fileCount) {
      throw new BadRequestException(
        'documentTypes must have the same length as uploaded files',
      );
    }
    for (const t of documentTypes) {
      if (
        !PROGRAM_APPLICATION_DOCUMENT_TYPES.includes(
          t as (typeof PROGRAM_APPLICATION_DOCUMENT_TYPES)[number],
        )
      ) {
        throw new BadRequestException(`Invalid document type: ${t}`);
      }
    }
    return documentTypes;
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
