import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateNewsDto } from './create-news.dto';

export class UpdateNewsDto extends PartialType(CreateNewsDto) {
  @ApiPropertyOptional({
    description:
      'When true, clears `publishedAt` (draft). Ignored if `publishedAt` is also sent.',
  })
  @IsOptional()
  @IsBoolean()
  unpublish?: boolean;

  @ApiPropertyOptional({ description: 'Remove thumbnail from this article' })
  @IsOptional()
  @IsBoolean()
  clearThumbnail?: boolean;
}
