import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacultyProgramDto } from './dto/create-faculty-program.dto';
import { UpdateFacultyProgramDto } from './dto/update-faculty-program.dto';

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
    });
  }

  findAllAdmin() {
    return this.prisma.facultyProgram.findMany({
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async findOne(id: string, user?: User) {
    const row = await this.prisma.facultyProgram.findUnique({ where: { id } });
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

  create(dto: CreateFacultyProgramDto) {
    return this.prisma.facultyProgram.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        body: dto.body?.trim() || null,
        iconKey: dto.iconKey,
        sortOrder: dto.sortOrder ?? 0,
        isPublished: dto.isPublished ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateFacultyProgramDto) {
    await this.findOneAdmin(id);
    const data: Prisma.FacultyProgramUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title.trim();
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
    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }
    if (dto.isPublished !== undefined) {
      data.isPublished = dto.isPublished;
    }
    return this.prisma.facultyProgram.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.facultyProgram.delete({ where: { id } });
  }
}
