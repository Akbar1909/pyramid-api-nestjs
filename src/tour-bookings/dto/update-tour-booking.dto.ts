import { ApiPropertyOptional } from '@nestjs/swagger';
import { TourBookingStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTourBookingDto {
  @ApiPropertyOptional({ enum: TourBookingStatus })
  @IsOptional()
  @IsEnum(TourBookingStatus)
  status?: TourBookingStatus;

  @ApiPropertyOptional({
    description: 'Internal notes visible only to admins',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  adminNotes?: string;
}
