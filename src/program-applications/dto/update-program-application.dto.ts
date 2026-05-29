import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProgramApplicationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

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
}
