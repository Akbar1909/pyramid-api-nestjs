import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProgramApplicationStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateProgramApplicationDto {
  @ApiPropertyOptional({ enum: ProgramApplicationStatus })
  @IsOptional()
  @IsEnum(ProgramApplicationStatus)
  status?: ProgramApplicationStatus;

  @ApiPropertyOptional({
    description: 'Internal notes visible only to admins',
  })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  adminNotes?: string;

  @ApiPropertyOptional({
    description: 'When an interview or entrance assessment is scheduled.',
  })
  @IsOptional()
  @IsDateString()
  interviewScheduledAt?: string | null;

  @ApiPropertyOptional({
    description: 'Notes from the interview or assessment.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  interviewNotes?: string | null;

  @ApiPropertyOptional({
    description: 'Set when the applicant confirms enrollment.',
  })
  @IsOptional()
  @IsDateString()
  enrolledAt?: string | null;
}
