import { IsIn, IsString, Length } from "class-validator";

const ALLOWED_PLATFORM = ["WECHAT_OFFICIAL", "TOUTIAO"] as const;

export class RenderThemePreviewDto {
  @IsString()
  themeCode!: string;

  @IsIn(ALLOWED_PLATFORM)
  platform!: (typeof ALLOWED_PLATFORM)[number];

  @IsString()
  @Length(1)
  markdownBody!: string;

  @IsString()
  @Length(1, 120)
  title!: string;
}
