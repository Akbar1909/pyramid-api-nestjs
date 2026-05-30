import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
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

  @ApiPropertyOptional({ example: 'cardiac-sonography' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

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

  @ApiPropertyOptional({
    description: '`StoredFile` id from POST /files/upload (image MIME types only)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  imageFileId?: string;

  @ApiPropertyOptional({ example: '18 months' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  duration?: string;

  @ApiPropertyOptional({ example: 'Diploma' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  credentialType?: string;

  @ApiPropertyOptional({ example: 'Full-time, in-person' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  format?: string;

  @ApiPropertyOptional({ example: 600 })
  @IsOptional()
  @IsInt()
  @Min(0)
  practicumHours?: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['OSSD or equivalent', 'Grade 12 English (minimum 60%)'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  admissionRequirements?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Police Vulnerable Sector Check', 'Up-to-date immunizations'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  clinicalRequirements?: string[];

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
