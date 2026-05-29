import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTourBookingDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiProperty({ example: '+1 555 0100' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone: string;

  @ApiProperty({
    example: 'Business Administration',
    description: 'Department or subject area for the visit',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  department: string;

  @ApiProperty({
    description:
      'ISO 8601 date-time for the selected visit slot (local offset allowed).',
    example: '2026-02-12T09:00:00-05:00',
  })
  @IsDateString()
  visitAt: string;
}
