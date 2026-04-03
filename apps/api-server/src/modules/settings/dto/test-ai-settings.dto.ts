import { IsOptional, IsString, Length } from "class-validator";

export class TestAiSettingsDto {
  @IsOptional()
  @IsString()
  @Length(1, 500)
  baseUrl?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  model?: string;
}
