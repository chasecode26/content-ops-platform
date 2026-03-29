import { Injectable } from "@nestjs/common";

import { DraftPublishInput, DraftPublishResult, DraftPublisherAdapter } from "./draft-publisher.adapter";

@Injectable()
export class FakeWechatDraftAdapter implements DraftPublisherAdapter {
  supports(platform: string): boolean {
    return platform === "WECHAT_OFFICIAL";
  }

  async createDraft(input: DraftPublishInput): Promise<DraftPublishResult> {
    return {
      platformDraftId: `mock_${input.publishJobId}`,
      provider: "fake-wechat-adapter",
      rawResponse: {
        ok: true,
        mode: "local-mock",
        publishJobId: input.publishJobId,
        title: input.title,
      },
    };
  }
}
