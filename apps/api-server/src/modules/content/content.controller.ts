import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";

import { ok } from "../../common/http-response";
import { normalizeUserId } from "../../common/user-context";
import { ContentService } from "./content.service";
import { CreateContentVersionDto } from "./dto/create-content-version.dto";
import { ImportMarkdownDto } from "./dto/import-markdown.dto";
import { ListContentQueryDto } from "./dto/list-content.query.dto";

@Controller("content")
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post("import-markdown")
  async importMarkdown(@Headers("x-user-id") rawUserId: string | undefined, @Body() dto: ImportMarkdownDto) {
    return ok(await this.contentService.importMarkdown(normalizeUserId(rawUserId), dto));
  }

  @Get()
  async list(@Headers("x-user-id") rawUserId: string | undefined, @Query() query: ListContentQueryDto) {
    return ok(await this.contentService.list(normalizeUserId(rawUserId), query));
  }

  @Get(":contentId")
  async getById(@Headers("x-user-id") rawUserId: string | undefined, @Param("contentId") contentId: string) {
    return ok(await this.contentService.getById(normalizeUserId(rawUserId), contentId));
  }

  @Post(":contentId/versions")
  async addVersion(
    @Headers("x-user-id") rawUserId: string | undefined,
    @Param("contentId") contentId: string,
    @Body() dto: CreateContentVersionDto,
  ) {
    return ok(await this.contentService.addVersion(normalizeUserId(rawUserId), contentId, dto));
  }
}
