import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Only accepted when `User.role` is `APPLICANT`. */
export class UpdateApplicantProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  intendedProgram?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  highestEducation?: string;
}
