import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAdmissionsContentDto } from './dto/update-admissions-content.dto';

const SITE_ID = 'site';

@Injectable()
export class AdmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublic() {
    const row = await this.prisma.admissionsContent.findUnique({
      where: { id: SITE_ID },
    });
    if (!row) {
      return {
        id: SITE_ID,
        introHtml: null,
        generalRequirements: [],
        updatedAt: new Date(0).toISOString(),
      };
    }
    return row;
  }

  async update(dto: UpdateAdmissionsContentDto) {
    const data: Prisma.AdmissionsContentUpdateInput = {};
    if (dto.introHtml !== undefined) {
      data.introHtml =
        dto.introHtml === null
          ? null
          : dto.introHtml.trim()
            ? dto.introHtml.trim()
            : null;
    }
    if (dto.generalRequirements !== undefined) {
      data.generalRequirements = dto.generalRequirements;
    }
    return this.prisma.admissionsContent.upsert({
      where: { id: SITE_ID },
      create: {
        id: SITE_ID,
        introHtml:
          dto.introHtml === undefined || dto.introHtml === null
            ? null
            : dto.introHtml.trim() || null,
        generalRequirements: dto.generalRequirements ?? [],
      },
      update: data,
    });
  }
}
