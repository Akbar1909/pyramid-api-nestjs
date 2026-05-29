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
import { CreateFacultyProgramDto } from './dto/create-faculty-program.dto';
import { UpdateFacultyProgramDto } from './dto/update-faculty-program.dto';
import { FacultyProgramsService } from './faculty-programs.service';

@ApiTags('Faculty programs')
@Controller('faculty-programs')
export class FacultyProgramsController {
  constructor(private readonly facultyPrograms: FacultyProgramsService) {}

  @Get('published')
  @ApiOperation({
    summary: 'List published faculty programs (public)',
    description:
      'Ordered by `sortOrder` for the homepage “Our Specialized Faculty” section.',
  })
  findPublished() {
    return this.facultyPrograms.findPublished();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all faculty programs (admin)' })
  findAllAdmin() {
    return this.facultyPrograms.findAllAdmin();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get faculty program by id (admin)' })
  findOneAdmin(@Param('id') id: string) {
    return this.facultyPrograms.findOneAdmin(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create faculty program (admin)' })
  create(@Body() dto: CreateFacultyProgramDto) {
    return this.facultyPrograms.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update faculty program (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateFacultyProgramDto) {
    return this.facultyPrograms.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete faculty program (admin)' })
  async remove(@Param('id') id: string) {
    await this.facultyPrograms.remove(id);
  }
}
