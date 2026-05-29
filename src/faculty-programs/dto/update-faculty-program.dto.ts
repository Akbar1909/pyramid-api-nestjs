import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { FACULTY_PROGRAM_ICON_KEYS } from '../faculty-program-icons';

export class UpdateFacultyProgramDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Optional HTML; omit to leave unchanged, send null to clear.',
  })
  @IsOptional()
  @IsString()
  body?: string | null;

  @ApiPropertyOptional({ enum: FACULTY_PROGRAM_ICON_KEYS })
  @IsOptional()
  @IsString()
  @IsIn([...FACULTY_PROGRAM_ICON_KEYS])
  iconKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
