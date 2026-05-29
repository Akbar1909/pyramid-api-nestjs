import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/** Public self-registration as `APPLICANT`. */
export class RegisterApplicantDto {
  @ApiProperty({ example: 'applicant@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ngP@ss', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
