import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/** Creates an `ADMIN` user — requires server-side `ADMIN_REGISTRATION_SECRET`. */
export class RegisterAdminDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ngP@ss', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Must match the `ADMIN_REGISTRATION_SECRET` environment variable.',
    example: 'long-random-secret',
  })
  @IsString()
  @MinLength(8)
  registrationSecret: string;
}
