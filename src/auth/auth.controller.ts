import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RegisterApplicantDto } from './dto/register-applicant.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login (all roles)' })
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('register/applicant')
  @ApiOperation({ summary: 'Register as applicant (public)' })
  @ApiOkResponse({ type: AuthResponseDto })
  registerApplicant(@Body() dto: RegisterApplicantDto) {
    return this.auth.registerApplicant(dto);
  }

  @Post('register/student')
  @ApiOperation({
    summary: 'Register as student',
    description:
      'Requires `STUDENT_REGISTRATION_CODE` to match the server environment variable.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  registerStudent(@Body() dto: RegisterStudentDto) {
    return this.auth.registerStudent(dto);
  }

  @Post('register/admin')
  @ApiOperation({
    summary: 'Register as admin',
    description:
      'Requires `ADMIN_REGISTRATION_SECRET` to match the server environment variable.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  registerAdmin(@Body() dto: RegisterAdminDto) {
    return this.auth.registerAdmin(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Current user from JWT' })
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  @Get('admin-only-example')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Example route restricted to ADMIN' })
  adminPing() {
    return { ok: true };
  }
}
