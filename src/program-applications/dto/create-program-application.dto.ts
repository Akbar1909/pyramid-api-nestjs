import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const CITIZENSHIP = ['CA', 'US', 'UK', 'INT'] as const;

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
}
