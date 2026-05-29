import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { FACULTY_PROGRAM_ICON_KEYS } from '../faculty-program-icons';

export class CreateFacultyProgramDto {
  @ApiProperty({ example: 'Cardiac Sonography (Echo)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @ApiProperty({
    example: 'Advanced cardiovascular imaging techniques and diagnostic mastery.',
    description: 'Plain text; shown as the short blurb on homepage cards.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Optional HTML from the rich editor for extended program detail.',
  })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty({
    enum: FACULTY_PROGRAM_ICON_KEYS,
    example: 'cardiac',
  })
  @IsString()
  @IsIn([...FACULTY_PROGRAM_ICON_KEYS])
  iconKey: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
