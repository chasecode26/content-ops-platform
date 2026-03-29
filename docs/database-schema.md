# 数据库表结构设计

## 1. 设计原则

- 统一保存标准化内容，再由平台适配器输出不同格式
- 内容版本、渲染结果、发布结果分层保存，便于追溯
- 平台账号与发布任务解耦，支持一稿多发
- 所有异步任务都有状态与错误信息，便于重试和审计

## 2. 核心实体

### `users`

系统使用者。MVP 即使只有单人，也保留该表，便于未来扩展多账号与协作。

### `channel_accounts`

平台账号表，保存公众号、小红书、抖音等接入账号信息。

关键字段：

- `platform`
- `name`
- `status`
- `credentialCiphertext`
- `browserProfilePath`
- `meta`

### `themes`

排版主题定义表，保存风格标识、变量、版本和可用平台。

### `content_items`

内容主表，保存一篇文章的标准元信息和主状态。

关键字段：

- `title`
- `summary`
- `slug`
- `sourceType`
- `status`
- `canonicalUrl`

### `content_versions`

内容版本表。手工稿、AI 优化稿、多平台改写稿都作为独立版本保存。

关键字段：

- `versionNo`
- `markdownBody`
- `structuredBody`
- `aiModel`
- `promptSnapshot`
- `changeSummary`

### `media_assets`

统一素材表，保存封面、正文图、图集、视频等资源。

### `source_tasks`

抓取任务表，保存 URL/RSS/关键词/站点抓取记录。

### `draft_records`

草稿记录表，保存平台草稿 ID、渲染快照、目标主题和平台返回结果。

### `publish_jobs`

发布任务表，统一记录创建草稿、发布、定时发布、重试等任务状态。

### `platform_posts`

平台最终落地的内容记录，保存平台 postId、链接、发布时间和统计快照。

### `workflow_runs`

工作流执行表。记录一次“抓取 -> 生成 -> 渲染 -> 草稿推送”的完整链路。

## 3. 关系图

```text
users 1 -> n channel_accounts
users 1 -> n content_items
content_items 1 -> n content_versions
content_items 1 -> n media_assets
content_items 1 -> n draft_records
content_items 1 -> n publish_jobs
publish_jobs 1 -> 0..1 platform_posts
content_items 1 -> n workflow_runs
themes 1 -> n draft_records
channel_accounts 1 -> n draft_records
channel_accounts 1 -> n publish_jobs
```

## 4. 状态设计

### 内容状态 `content_items.status`

- `DRAFT`
- `READY_FOR_REVIEW`
- `APPROVED`
- `RENDERED`
- `PUBLISHED`
- `ARCHIVED`
- `FAILED`

### 发布任务状态 `publish_jobs.status`

- `PENDING`
- `RENDERING`
- `WAITING_REVIEW`
- `READY_TO_PUSH`
- `PUSHING`
- `DRAFTED`
- `SCHEDULED`
- `PUBLISHED`
- `FAILED`
- `CANCELED`

## 5. 索引建议

- `content_items(user_id, status, created_at desc)`
- `content_versions(content_item_id, version_no desc)`
- `draft_records(channel_account_id, status, created_at desc)`
- `publish_jobs(channel_account_id, status, scheduled_at)`
- `platform_posts(platform, platform_post_id)`
- `workflow_runs(content_item_id, status, created_at desc)`

## 6. 设计备注

- HTML 渲染结果不直接覆盖 Markdown 正文，必须保存到版本或草稿快照中
- 平台差异字段统一塞进 `meta`/`platformPayload`，避免主表频繁变更
- 外部平台返回的原始响应建议截断保存，防止表无限膨胀
