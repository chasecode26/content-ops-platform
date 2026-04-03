import { Body, Controller, Get, Post, Put } from "@nestjs/common";

import { ok } from "../../common/http-response";
import { TestAiSettingsDto } from "./dto/test-ai-settings.dto";
import { UpdateAiSettingsDto } from "./dto/update-ai-settings.dto";
import { SettingsService } from "./settings.service";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("ai")
  async getAiSettings() {
    return ok(await this.settingsService.getAiSettings());
  }

  @Put("ai")
  async updateAiSettings(@Body() dto: UpdateAiSettingsDto) {
    return ok(await this.settingsService.updateAiSettings(dto));
  }

  @Post("ai/test")
  async testAiSettings(@Body() dto: TestAiSettingsDto) {
    return ok(await this.settingsService.testAiSettings(dto));
  }
}
