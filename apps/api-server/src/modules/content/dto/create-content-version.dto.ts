import { IsOptional, IsString, Length, MaxLength } from "class-validator";

export class CreateContentVersionDto {
  @IsString()
  @Length(1, 120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  summary?: string;

  @IsString()
  @Length(1)
  markdownBody!: string;

  @IsOptional()
  @IsString()
  changeSummary?: string;
}
