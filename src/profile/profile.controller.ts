import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

/**
 * Shared profile fields for all roles; `applicant` / `student` payloads only for
 * `APPLICANT` / `STUDENT` (see `UpdateProfileDto`).
 */
@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile bundle' })
  getMine(@CurrentUser() user: User) {
    return this.profile.getMine(user);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile' })
  updateMine(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.profile.updateMine(user, dto);
  }
}
