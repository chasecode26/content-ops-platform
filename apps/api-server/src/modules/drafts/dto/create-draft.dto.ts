import { IsIn, IsString } from "class-validator";

const ALLOWED_PLATFORM = ["WECHAT_OFFICIAL"] as const;

export class CreateDraftDto {
  @IsString()
  contentId!: string;

  @IsString()
  versionId!: string;

  @IsString()
  channelAccountId!: string;

  @IsString()
  themeCode!: string;

  @IsIn(ALLOWED_PLATFORM)
  platform!: (typeof ALLOWED_PLATFORM)[number];
}
