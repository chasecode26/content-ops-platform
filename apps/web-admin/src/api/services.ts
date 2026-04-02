import { api, type ApiEnvelope } from "./client";

export type HealthData = { api: string; database: string; redis: string };

export type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type ContentItem = {
  id: string;
  title: string;
  summary?: string;
  status?: string;
  slug?: string;
  updatedAt?: string;
  latestVersionNo?: number;
  tags?: string[];
};

export type ContentVersionItem = {
  id: string;
  versionNo: number;
  title: string;
  summary?: string;
  markdownBody?: string;
  createdAt: string;
};

export type ContentDetail = {
  id: string;
  title: string;
  summary?: string;
  status?: string;
  latestVersion: {
    id: string;
    versionNo: number;
    title: string;
    summary?: string;
    markdownBody: string;
    createdAt: string;
  } | null;
  versions: ContentVersionItem[];
};

export type ThemeItem = { code: string; name: string; targetPlatform: string };

export type AccountItem = {
  id: string;
  name: string;
  platform: string;
  status: string;
  meta?: Record<string, unknown>;
  credential?: {
    configured: boolean;
    appIdMasked?: string;
    appSecretMasked?: string;
  };
  updatedAt?: string;
};

export type DraftJobItem = {
  publishJobId: string;
  contentId: string;
  contentTitle: string;
  platform: string;
  channelAccountName: string;
  status: string;
  createdAt: string;
  finishedAt?: string | null;
};

export type DraftDetail = {
  publishJobId: string;
  status: string;
  attemptCount: number;
  content: { id: string; title: string };
  draftRecord: {
    id: string | null;
    platformDraftId: string | null;
    previewUrl: string | null;
    errorMessage: string | null;
  };
  retryable?: boolean;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export async function getHealth() {
  const { data } = await api.get<ApiEnvelope<HealthData>>("/health");
  return data.data;
}

export async function listContents(query?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  tag?: string;
}) {
  const params = new URLSearchParams();
  params.set("page", String(query?.page ?? 1));
  params.set("pageSize", String(query?.pageSize ?? 20));
  if (query?.keyword) params.set("keyword", query.keyword);
  if (query?.status) params.set("status", query.status);
  if (query?.tag) params.set("tag", query.tag);

  const { data } = await api.get<ApiEnvelope<Paged<ContentItem>>>(`/content?${params.toString()}`);
  return data.data;
}

export async function getContentById(contentId: string) {
  const { data } = await api.get<ApiEnvelope<ContentDetail>>(`/content/${contentId}`);
  return data.data;
}

export async function importMarkdown(payload: {
  title: string;
  summary?: string;
  markdownBody: string;
  tags?: string[];
}) {
  const { data } = await api.post<ApiEnvelope<{ contentId: string; versionId: string }>>(
    "/content/import-markdown",
    { ...payload, sourceType: "MARKDOWN" },
  );
  return data.data;
}

export async function createContentVersion(
  contentId: string,
  payload: { title: string; summary?: string; markdownBody: string; changeSummary?: string },
) {
  const { data } = await api.post<ApiEnvelope<{ contentId: string; versionId: string; versionNo: number }>>(
    `/content/${contentId}/versions`,
    payload,
  );
  return data.data;
}

export async function listThemes(platform = "WECHAT_OFFICIAL") {
  const { data } = await api.get<ApiEnvelope<{ items: ThemeItem[] }>>(`/themes?platform=${platform}`);
  return data.data.items;
}

export async function renderPreview(payload: {
  themeCode: string;
  platform: string;
  markdownBody: string;
  title: string;
}) {
  const { data } = await api.post<ApiEnvelope<{ html: string }>>("/themes/render-preview", payload);
  return data.data.html;
}

export async function listAccounts(platform = "WECHAT_OFFICIAL") {
  const { data } = await api.get<ApiEnvelope<{ items: AccountItem[] }>>(
    `/channel-accounts?platform=${platform}`,
  );
  return data.data.items;
}

export async function createAccount(payload: {
  platform: string;
  name: string;
  credentials: { appId: string; appSecret: string };
  meta?: Record<string, unknown>;
}) {
  const { data } = await api.post<ApiEnvelope<AccountItem>>("/channel-accounts", payload);
  return data.data;
}

export async function updateAccount(
  accountId: string,
  payload: { name?: string; credentials?: { appId: string; appSecret: string }; meta?: Record<string, unknown> },
) {
  const { data } = await api.patch<ApiEnvelope<AccountItem>>(`/channel-accounts/${accountId}`, payload);
  return data.data;
}

export async function validateAccount(accountId: string) {
  const { data } = await api.post<ApiEnvelope<{ valid: boolean; platform: string; message: string }>>(
    `/channel-accounts/${accountId}/validate`,
  );
  return data.data;
}

export async function listDrafts(query?: { page?: number; pageSize?: number; status?: string }) {
  const params = new URLSearchParams();
  params.set("page", String(query?.page ?? 1));
  params.set("pageSize", String(query?.pageSize ?? 20));
  if (query?.status) params.set("status", query.status);
  const { data } = await api.get<ApiEnvelope<Paged<DraftJobItem>>>(`/drafts?${params.toString()}`);
  return data.data;
}

export async function createDraft(payload: {
  contentId: string;
  versionId: string;
  channelAccountId: string;
  themeCode: string;
  platform: string;
}) {
  const { data } = await api.post<ApiEnvelope<{ publishJobId: string; status: string }>>("/drafts", payload);
  return data.data;
}

export async function getDraftDetail(publishJobId: string) {
  const { data } = await api.get<ApiEnvelope<DraftDetail>>(`/drafts/${publishJobId}`);
  return data.data;
}

export async function retryDraft(publishJobId: string) {
  const { data } = await api.post<ApiEnvelope<{ publishJobId: string; status: string }>>(
    `/drafts/${publishJobId}/retry`,
  );
  return data.data;
}

export async function generateArticle(prompt: string) {
  const { data } = await api.post<ApiEnvelope<{ title: string; summary: string; markdownBody: string }>>(
    "/ai/generate-article",
    { prompt },
  );
  return data.data;
}

export async function aiChat(message: string, conversationHistory?: string) {
  const { data } = await api.post<ApiEnvelope<{ reply: string }>>(
    "/ai/chat",
    { message, conversationHistory },
  );
  return data.data;
}

export async function generateVariant(platform: string, sourceMarkdown: string, sourceTitle?: string) {
  const { data } = await api.post<ApiEnvelope<{ title: string; markdownBody: string; tags?: string[] }>>(
    "/ai/generate-variant",
    { platform, sourceMarkdown, sourceTitle },
  );
  return data.data;
}
