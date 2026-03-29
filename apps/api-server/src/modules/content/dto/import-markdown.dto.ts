import { IsArray, IsEnum, IsOptional, IsString, Length, MaxLength } from "class-validator";

export enum ContentSourceType {
  Manual = "MANUAL",
  Markdown = "MARKDOWN",
}

export class ImportMarkdownDto {
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
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsEnum(ContentSourceType)
  sourceType!: ContentSourceType;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  canonicalUrl?: string | null;
}
