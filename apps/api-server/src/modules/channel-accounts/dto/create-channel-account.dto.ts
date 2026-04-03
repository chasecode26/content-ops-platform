import { IsIn, IsObject, IsOptional, IsString, Length } from "class-validator";

const ALLOWED_PLATFORM = ["WECHAT_OFFICIAL", "TOUTIAO"] as const;

export class CreateChannelAccountDto {
  @IsIn(ALLOWED_PLATFORM)
  platform!: (typeof ALLOWED_PLATFORM)[number];

  @IsString()
  @Length(1, 80)
  name!: string;

  @IsObject()
  credentials!: Record<string, string>;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}
