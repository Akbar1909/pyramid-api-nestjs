import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { requireImageStoredFileId } from '../files/require-image-stored-file';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

const authorSelect = { id: true, email: true, role: true } as const;
const thumbnailSelect = {
  id: true,
  url: true,
  mimeType: true,
  filename: true,
  originalName: true,
} as const;

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  private isAdmin(user?: User) {
    return user?.role === Role.ADMIN;
  }

  private publishedWhere(): Prisma.EventWhereInput {
    const now = new Date();
    return {
      publishedAt: { not: null, lte: now },
    };
  }

  findAll(user?: User) {
    const where = this.isAdmin(user) ? {} : this.publishedWhere();
    return this.prisma.event.findMany({
      where,
      orderBy: { startsAt: 'desc' },
      include: {
        author: { select: authorSelect },
        thumbnail: { select: thumbnailSelect },
      },
    });
  }

  async findOne(id: string, user?: User) {
    const row = await this.prisma.event.findUnique({
      where: { id },
      include: {
        author: { select: authorSelect },
        thumbnail: { select: thumbnailSelect },
      },
    });
    if (!row) {
      throw new NotFoundException();
    }
    if (this.isAdmin(user)) {
      return row;
    }
    const now = new Date();
    if (!row.publishedAt || row.publishedAt > now) {
      throw new NotFoundException();
    }
    return row;
  }

  async create(author: User, dto: CreateEventDto) {
    const thumbId = await requireImageStoredFileId(this.prisma, dto.thumbnailId);
    try {
      return await this.prisma.event.create({
        data: {
          title: dto.title.trim(),
          slug: dto.slug?.trim() || undefined,
          body: dto.body,
          startsAt: new Date(dto.startsAt),
          endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
          location: dto.location?.trim() || undefined,
          publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
          author: { connect: { id: author.id } },
          ...(thumbId
            ? { thumbnail: { connect: { id: thumbId } } }
            : {}),
        },
        include: {
          author: { select: authorSelect },
          thumbnail: { select: thumbnailSelect },
        },
      });
    } catch (e) {
      this.rethrowUnique(e);
    }
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.ensureExists(id);
    const data = await this.buildUpdateData(dto);
    try {
      return await this.prisma.event.update({
        where: { id },
        data,
        include: {
          author: { select: authorSelect },
          thumbnail: { select: thumbnailSelect },
        },
      });
    } catch (e) {
      this.rethrowUnique(e);
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.event.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException();
    }
  }

  private async buildUpdateData(
    dto: UpdateEventDto,
  ): Promise<Prisma.EventUpdateInput> {
    const { unpublish, clearThumbnail, ...rest } = dto;
    const data: Prisma.EventUpdateInput = {};

    if (rest.title !== undefined) {
      data.title = rest.title.trim();
    }
    if (rest.slug !== undefined) {
      data.slug = rest.slug?.trim() || null;
    }
    if (rest.body !== undefined) {
      data.body = rest.body;
    }
    if (rest.startsAt !== undefined) {
      data.startsAt = new Date(rest.startsAt);
    }
    if (rest.endsAt !== undefined) {
      data.endsAt = rest.endsAt ? new Date(rest.endsAt) : null;
    }
    if (rest.location !== undefined) {
      data.location = rest.location?.trim() || null;
    }

    if (rest.publishedAt !== undefined) {
      data.publishedAt = rest.publishedAt
        ? new Date(rest.publishedAt)
        : null;
    } else if (unpublish === true) {
      data.publishedAt = null;
    }

    if (rest.thumbnailId !== undefined) {
      const thumbId = await requireImageStoredFileId(
        this.prisma,
        rest.thumbnailId,
      );
      data.thumbnail = thumbId
        ? { connect: { id: thumbId } }
        : { disconnect: true };
    } else if (clearThumbnail === true) {
      data.thumbnail = { disconnect: true };
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
      throw new BadRequestException('Invalid thumbnailId');
    }
    throw e;
  }
}
