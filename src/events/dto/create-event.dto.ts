import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: 'Open house' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @ApiPropertyOptional({ example: 'open-house-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @ApiProperty({ example: 'Join us on campus…' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ example: '2026-05-01T18:00:00.000Z' })
  @IsDateString()
  startsAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional({
    description:
      'When set and not in the future, the event is public. Omit for a draft.',
  })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({
    description: '`StoredFile` id from POST /files/upload (image MIME types only)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  thumbnailId?: string;
}
