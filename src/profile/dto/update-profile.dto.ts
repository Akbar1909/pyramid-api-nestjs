import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { UpdateApplicantProfileDto } from './update-applicant-profile.dto';
import { UpdateStudentProfileDto } from './update-student-profile.dto';

export class UpdateProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateApplicantProfileDto)
  applicant?: UpdateApplicantProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateStudentProfileDto)
  student?: UpdateStudentProfileDto;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string;
}
