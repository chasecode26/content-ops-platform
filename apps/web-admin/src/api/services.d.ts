export type HealthData = {
    api: string;
    database: string;
    redis: string;
};
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
export type ThemeItem = {
    code: string;
    name: string;
    targetPlatform: string;
};
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
    content: {
        id: string;
        title: string;
    };
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
export declare function getHealth(): Promise<HealthData>;
export declare function listContents(query?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
    tag?: string;
}): Promise<Paged<ContentItem>>;
export declare function getContentById(contentId: string): Promise<ContentDetail>;
export declare function importMarkdown(payload: {
    title: string;
    summary?: string;
    markdownBody: string;
    tags?: string[];
}): Promise<{
    contentId: string;
    versionId: string;
}>;
export declare function createContentVersion(contentId: string, payload: {
    title: string;
    summary?: string;
    markdownBody: string;
    changeSummary?: string;
}): Promise<{
    contentId: string;
    versionId: string;
    versionNo: number;
}>;
export declare function listThemes(platform?: string): Promise<ThemeItem[]>;
export declare function renderPreview(payload: {
    themeCode: string;
    platform: string;
    markdownBody: string;
    title: string;
}): Promise<string>;
export declare function listAccounts(platform?: string): Promise<AccountItem[]>;
export declare function createAccount(payload: {
    platform: string;
    name: string;
    credentials: {
        appId: string;
        appSecret: string;
    };
    meta?: Record<string, unknown>;
}): Promise<AccountItem>;
export declare function updateAccount(accountId: string, payload: {
    name?: string;
    credentials?: {
        appId: string;
        appSecret: string;
    };
    meta?: Record<string, unknown>;
}): Promise<AccountItem>;
export declare function validateAccount(accountId: string): Promise<{
    valid: boolean;
    platform: string;
    message: string;
}>;
export declare function listDrafts(query?: {
    page?: number;
    pageSize?: number;
    status?: string;
}): Promise<Paged<DraftJobItem>>;
export declare function createDraft(payload: {
    contentId: string;
    versionId: string;
    channelAccountId: string;
    themeCode: string;
    platform: string;
}): Promise<{
    publishJobId: string;
    status: string;
}>;
export declare function getDraftDetail(publishJobId: string): Promise<DraftDetail>;
export declare function retryDraft(publishJobId: string): Promise<{
    publishJobId: string;
    status: string;
}>;
