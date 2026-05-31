import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventRegistrationStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateEventRegistrationDto {
  @ApiPropertyOptional({ enum: EventRegistrationStatus })
  @IsOptional()
  @IsEnum(EventRegistrationStatus)
  status?: EventRegistrationStatus;
}
