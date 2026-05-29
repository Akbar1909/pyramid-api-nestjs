import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ensureUserProfile } from '../prisma/ensure-user-profile';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './types/jwt-payload.type';
import { LoginDto } from './dto/login.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RegisterApplicantDto } from './dto/register-applicant.dto';
import { RegisterStudentDto } from './dto/register-student.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async registerApplicant(dto: RegisterApplicantDto) {
    await this.assertEmailAvailable(dto.email);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: Role.APPLICANT,
        profile: {
          create: {
            applicant: { create: {} },
          },
        },
      },
    });
    return this.buildAuthResponse(user);
  }

  async registerStudent(dto: RegisterStudentDto) {
    const expected = this.config.get<string>('STUDENT_REGISTRATION_CODE');
    if (!expected) {
      throw new ForbiddenException('Student registration is not enabled');
    }
    if (dto.registrationCode !== expected) {
      throw new UnauthorizedException('Invalid registration code');
    }
    await this.assertEmailAvailable(dto.email);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: Role.STUDENT,
        profile: {
          create: {
            student: { create: {} },
          },
        },
      },
    });
    return this.buildAuthResponse(user);
  }

  async registerAdmin(dto: RegisterAdminDto) {
    const expected = this.config.get<string>('ADMIN_REGISTRATION_SECRET');
    if (!expected) {
      throw new ForbiddenException('Admin registration is not enabled');
    }
    if (dto.registrationSecret !== expected) {
      throw new UnauthorizedException('Invalid registration secret');
    }
    await this.assertEmailAvailable(dto.email);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: Role.ADMIN,
        profile: { create: {} },
      },
    });
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await ensureUserProfile(this.prisma, user.id);
    return this.buildAuthResponse(user);
  }

  private async assertEmailAvailable(email: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
  }

  private buildAuthResponse(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
