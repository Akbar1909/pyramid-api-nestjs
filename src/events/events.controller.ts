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
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalCurrentUser } from '../auth/decorators/optional-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { RegisterForEventDto } from './dto/register-for-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventRegistrationDto } from './dto/update-event-registration.dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List events',
    description:
      'No auth: published events only. Valid admin JWT: includes drafts and items scheduled for a future publish time.',
  })
  findAll(@OptionalCurrentUser() user?: User) {
    return this.events.findAll(user);
  }

  @Post(':id/register')
  @ApiOperation({
    summary: 'Register for an event (public)',
    description:
      'No authentication. Requires a published event with registration enabled that has not started yet.',
  })
  register(@Param('id') id: string, @Body() dto: RegisterForEventDto) {
    return this.events.register(id, dto);
  }

  @Get(':id/registrations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List registrations for an event (admin)' })
  findRegistrations(@Param('id') id: string) {
    return this.events.findRegistrations(id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get event by id',
    description:
      'No auth: published only. Admin JWT: may load drafts or not-yet-published items.',
  })
  findOne(@Param('id') id: string, @OptionalCurrentUser() user?: User) {
    return this.events.findOne(id, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create event (admin)' })
  create(@CurrentUser() user: User, @Body() dto: CreateEventDto) {
    return this.events.create(user, dto);
  }

  @Patch('registrations/:registrationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update event registration (admin)',
    description: 'Typically used to set status to CANCELLED.',
  })
  updateRegistration(
    @Param('registrationId') registrationId: string,
    @Body() dto: UpdateEventRegistrationDto,
  ) {
    return this.events.updateRegistration(registrationId, dto);
  }

  @Delete('registrations/:registrationId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete event registration (admin)' })
  async removeRegistration(@Param('registrationId') registrationId: string) {
    await this.events.removeRegistration(registrationId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update event (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.events.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete event (admin)' })
  async remove(@Param('id') id: string) {
    await this.events.remove(id);
  }
}
