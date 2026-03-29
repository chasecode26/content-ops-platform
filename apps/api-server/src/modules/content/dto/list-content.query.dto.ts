import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

const ALLOWED_STATUS = [
  "DRAFT",
  "READY_FOR_REVIEW",
  "APPROVED",
  "RENDERED",
  "PUBLISHED",
  "ARCHIVED",
  "FAILED",
] as const;

export class ListContentQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize = 20;

  @IsOptional()
  @IsIn(ALLOWED_STATUS)
  status?: (typeof ALLOWED_STATUS)[number];

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  tag?: string;
}
