export interface DraftPublishInput {
  publishJobId: string;
  platform: "WECHAT_OFFICIAL";
  contentId: string;
  versionId: string;
  channelAccountId: string;
  channelCredentials?: {
    appId: string;
    appSecret: string;
    author?: string;
    defaultThumbMediaId?: string;
  };
  themeCode: string;
  title: string;
  markdownBody: string;
  renderedHtml: string;
}

export interface DraftPublishResult {
  platformDraftId: string;
  previewUrl?: string;
  provider: string;
  rawResponse: Record<string, unknown>;
}

export interface DraftPublisherAdapter {
  supports(platform: string): boolean;
  createDraft(input: DraftPublishInput): Promise<DraftPublishResult>;
}
