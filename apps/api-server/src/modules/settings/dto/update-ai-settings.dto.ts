import { IsOptional, IsString, Length } from "class-validator";

export class UpdateAiSettingsDto {
  @IsString()
  @Length(1, 500)
  baseUrl!: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsString()
  @Length(1, 200)
  model!: string;
}
