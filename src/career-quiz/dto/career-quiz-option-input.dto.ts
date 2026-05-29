import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** One of three choices (A/B/C); label and sort order are set by the API. */
export class CareerQuizOptionInputDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(400)
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;
}
