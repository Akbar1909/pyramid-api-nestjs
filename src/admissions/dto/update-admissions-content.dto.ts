import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAdmissionsContentDto {
  @ApiPropertyOptional({
    description: 'Intro HTML for the admissions page (overview + application process).',
  })
  @IsOptional()
  @IsString()
  introHtml?: string | null;

  @ApiPropertyOptional({
    type: [String],
    example: [
      'Ontario Secondary School Diploma (OSSD) or equivalent',
      'Proof of English proficiency (Grade 11/12 English Credit accepted)',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  generalRequirements?: string[];
}
