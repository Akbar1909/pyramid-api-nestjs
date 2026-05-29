import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/** Self-registration as `STUDENT` — requires server-side `STUDENT_REGISTRATION_CODE`. */
export class RegisterStudentDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ngP@ss', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Must match the `STUDENT_REGISTRATION_CODE` environment variable.',
    example: 'your-shared-student-code',
  })
  @IsString()
  @MinLength(4)
  registrationCode: string;
}
