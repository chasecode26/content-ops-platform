import { BadRequestException, Injectable } from "@nestjs/common";

import { DraftPublishInput, DraftPublishResult, DraftPublisherAdapter } from "./draft-publisher.adapter";

type WechatTokenResponse = {
  access_token?: string;
  expires_in?: number;
  errcode?: number;
  errmsg?: string;
};

type WechatDraftAddResponse = {
  media_id?: string;
  errcode?: number;
  errmsg?: string;
};

type WechatMaterialUploadResponse = {
  media_id?: string;
  url?: string;
  errcode?: number;
  errmsg?: string;
};

@Injectable()
export class WechatApiDraftAdapter implements DraftPublisherAdapter {
  supports(platform: string): boolean {
    return platform === "WECHAT_OFFICIAL";
  }

  async createDraft(input: DraftPublishInput): Promise<DraftPublishResult> {
    if (!input.channelCredentials?.appId || !input.channelCredentials?.appSecret) {
      throw new BadRequestException("WECHAT_CREDENTIALS_MISSING");
    }

    const token = await this.fetchAccessToken(
      input.channelCredentials.appId,
      input.channelCredentials.appSecret,
    );
    const thumbMediaId =
      input.channelCredentials.defaultThumbMediaId ?? (await this.uploadFallbackThumb(token));
    const mediaId = await this.addDraft(token, input, thumbMediaId);

    return {
      platformDraftId: mediaId,
      provider: "wechat-api-adapter",
      rawResponse: {
        mode: "wechat-draft-add",
        tokenPrefix: token.slice(0, 8),
        thumbMediaId,
        mediaId,
      },
    };
  }

  private async fetchAccessToken(appId: string, appSecret: string): Promise<string> {
    const url =
      `https://api.weixin.qq.com/cgi-bin/token` +
      `?grant_type=client_credential&appid=${encodeURIComponent(appId)}` +
      `&secret=${encodeURIComponent(appSecret)}`;

    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      throw new BadRequestException(`WECHAT_HTTP_${response.status}`);
    }

    const payload = (await response.json()) as WechatTokenResponse;
    if (!payload.access_token) {
      throw new BadRequestException(
        `WECHAT_TOKEN_FAILED:${payload.errcode ?? "UNKNOWN"}:${payload.errmsg ?? "UNKNOWN"}`,
      );
    }

    return payload.access_token;
  }

  private async addDraft(
    accessToken: string,
    input: DraftPublishInput,
    thumbMediaId: string,
  ): Promise<string> {
    const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${encodeURIComponent(accessToken)}`;
    const body = {
      articles: [
        {
          title: input.title,
          author: input.channelCredentials?.author ?? "content-ops",
          digest: "",
          content: input.renderedHtml,
          content_source_url: "",
          thumb_media_id: thumbMediaId,
          need_open_comment: 0,
          only_fans_can_comment: 0,
        },
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new BadRequestException(`WECHAT_DRAFT_HTTP_${response.status}`);
    }

    const payload = (await response.json()) as WechatDraftAddResponse;
    if (!payload.media_id) {
      throw new BadRequestException(
        `WECHAT_DRAFT_ADD_FAILED:${payload.errcode ?? "UNKNOWN"}:${payload.errmsg ?? "UNKNOWN"}`,
      );
    }
    return payload.media_id;
  }

  private async uploadFallbackThumb(accessToken: string): Promise<string> {
    const url =
      `https://api.weixin.qq.com/cgi-bin/material/add_material` +
      `?access_token=${encodeURIComponent(accessToken)}&type=image`;

    // 16x16 JPEG fallback. WeChat material endpoint is stricter for file type.
    const jpegBase64 =
      "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHhofHh0a" +
      "HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIy" +
      "MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAQABADASIA" +
      "AhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEB" +
      "AQAAAAAAAAAAAAAAAAAAAAT/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCfAAPA" +
      "AAAAAAAAAAAAAAA//Z";
    const jpegBytes = Buffer.from(jpegBase64, "base64");
    const form = new FormData();
    form.append("media", new File([jpegBytes], "cover.jpg", { type: "image/jpeg" }));

    const response = await fetch(url, {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      throw new BadRequestException(`WECHAT_MATERIAL_HTTP_${response.status}`);
    }

    const payload = (await response.json()) as WechatMaterialUploadResponse;
    if (!payload.media_id) {
      throw new BadRequestException(
        `WECHAT_MATERIAL_ADD_FAILED:${payload.errcode ?? "UNKNOWN"}:${payload.errmsg ?? "UNKNOWN"}:` +
          `fallback=jpeg`,
      );
    }
    return payload.media_id;
  }
}
