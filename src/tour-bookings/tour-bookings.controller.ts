import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateTourBookingDto } from './dto/create-tour-booking.dto';
import { UpdateTourBookingDto } from './dto/update-tour-booking.dto';
import { TourBookingsService } from './tour-bookings.service';

@ApiTags('Tour bookings')
@Controller('tour-bookings')
export class TourBookingsController {
  constructor(private readonly tourBookings: TourBookingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit a tour booking (public)',
    description:
      'No authentication. Used by the public “Book a tour” form. `visitAt` must be in the future.',
  })
  create(@Body() dto: CreateTourBookingDto) {
    return this.tourBookings.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List tour bookings (admin)' })
  findAll() {
    return this.tourBookings.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get tour booking by id (admin)' })
  findOne(@Param('id') id: string) {
    return this.tourBookings.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update tour booking (admin)',
    description: 'Typically used to set status or internal admin notes.',
  })
  update(@Param('id') id: string, @Body() dto: UpdateTourBookingDto) {
    return this.tourBookings.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete tour booking (admin)' })
  async remove(@Param('id') id: string) {
    await this.tourBookings.remove(id);
  }
}
