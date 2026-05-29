import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { ensureUserProfile } from '../prisma/ensure-user-profile';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateApplicantProfileDto } from './dto/update-applicant-profile.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(user: User) {
    await this.ensureProfile(user.id);
    return this.formatUserProfile(
      await this.prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          role: true,
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatarUrl: true,
              createdAt: true,
              updatedAt: true,
              applicant: true,
              student: true,
            },
          },
        },
      }),
    );
  }

  async updateMine(user: User, dto: UpdateProfileDto) {
    if (dto.applicant !== undefined && user.role !== Role.APPLICANT) {
      throw new BadRequestException(
        'Applicant fields can only be updated when your role is APPLICANT.',
      );
    }
    if (dto.student !== undefined && user.role !== Role.STUDENT) {
      throw new BadRequestException(
        'Student fields can only be updated when your role is STUDENT.',
      );
    }

    const profile = await ensureUserProfile(this.prisma, user.id);
    if (!profile) {
      throw new InternalServerErrorException('Profile could not be resolved');
    }

    const data: Prisma.ProfileUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (Object.keys(data).length > 0) {
      await this.prisma.profile.update({
        where: { userId: user.id },
        data,
      });
    }

    if (dto.applicant !== undefined) {
      await this.upsertApplicant(profile.id, dto.applicant);
    }
    if (dto.student !== undefined) {
      await this.upsertStudent(profile.id, dto.student);
    }

    return this.getMine(user);
  }

  private async ensureProfile(userId: string) {
    await ensureUserProfile(this.prisma, userId);
  }

  private async upsertApplicant(
    profileId: string,
    dto: UpdateApplicantProfileDto,
  ) {
    const update: Prisma.ApplicantProfileUpdateInput = {};
    if (dto.intendedProgram !== undefined) {
      update.intendedProgram = dto.intendedProgram;
    }
    if (dto.highestEducation !== undefined) {
      update.highestEducation = dto.highestEducation;
    }
    await this.prisma.applicantProfile.upsert({
      where: { profileId },
      create: {
        profileId,
        intendedProgram: dto.intendedProgram,
        highestEducation: dto.highestEducation,
      },
      update,
    });
  }

  private async upsertStudent(
    profileId: string,
    dto: UpdateStudentProfileDto,
  ) {
    const update: Prisma.StudentProfileUpdateInput = {};
    if (dto.studentNumber !== undefined) {
      update.studentNumber = dto.studentNumber;
    }
    if (dto.enrolledAt !== undefined) {
      update.enrolledAt = dto.enrolledAt
        ? new Date(dto.enrolledAt)
        : null;
    }
    await this.prisma.studentProfile.upsert({
      where: { profileId },
      create: {
        profileId,
        studentNumber: dto.studentNumber,
        enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : undefined,
      },
      update,
    });
  }

  private formatUserProfile(row: {
    id: string;
    email: string;
    role: User['role'];
    profile: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      avatarUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
      applicant: {
        id: string;
        profileId: string;
        intendedProgram: string | null;
        highestEducation: string | null;
        createdAt: Date;
        updatedAt: Date;
      } | null;
      student: {
        id: string;
        profileId: string;
        studentNumber: string | null;
        enrolledAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
      } | null;
    };
  }) {
    const { profile, ...user } = row;
    return {
      user,
      profile: {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        avatarUrl: profile.avatarUrl,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        applicant: profile.applicant,
        student: profile.student,
      },
    };
  }
}
