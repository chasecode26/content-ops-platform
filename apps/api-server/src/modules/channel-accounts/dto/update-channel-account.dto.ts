import { IsObject, IsOptional, IsString, Length } from "class-validator";

export class UpdateChannelAccountDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  name?: string;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, string>;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}
