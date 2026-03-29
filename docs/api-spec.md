# API 设计

## 1. 范围

本文件定义第一阶段 MVP API：

- Markdown 稿件导入
- 稿件查询与版本管理
- 主题查询与预览渲染
- 渠道账号管理
- 微信公众号草稿任务创建与查询

协议约定：

- 风格：REST JSON API
- Base URL：`/api`
- 编码：`application/json; charset=utf-8`
- 时间格式：ISO 8601 UTC
- ID 类型：字符串 `cuid`

## 2. 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {}
}
```

### 失败响应

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "themeCode is required",
    "details": {}
  },
  "requestId": "req_xxx"
}
```

## 3. 通用错误码

### 通用错误

- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `INTERNAL_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`

### 内容域错误

- `CONTENT_NOT_FOUND`
- `CONTENT_VERSION_NOT_FOUND`
- `INVALID_MARKDOWN`
- `SLUG_CONFLICT`

### 主题域错误

- `THEME_NOT_FOUND`
- `THEME_PLATFORM_MISMATCH`
- `RENDER_FAILED`

### 渠道账号错误

- `CHANNEL_ACCOUNT_NOT_FOUND`
- `CHANNEL_ACCOUNT_INVALID`
- `CHANNEL_ACCOUNT_AUTH_EXPIRED`
- `PLATFORM_NOT_SUPPORTED`

### 草稿任务错误

- `DRAFT_JOB_NOT_FOUND`
- `DRAFT_CREATE_FAILED`
- `ASSET_UPLOAD_FAILED`
- `UNSUPPORTED_CAPABILITY`

## 4. 鉴权约定

MVP 可先走单用户模式：

- 本地开发：固定单用户，不启用复杂登录
- API 仍保留 `x-user-id` 头部位，便于后续扩展

请求头建议：

```http
x-user-id: user_local_default
```

## 5. 分页格式

列表接口统一返回：

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

## 6. Content API

### 6.1 导入 Markdown

`POST /api/content/import-markdown`

用途：

- 导入 Markdown
- 解析 frontmatter
- 创建 `content_items`
- 创建初始 `content_versions`

请求体：

```json
{
  "title": "我用 AI 搭了一套自己的日常开发工作流",
  "summary": "一篇关于 AI 工作流自动化的文章",
  "markdownBody": "# 标题\n\n正文",
  "tags": ["AI", "工作流", "公众号"],
  "sourceType": "MARKDOWN",
  "slug": "ai-daily-workflow",
  "canonicalUrl": null
}
```

字段规则：

- `title`：必填，1-120 字符
- `summary`：可选，0-300 字符
- `markdownBody`：必填，不可为空
- `tags`：可选，最多 10 个
- `sourceType`：必填，MVP 仅允许 `MANUAL` / `MARKDOWN`
- `slug`：可选，不传则服务端生成

成功响应：

```json
{
  "success": true,
  "data": {
    "contentId": "clx_content_1",
    "versionId": "clx_version_1",
    "status": "DRAFT",
    "slug": "ai-daily-workflow"
  }
}
```

错误码：

- `VALIDATION_ERROR`
- `INVALID_MARKDOWN`
- `SLUG_CONFLICT`

### 6.2 查询稿件列表

`GET /api/content?page=1&pageSize=20&status=DRAFT&keyword=workflow`

查询参数：

- `page`
- `pageSize`
- `status`
- `keyword`
- `tag`

成功响应：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clx_content_1",
        "title": "我用 AI 搭了一套自己的日常开发工作流",
        "summary": "一篇关于 AI 工作流自动化的文章",
        "status": "DRAFT",
        "slug": "ai-daily-workflow",
        "updatedAt": "2026-03-27T14:00:00.000Z",
        "latestVersionNo": 1,
        "tags": ["AI", "工作流"]
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

### 6.3 查询稿件详情

`GET /api/content/:contentId`

成功响应：

```json
{
  "success": true,
  "data": {
    "id": "clx_content_1",
    "title": "我用 AI 搭了一套自己的日常开发工作流",
    "summary": "一篇关于 AI 工作流自动化的文章",
    "status": "DRAFT",
    "slug": "ai-daily-workflow",
    "sourceType": "MARKDOWN",
    "tags": ["AI", "工作流"],
    "latestVersion": {
      "id": "clx_version_1",
      "versionNo": 1,
      "title": "我用 AI 搭了一套自己的日常开发工作流",
      "summary": "一篇关于 AI 工作流自动化的文章",
      "markdownBody": "# 标题\n\n正文",
      "createdAt": "2026-03-27T14:00:00.000Z"
    },
    "drafts": [],
    "createdAt": "2026-03-27T14:00:00.000Z",
    "updatedAt": "2026-03-27T14:00:00.000Z"
  }
}
```

错误码：

- `CONTENT_NOT_FOUND`

### 6.4 新增稿件版本

`POST /api/content/:contentId/versions`

请求体：

```json
{
  "title": "我用 AI 搭了一套自己的日常开发工作流（修订版）",
  "summary": "更新后的摘要",
  "markdownBody": "# 新标题\n\n更新正文",
  "changeSummary": "优化标题和导语"
}
```

成功响应：

```json
{
  "success": true,
  "data": {
    "contentId": "clx_content_1",
    "versionId": "clx_version_2",
    "versionNo": 2
  }
}
```

错误码：

- `CONTENT_NOT_FOUND`
- `INVALID_MARKDOWN`

## 7. Theme API

### 7.1 查询主题列表

`GET /api/themes?platform=WECHAT_OFFICIAL`

成功响应：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "code": "wechat-tech-green",
        "name": "微信科技绿",
        "targetPlatform": "WECHAT_OFFICIAL",
        "version": 1,
        "isActive": true
      }
    ]
  }
}
```

### 7.2 查询主题详情

`GET /api/themes/:themeCode`

成功响应：

```json
{
  "success": true,
  "data": {
    "code": "wechat-tech-green",
    "name": "微信科技绿",
    "targetPlatform": "WECHAT_OFFICIAL",
    "version": 1,
    "tokens": {
      "primaryColor": "#07c160"
    },
    "isActive": true
  }
}
```

错误码：

- `THEME_NOT_FOUND`

### 7.3 主题预览渲染

`POST /api/themes/render-preview`

请求体：

```json
{
  "themeCode": "wechat-tech-green",
  "platform": "WECHAT_OFFICIAL",
  "markdownBody": "# 标题\n\n正文内容",
  "title": "测试文章"
}
```

成功响应：

```json
{
  "success": true,
  "data": {
    "themeCode": "wechat-tech-green",
    "platform": "WECHAT_OFFICIAL",
    "html": "<section>...</section>",
    "warnings": []
  }
}
```

错误码：

- `THEME_NOT_FOUND`
- `THEME_PLATFORM_MISMATCH`
- `RENDER_FAILED`

## 8. Channel Account API

### 8.1 查询渠道账号列表

`GET /api/channel-accounts?platform=WECHAT_OFFICIAL`

成功响应：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clx_account_1",
        "platform": "WECHAT_OFFICIAL",
        "name": "我的公众号",
        "status": "ACTIVE",
        "meta": {
          "appId": "wx123"
        },
        "updatedAt": "2026-03-27T14:00:00.000Z"
      }
    ]
  }
}
```

### 8.2 创建渠道账号

`POST /api/channel-accounts`

请求体：

```json
{
  "platform": "WECHAT_OFFICIAL",
  "name": "我的公众号",
  "credentials": {
    "appId": "wx123",
    "appSecret": "secret_xxx"
  },
  "meta": {
    "author": "作者名"
  }
}
```

说明：

- `credentials` 不直接回显
- 服务端需加密保存到 `credentialCiphertext`

成功响应：

```json
{
  "success": true,
  "data": {
    "id": "clx_account_1",
    "platform": "WECHAT_OFFICIAL",
    "name": "我的公众号",
    "status": "ACTIVE"
  }
}
```

错误码：

- `VALIDATION_ERROR`
- `PLATFORM_NOT_SUPPORTED`

### 8.3 验证渠道账号

`POST /api/channel-accounts/:accountId/validate`

成功响应：

```json
{
  "success": true,
  "data": {
    "valid": true,
    "platform": "WECHAT_OFFICIAL",
    "message": "account is valid"
  }
}
```

失败响应 `data`：

```json
{
  "valid": false,
  "platform": "WECHAT_OFFICIAL",
  "message": "token refresh failed"
}
```

错误码：

- `CHANNEL_ACCOUNT_NOT_FOUND`
- `CHANNEL_ACCOUNT_INVALID`
- `CHANNEL_ACCOUNT_AUTH_EXPIRED`

## 9. Draft API

### 9.1 创建草稿任务

`POST /api/drafts`

用途：

- 创建微信公众号草稿任务
- 写入 `publish_jobs`
- 交由 Worker 执行渲染、素材上传、草稿创建

请求体：

```json
{
  "contentId": "clx_content_1",
  "versionId": "clx_version_1",
  "channelAccountId": "clx_account_1",
  "themeCode": "wechat-tech-green",
  "platform": "WECHAT_OFFICIAL"
}
```

字段约束：

- `platform` MVP 仅允许 `WECHAT_OFFICIAL`
- `contentId` 和 `versionId` 必须匹配

成功响应：

```json
{
  "success": true,
  "data": {
    "publishJobId": "clx_job_1",
    "status": "PENDING"
  }
}
```

错误码：

- `CONTENT_NOT_FOUND`
- `CONTENT_VERSION_NOT_FOUND`
- `CHANNEL_ACCOUNT_NOT_FOUND`
- `THEME_NOT_FOUND`
- `UNSUPPORTED_CAPABILITY`

### 9.2 查询草稿任务列表

`GET /api/drafts?page=1&pageSize=20&status=PENDING`

成功响应：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "publishJobId": "clx_job_1",
        "contentId": "clx_content_1",
        "contentTitle": "我用 AI 搭了一套自己的日常开发工作流",
        "platform": "WECHAT_OFFICIAL",
        "channelAccountName": "我的公众号",
        "status": "DRAFTED",
        "createdAt": "2026-03-27T14:00:00.000Z",
        "finishedAt": "2026-03-27T14:01:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

### 9.3 查询草稿任务详情

`GET /api/drafts/:publishJobId`

成功响应：

```json
{
  "success": true,
  "data": {
    "publishJobId": "clx_job_1",
    "status": "DRAFTED",
    "attemptCount": 1,
    "content": {
      "id": "clx_content_1",
      "title": "我用 AI 搭了一套自己的日常开发工作流"
    },
    "draftRecord": {
      "id": "clx_draft_1",
      "platformDraftId": "123456789",
      "previewUrl": null,
      "errorMessage": null
    },
    "createdAt": "2026-03-27T14:00:00.000Z",
    "startedAt": "2026-03-27T14:00:05.000Z",
    "finishedAt": "2026-03-27T14:01:00.000Z"
  }
}
```

错误码：

- `DRAFT_JOB_NOT_FOUND`

## 10. Worker 内部状态流转

`publish_jobs.status` 推荐流转：

```text
PENDING
-> RENDERING
-> READY_TO_PUSH
-> PUSHING
-> DRAFTED
```

失败流转：

```text
PENDING/RENDERING/READY_TO_PUSH/PUSHING
-> FAILED
```

需要人工介入时：

```text
RENDERING
-> WAITING_REVIEW
```

## 11. OpenAPI 标签建议

- `Content`
- `Themes`
- `ChannelAccounts`
- `Drafts`
- `Health`

## 12. Health API

### 12.1 系统健康检查

`GET /api/health`

成功响应：

```json
{
  "success": true,
  "data": {
    "api": "ok",
    "database": "ok",
    "redis": "ok"
  }
}
```

## 13. DTO 命名建议

- `ImportMarkdownDto`
- `CreateContentVersionDto`
- `RenderThemePreviewDto`
- `CreateChannelAccountDto`
- `ValidateChannelAccountDto`
- `CreateDraftJobDto`

## 14. Controller 建议

- `ContentController`
- `ThemeController`
- `ChannelAccountController`
- `DraftController`
- `HealthController`

## 15. Service 建议

- `ContentService`
- `ThemeService`
- `RenderService`
- `ChannelAccountService`
- `DraftJobService`
- `WechatDraftService`

## 16. 后续扩展保留接口

暂不实现，但建议预留命名：

- `POST /api/source-tasks/url`
- `POST /api/source-tasks/rss`
- `POST /api/ai/rewrite`
- `POST /api/ai/generate-summary`
- `POST /api/publish/:publishJobId/execute`
- `GET /api/platform-posts/:id`
