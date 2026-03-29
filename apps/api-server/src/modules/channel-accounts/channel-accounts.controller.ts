import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";

import { ok } from "../../common/http-response";
import { normalizeUserId } from "../../common/user-context";
import { ChannelAccountsService } from "./channel-accounts.service";
import { CreateChannelAccountDto } from "./dto/create-channel-account.dto";
import { UpdateChannelAccountDto } from "./dto/update-channel-account.dto";

@Controller("channel-accounts")
export class ChannelAccountsController {
  constructor(private readonly channelAccountsService: ChannelAccountsService) {}

  @Get()
  async list(@Headers("x-user-id") rawUserId: string | undefined, @Query("platform") platform?: string) {
    return ok(await this.channelAccountsService.list(normalizeUserId(rawUserId), platform));
  }

  @Post()
  async create(@Headers("x-user-id") rawUserId: string | undefined, @Body() dto: CreateChannelAccountDto) {
    return ok(await this.channelAccountsService.create(normalizeUserId(rawUserId), dto));
  }

  @Post(":accountId/validate")
  async validate(@Headers("x-user-id") rawUserId: string | undefined, @Param("accountId") accountId: string) {
    return ok(await this.channelAccountsService.validate(normalizeUserId(rawUserId), accountId));
  }

  @Patch(":accountId")
  async update(
    @Headers("x-user-id") rawUserId: string | undefined,
    @Param("accountId") accountId: string,
    @Body() dto: UpdateChannelAccountDto,
  ) {
    return ok(await this.channelAccountsService.update(normalizeUserId(rawUserId), accountId, dto));
  }
}
