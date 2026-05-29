import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateNewsDto {
  @ApiProperty({ example: 'Spring registration opens' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @ApiPropertyOptional({ example: 'spring-registration-opens' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({
    description:
      'When set and not in the future, the article is public. Omit for a draft.',
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
