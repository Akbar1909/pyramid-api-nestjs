import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { requireImageStoredFileId } from '../files/require-image-stored-file';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacultyProgramDto } from './dto/create-faculty-program.dto';
import { UpdateFacultyProgramDto } from './dto/update-faculty-program.dto';

const imageSelect = {
  id: true,
  url: true,
  mimeType: true,
  filename: true,
  originalName: true,
} as const;

const includePublic = {
  imageFile: { select: imageSelect },
} as const;

@Injectable()
export class FacultyProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  private isAdmin(user?: User) {
    return user?.role === Role.ADMIN;
  }

  findPublished() {
    return this.prisma.facultyProgram.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      include: includePublic,
    });
  }

  findAllAdmin() {
    return this.prisma.facultyProgram.findMany({
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      include: includePublic,
    });
  }

  async findOne(key: string, user?: User) {
    const trimmed = key.trim();
    const row =
      (await this.prisma.facultyProgram.findFirst({
        where: { slug: trimmed },
        include: includePublic,
      })) ??
      (await this.prisma.facultyProgram.findUnique({
        where: { id: trimmed },
        include: includePublic,
      }));
    if (!row) {
      throw new NotFoundException();
    }
    if (this.isAdmin(user)) {
      return row;
    }
    if (!row.isPublished) {
      throw new NotFoundException();
    }
    return row;
  }

  findOneAdmin(id: string) {
    return this.findOne(id, { role: Role.ADMIN } as User);
  }

  async create(dto: CreateFacultyProgramDto) {
    const imageFileId = await requireImageStoredFileId(
      this.prisma,
      dto.imageFileId,
    );
    try {
      return await this.prisma.facultyProgram.create({
        data: {
          title: dto.title.trim(),
          slug: dto.slug?.trim() || undefined,
          description: dto.description.trim(),
          body: dto.body?.trim() || null,
          iconKey: dto.iconKey,
          imageFileId,
          duration: dto.duration?.trim() || null,
          credentialType: dto.credentialType?.trim() || null,
          format: dto.format?.trim() || null,
          practicumHours: dto.practicumHours ?? null,
          admissionRequirements: dto.admissionRequirements ?? undefined,
          clinicalRequirements: dto.clinicalRequirements ?? undefined,
          sortOrder: dto.sortOrder ?? 0,
          isPublished: dto.isPublished ?? true,
        },
        include: includePublic,
      });
    } catch (e) {
      this.rethrowUnique(e);
    }
  }

  async update(id: string, dto: UpdateFacultyProgramDto) {
    await this.findOneAdmin(id);
    const data = await this.buildUpdateData(dto);
    try {
      return await this.prisma.facultyProgram.update({
        where: { id },
        data,
        include: includePublic,
      });
    } catch (e) {
      this.rethrowUnique(e);
    }
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.facultyProgram.delete({ where: { id } });
  }

  private async buildUpdateData(dto: UpdateFacultyProgramDto) {
    const data: Prisma.FacultyProgramUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title.trim();
    }
    if (dto.slug !== undefined) {
      data.slug =
        dto.slug === null ? null : dto.slug.trim() ? dto.slug.trim() : null;
    }
    if (dto.description !== undefined) {
      data.description = dto.description.trim();
    }
    if (dto.body !== undefined) {
      data.body =
        dto.body === null ? null : dto.body.trim() ? dto.body.trim() : null;
    }
    if (dto.iconKey !== undefined) {
      data.iconKey = dto.iconKey;
    }
    if (dto.imageFileId !== undefined) {
      if (dto.imageFileId === null) {
        data.imageFile = { disconnect: true };
      } else {
        const imageFileId = await requireImageStoredFileId(
          this.prisma,
          dto.imageFileId,
        );
        if (imageFileId) {
          data.imageFile = { connect: { id: imageFileId } };
        }
      }
    }
    if (dto.duration !== undefined) {
      data.duration =
        dto.duration === null
          ? null
          : dto.duration.trim()
            ? dto.duration.trim()
            : null;
    }
    if (dto.credentialType !== undefined) {
      data.credentialType =
        dto.credentialType === null
          ? null
          : dto.credentialType.trim()
            ? dto.credentialType.trim()
            : null;
    }
    if (dto.format !== undefined) {
      data.format =
        dto.format === null
          ? null
          : dto.format.trim()
            ? dto.format.trim()
            : null;
    }
    if (dto.practicumHours !== undefined) {
      data.practicumHours = dto.practicumHours;
    }
    if (dto.admissionRequirements !== undefined) {
      data.admissionRequirements =
        dto.admissionRequirements === null
          ? Prisma.JsonNull
          : dto.admissionRequirements;
    }
    if (dto.clinicalRequirements !== undefined) {
      data.clinicalRequirements =
        dto.clinicalRequirements === null
          ? Prisma.JsonNull
          : dto.clinicalRequirements;
    }
    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }
    if (dto.isPublished !== undefined) {
      data.isPublished = dto.isPublished;
    }
    return data;
  }

  private rethrowUnique(e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      throw new ConflictException('Slug is already in use');
    }
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2003'
    ) {
      throw new BadRequestException('Invalid imageFileId');
    }
    throw e;
  }
}
