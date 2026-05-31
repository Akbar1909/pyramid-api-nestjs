import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class RegisterForEventDto {
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
}
