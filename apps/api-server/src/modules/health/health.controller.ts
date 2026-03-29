import { Controller, Get } from "@nestjs/common";

import { ok } from "../../common/http-response";

@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return ok({
      api: "ok",
      database: "ok",
      redis: "ok",
    });
  }
}
