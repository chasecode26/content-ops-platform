import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";

import { ok } from "../../common/http-response";
import { normalizeUserId } from "../../common/user-context";
import { CreateDraftDto } from "./dto/create-draft.dto";
import { ListDraftsQueryDto } from "./dto/list-drafts.query.dto";
import { DraftsService } from "./drafts.service";

@Controller("drafts")
export class DraftsController {
  constructor(private readonly draftsService: DraftsService) {}

  @Post()
  async create(@Headers("x-user-id") rawUserId: string | undefined, @Body() dto: CreateDraftDto) {
    return ok(await this.draftsService.create(normalizeUserId(rawUserId), dto));
  }

  @Get()
  async list(@Headers("x-user-id") rawUserId: string | undefined, @Query() query: ListDraftsQueryDto) {
    return ok(await this.draftsService.list(normalizeUserId(rawUserId), query));
  }

  @Get(":publishJobId")
  async getById(@Headers("x-user-id") rawUserId: string | undefined, @Param("publishJobId") publishJobId: string) {
    return ok(await this.draftsService.getById(normalizeUserId(rawUserId), publishJobId));
  }

  @Post(":publishJobId/retry")
  async retry(@Headers("x-user-id") rawUserId: string | undefined, @Param("publishJobId") publishJobId: string) {
    return ok(await this.draftsService.retry(normalizeUserId(rawUserId), publishJobId));
  }
}
