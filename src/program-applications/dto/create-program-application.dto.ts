import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PROGRAM_APPLICATION_DOCUMENT_TYPES } from '../program-application-document-types';

const CITIZENSHIP = ['CA', 'US', 'UK', 'INT'] as const;

function parseJsonFormValue(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'object') {
    return value;
  }
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export class CreateProgramApplicationDto {
  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  lastName: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiProperty({ example: '+1 416 555 0100' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone: string;

  @ApiProperty({
    description: 'Date of birth as ISO 8601 date (YYYY-MM-DD).',
    example: '2001-04-15',
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ enum: CITIZENSHIP, example: 'CA' })
  @IsString()
  @IsIn([...CITIZENSHIP])
  citizenship: string;

  @ApiProperty({
    description: 'Preferred program start date (YYYY-MM-DD).',
    example: '2026-09-01',
  })
  @IsDateString()
  preferredStartDate: string;

  @ApiPropertyOptional({
    description: 'Published `FacultyProgram` id when the applicant chose a program.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value !== 'string') {
      return value;
    }
    const t = value.trim();
    return t.length === 0 ? undefined : t;
  })
  @IsString()
  @MaxLength(64)
  facultyProgramId?: string;

  @ApiPropertyOptional({
    description:
      'JSON object of supplementary question answers, e.g. `{"whyProgram":"…"}`. Send as a JSON string in multipart forms.',
    example: { whyProgram: 'I want to work in cardiac care.' },
  })
  @IsOptional()
  @Transform(({ value }) => parseJsonFormValue(value))
  @IsObject()
  supplementaryAnswers?: Record<string, string>;

  @ApiPropertyOptional({
    description:
      'Document types aligned with uploaded `files` by index. JSON array or comma-separated string.',
    enum: PROGRAM_APPLICATION_DOCUMENT_TYPES,
    example: ['transcript', 'government_id'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseJsonFormValue(value);
    if (parsed === undefined) {
      return undefined;
    }
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (typeof parsed === 'string') {
      return parsed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return parsed;
  })
  @IsArray()
  @IsIn([...PROGRAM_APPLICATION_DOCUMENT_TYPES], { each: true })
  documentTypes?: string[];
}
