import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateEventDto } from './create-event.dto';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiPropertyOptional({
    description:
      'When true, clears `publishedAt` (draft). Ignored if `publishedAt` is also sent.',
  })
  @IsOptional()
  @IsBoolean()
  unpublish?: boolean;

  @ApiPropertyOptional({ description: 'Remove thumbnail from this event' })
  @IsOptional()
  @IsBoolean()
  clearThumbnail?: boolean;
}
