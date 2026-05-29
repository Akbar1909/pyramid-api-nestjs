import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { requireImageStoredFileId } from '../files/require-image-stored-file';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

const authorSelect = { id: true, email: true, role: true } as const;
const thumbnailSelect = {
  id: true,
  url: true,
  mimeType: true,
  filename: true,
  originalName: true,
} as const;

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  private isAdmin(user?: User) {
    return user?.role === Role.ADMIN;
  }

  private publishedWhere(): Prisma.NewsWhereInput {
    const now = new Date();
    return {
      publishedAt: { not: null, lte: now },
    };
  }

  findAll(user?: User) {
    const where = this.isAdmin(user) ? {} : this.publishedWhere();
    return this.prisma.news.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: authorSelect },
        thumbnail: { select: thumbnailSelect },
      },
    });
  }

  async findOne(id: string, user?: User) {
    const row = await this.prisma.news.findUnique({
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

  /**
   * Public detail: resolve by unique `slug` first, then by `id` (cuid).
   * Admins may load drafts or scheduled posts the same way.
   */
  async findPublishedBySlugOrId(slugOrId: string, user?: User) {
    const key = slugOrId.trim();
    if (!key) {
      throw new NotFoundException();
    }
    const include = {
      author: { select: authorSelect },
      thumbnail: { select: thumbnailSelect },
    } as const;

    if (this.isAdmin(user)) {
      const bySlug = await this.prisma.news.findFirst({
        where: { slug: key },
        include,
      });
      if (bySlug) {
        return bySlug;
      }
      const byId = await this.prisma.news.findUnique({
        where: { id: key },
        include,
      });
      if (!byId) {
        throw new NotFoundException();
      }
      return byId;
    }

    const now = new Date();
    const published: Prisma.NewsWhereInput = {
      publishedAt: { not: null, lte: now },
    };

    const bySlug = await this.prisma.news.findFirst({
      where: { slug: key, ...published },
      include,
    });
    if (bySlug) {
      return bySlug;
    }
    const byId = await this.prisma.news.findFirst({
      where: { id: key, ...published },
      include,
    });
    if (!byId) {
      throw new NotFoundException();
    }
    return byId;
  }

  async create(author: User, dto: CreateNewsDto) {
    const thumbId = await requireImageStoredFileId(this.prisma, dto.thumbnailId);
    try {
      return await this.prisma.news.create({
        data: {
          title: dto.title.trim(),
          slug: dto.slug?.trim() || undefined,
          body: dto.body,
          publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
          author: { connect: { id: author.id } },
          ...(thumbId ? { thumbnail: { connect: { id: thumbId } } } : {}),
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

  async update(id: string, dto: UpdateNewsDto) {
    await this.ensureExists(id);
    const data = await this.buildUpdateData(dto);
    try {
      return await this.prisma.news.update({
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
    await this.prisma.news.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.news.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException();
    }
  }

  private async buildUpdateData(
    dto: UpdateNewsDto,
  ): Promise<Prisma.NewsUpdateInput> {
    const { unpublish, clearThumbnail, ...rest } = dto;
    const data: Prisma.NewsUpdateInput = {};

    if (rest.title !== undefined) {
      data.title = rest.title.trim();
    }
    if (rest.slug !== undefined) {
      data.slug = rest.slug?.trim() || null;
    }
    if (rest.body !== undefined) {
      data.body = rest.body;
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
