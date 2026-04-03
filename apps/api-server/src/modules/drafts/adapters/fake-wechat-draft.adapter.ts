import { Injectable } from "@nestjs/common";

import { DraftPublishInput, DraftPublishResult, DraftPublisherAdapter } from "./draft-publisher.adapter";

@Injectable()
export class FakeWechatDraftAdapter implements DraftPublisherAdapter {
  supports(platform: string): boolean {
    return platform === "WECHAT_OFFICIAL" || platform === "TOUTIAO";
  }

  async createDraft(input: DraftPublishInput): Promise<DraftPublishResult> {
    return {
      platformDraftId: `${input.platform.toLowerCase()}_${input.publishJobId}`,
      provider: input.platform === "TOUTIAO" ? "fake-toutiao-adapter" : "fake-wechat-adapter",
      rawResponse: {
        ok: true,
        mode: "local-mock",
        platform: input.platform,
        publishJobId: input.publishJobId,
        title: input.title,
      },
    };
  }
}
