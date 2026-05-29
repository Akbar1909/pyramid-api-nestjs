import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CareerQuizOptionInputDto } from './career-quiz-option-input.dto';

export class UpdateCareerQuizQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  stepOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  categoryLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  questionText?: string;

  @ApiPropertyOptional({
    description: 'Omit to keep image; send empty string to remove image.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  imageFileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quoteText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  quoteIconKey?: string;

  @ApiPropertyOptional({
    type: [CareerQuizOptionInputDto],
    description:
      'When sent, must be exactly three options (A/B/C) and replaces all options.',
    minItems: 3,
    maxItems: 3,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => CareerQuizOptionInputDto)
  options?: CareerQuizOptionInputDto[];

  @ApiPropertyOptional({
    description: 'Required when `options` is sent: 0 = A, 1 = B, 2 = C',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  correctOptionIndex?: number;
}
