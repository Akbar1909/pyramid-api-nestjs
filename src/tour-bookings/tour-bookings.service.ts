import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TourBookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTourBookingDto } from './dto/create-tour-booking.dto';
import { UpdateTourBookingDto } from './dto/update-tour-booking.dto';

@Injectable()
export class TourBookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTourBookingDto) {
    const visitAt = new Date(dto.visitAt);
    if (Number.isNaN(visitAt.getTime())) {
      throw new BadRequestException('Invalid visit date/time');
    }
    const now = new Date();
    if (visitAt.getTime() <= now.getTime()) {
      throw new BadRequestException('Visit must be scheduled in the future');
    }

    return this.prisma.tourBooking.create({
      data: {
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone.trim(),
        department: dto.department.trim(),
        visitAt,
        status: TourBookingStatus.PENDING,
      },
    });
  }

  findAll() {
    return this.prisma.tourBooking.findMany({
      orderBy: [{ visitAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.tourBooking.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException();
    }
    return row;
  }

  async update(id: string, dto: UpdateTourBookingDto) {
    await this.findOne(id);
    if (dto.status === undefined && dto.adminNotes === undefined) {
      throw new BadRequestException('Provide at least one of status or adminNotes');
    }
    return this.prisma.tourBooking.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.adminNotes !== undefined
          ? { adminNotes: dto.adminNotes.trim() || null }
          : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.tourBooking.delete({ where: { id } });
  }
}
