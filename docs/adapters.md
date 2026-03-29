# 适配器定义

## 1. 设计目标

适配器层要解决的问题不是“把所有平台做成一样”，而是：

- 抽象通用动作
- 暴露平台能力差异
- 让主业务层在不知道平台细节的情况下完成编排

## 2. 平台适配器接口

```ts
export interface PlatformAdapter {
  platform: PlatformCode;
  capabilities(): Promise<PlatformCapabilities>;
  validateDraft(input: DraftInput): Promise<ValidationResult>;
  uploadAssets(input: AssetUploadInput): Promise<UploadedAsset[]>;
  createDraft(input: CreateDraftInput): Promise<CreateDraftResult>;
  updateDraft(input: UpdateDraftInput): Promise<UpdateDraftResult>;
  publish(input: PublishInput): Promise<PublishResult>;
  queryStatus(input: QueryStatusInput): Promise<PlatformStatusResult>;
  deleteDraft?(input: DeleteDraftInput): Promise<void>;
}
```

## 3. Source Connector 接口

```ts
export interface SourceConnector {
  sourceType: SourceType;
  validate(input: SourceInput): Promise<ValidationResult>;
  fetch(input: SourceInput): Promise<SourceFetchResult>;
  normalize(input: SourceFetchResult): Promise<NormalizedContent>;
}
```

## 4. Renderer 接口

```ts
export interface ContentRenderer {
  themeCode: string;
  targetPlatform: PlatformCode;
  render(input: RenderInput): Promise<RenderResult>;
}
```

## 5. AI Provider 接口

```ts
export interface WritingProvider {
  provider: string;
  generate(input: GenerateArticleInput): Promise<GeneratedArticle>;
  rewrite(input: RewriteArticleInput): Promise<GeneratedArticle>;
  summarize(input: SummarizeInput): Promise<ArticleSummary>;
}
```

## 6. 通用输入模型

### `CreateDraftInput`

- `contentId`
- `versionId`
- `channelAccountId`
- `themeCode`
- `title`
- `summary`
- `body`
- `assets`
- `tags`
- `scheduleAt`
- `meta`

### `CreateDraftResult`

- `success`
- `draftId`
- `platformDraftId`
- `previewUrl`
- `rawResponse`

## 7. 平台能力声明

```ts
export interface PlatformCapabilities {
  supportsDraft: boolean;
  supportsDirectPublish: boolean;
  supportsSchedule: boolean;
  supportsHtmlBody: boolean;
  supportsMarkdownBody: boolean;
  supportsImageGallery: boolean;
  supportsVideo: boolean;
  supportsBrowserAutomation: boolean;
}
```

## 8. 平台差异策略

### 微信公众号适配器

- 输入主体：长文 HTML
- 重点能力：图片上传、草稿创建、发布、状态查询
- 风险点：素材链路复杂、封面图规则严格

### 小红书适配器

- 输入主体：标题、正文段落、图片集/视频、标签
- 初期实现：桥接独立浏览器自动化 Worker
- 风险点：页面结构变更、登录态失效、节流限制

### 抖音适配器

- 输入主体：短视频/图文描述、封面、话题
- 优先做草稿和发布桥路，不直接复用微信公众号 HTML

### 今日头条适配器

- 视官方能力决定是接 API 还是浏览器自动化
- 适配层必须与内容生成层完全解耦

## 9. 错误模型

统一错误码建议：

- `AUTH_EXPIRED`
- `ASSET_UPLOAD_FAILED`
- `DRAFT_CREATE_FAILED`
- `PUBLISH_REJECTED`
- `RATE_LIMITED`
- `DOM_CHANGED`
- `REVIEW_REQUIRED`
- `UNSUPPORTED_CAPABILITY`

## 10. 小红书桥接建议

小红书初期建议桥接独立 Worker，而不是塞进主 API。

桥接方式：

- CLI 调用
- HTTP 调用
- 队列回调

返回结构建议统一成 `CreateDraftResult` / `PublishResult`，主系统不感知其内部是 Python 还是 Playwright。
