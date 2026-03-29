import { Module } from "@nestjs/common";

import { ThemesModule } from "../themes/themes.module";
import { FakeWechatDraftAdapter } from "./adapters/fake-wechat-draft.adapter";
import { DRAFT_PUBLISHER_ADAPTER } from "./adapters/draft-publisher.token";
import { WechatApiDraftAdapter } from "./adapters/wechat-api-draft.adapter";
import { DraftsController } from "./drafts.controller";
import { DraftsService } from "./drafts.service";

@Module({
  imports: [ThemesModule],
  controllers: [DraftsController],
  providers: [
    DraftsService,
    FakeWechatDraftAdapter,
    WechatApiDraftAdapter,
    {
      provide: DRAFT_PUBLISHER_ADAPTER,
      useFactory: (fakeAdapter: FakeWechatDraftAdapter, apiAdapter: WechatApiDraftAdapter) => {
        const mode = (process.env.WECHAT_DRAFT_ADAPTER ?? "fake").trim().toLowerCase();
        return mode === "api" ? apiAdapter : fakeAdapter;
      },
      inject: [FakeWechatDraftAdapter, WechatApiDraftAdapter],
    },
  ],
})
export class DraftsModule {}
