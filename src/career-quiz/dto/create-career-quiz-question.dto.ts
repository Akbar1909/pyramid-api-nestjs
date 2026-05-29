import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CareerQuizOptionInputDto } from './career-quiz-option-input.dto';

export class CreateCareerQuizQuestionDto {
  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  stepOrder: number;

  @ApiProperty({ example: 'Environmental preference' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  categoryLabel: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiPropertyOptional({
    description: 'StoredFile id from POST /files/upload (image only)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  imageFileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quoteText?: string;

  @ApiPropertyOptional({
    description: 'Small icon hint for the quote row (e.g. microscope)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  quoteIconKey?: string;

  @ApiProperty({
    description: 'Exactly three entries: A, B, then C.',
    type: [CareerQuizOptionInputDto],
    minItems: 3,
    maxItems: 3,
  })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => CareerQuizOptionInputDto)
  options: CareerQuizOptionInputDto[];

  @ApiProperty({
    example: 1,
    description: 'Which choice is correct: 0 = A, 1 = B, 2 = C',
  })
  @IsInt()
  @Min(0)
  @Max(2)
  correctOptionIndex: number;
}
