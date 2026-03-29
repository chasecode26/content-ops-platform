import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";

import { ok } from "../../common/http-response";
import { RenderThemePreviewDto } from "./dto/render-theme-preview.dto";
import { ThemesService } from "./themes.service";

@Controller("themes")
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Get()
  async list(@Query("platform") platform?: string) {
    return ok(await this.themesService.list(platform));
  }

  @Get(":themeCode")
  async getByCode(@Param("themeCode") themeCode: string) {
    return ok(await this.themesService.getByCode(themeCode));
  }

  @Post("render-preview")
  async renderPreview(@Body() dto: RenderThemePreviewDto) {
    return ok(await this.themesService.renderPreview(dto));
  }
}
