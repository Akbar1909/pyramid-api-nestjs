import { ApiProperty } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({
    enum: ['ADMIN', 'CONTENT_MANAGER', 'APPLICANT', 'STUDENT'],
  })
  role: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT bearer token' })
  accessToken: string;

  @ApiProperty({ type: AuthUserResponseDto })
  user: AuthUserResponseDto;
}
