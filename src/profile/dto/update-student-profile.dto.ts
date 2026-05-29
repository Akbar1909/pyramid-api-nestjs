import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

/** Only accepted when `User.role` is `STUDENT`. */
export class UpdateStudentProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  studentNumber?: string;

  @IsOptional()
  @IsDateString()
  enrolledAt?: string;
}
