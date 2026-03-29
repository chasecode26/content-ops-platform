import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Min } from "class-validator";

const ALLOWED_STATUS = [
  "PENDING",
  "RENDERING",
  "WAITING_REVIEW",
  "READY_TO_PUSH",
  "PUSHING",
  "DRAFTED",
  "SCHEDULED",
  "PUBLISHED",
  "FAILED",
  "CANCELED",
] as const;

export class ListDraftsQueryDto {
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
}
