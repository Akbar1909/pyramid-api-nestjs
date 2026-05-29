import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadedFileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d.jpg' })
  filename: string;

  @ApiPropertyOptional({
    example: 'campus-photo.jpg',
    description: 'Client-provided original filename when present',
  })
  originalName: string | null;

  @ApiProperty({ example: '/files/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d.jpg' })
  url: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType: string;

  @ApiProperty({ example: 128_000 })
  size: number;
}
