import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdmissionsService } from './admissions.service';
import { UpdateAdmissionsContentDto } from './dto/update-admissions-content.dto';

@ApiTags('Admissions')
@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissions: AdmissionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get admissions page content (public)',
    description:
      'Site-wide intro copy and general admission requirements for the admissions page.',
  })
  getPublic() {
    return this.admissions.getPublic();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update admissions page content (admin)' })
  update(@Body() dto: UpdateAdmissionsContentDto) {
    return this.admissions.update(dto);
  }
}
