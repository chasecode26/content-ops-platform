# 实施开发清单

## 1. 目标

本清单用于把设计稿转换为可执行迭代任务，覆盖：

- 接口级任务
- 页面级任务
- 表级任务
- Worker 与队列任务
- 适配器开发顺序

默认优先级遵循：

1. 先打通微信公众号草稿链路
2. 先有人工确认，再做自动发布
3. 先做统一内容模型，再扩展多平台

## 2. MVP 范围

MVP 必须交付以下能力：

- 导入 Markdown 稿件
- 保存内容与版本
- 选择主题渲染微信公众号 HTML
- 预览渲染结果
- 维护微信公众号账号
- 推送至公众号草稿箱
- 查看草稿任务结果与错误日志

明确不放入 MVP：

- 自动抓取网页
- AI 自动写稿
- 小红书/抖音接入
- 定时发布
- 数据分析看板

## 3. 迭代 1：工程基础与数据层

### 3.1 仓库级任务

- 初始化 `package.json`
- 初始化 `pnpm-workspace`
- 建立统一 `tsconfig`
- 建立 `eslint` / `prettier`
- 建立 `.env.example`
- 建立 Docker Compose：PostgreSQL、Redis

### 3.2 数据层任务

目标：先把 MVP 必需数据模型落盘。

优先创建的表：

- `users`
- `channel_accounts`
- `themes`
- `content_items`
- `content_versions`
- `media_assets`
- `draft_records`
- `publish_jobs`

可延后到 Phase 2 的表：

- `source_tasks`
- `platform_posts`
- `workflow_runs`

### 3.3 Prisma 任务清单

- 拆分第一个 migration
- 建立 `seed` 脚本，插入默认主题与默认用户
- 约定 Prisma repository 访问层
- 为以下字段建立唯一性校验：
  - `content_items.slug`
  - `themes.code`
  - `platform_posts.platform + platformPostId`

### 3.4 数据层完成标准

- 本地一键启动数据库
- 可执行 migration
- 可执行 seed
- Prisma Client 可被 API 与 Worker 复用

## 4. 迭代 2：API Server MVP

### 4.1 内容模块接口

#### `POST /api/content/import-markdown`

用途：

- 导入 Markdown
- 解析 frontmatter
- 创建 `content_items`
- 创建 `content_versions`

请求字段：

- `title`
- `summary`
- `markdownBody`
- `tags`
- `sourceType`

返回字段：

- `contentId`
- `versionId`
- `status`

#### `GET /api/content`

用途：

- 分页查询稿件列表
- 支持按状态、标签、关键词过滤

#### `GET /api/content/:id`

用途：

- 查看稿件详情
- 返回当前版本、主题渲染状态、草稿记录

#### `POST /api/content/:id/versions`

用途：

- 新建内容版本
- 保存人工修改后的 Markdown

### 4.2 主题模块接口

#### `GET /api/themes`

- 获取可用主题列表

#### `GET /api/themes/:code`

- 获取主题详情和预览配置

#### `POST /api/themes/render-preview`

用途：

- 输入 Markdown 与主题
- 返回微信公众号 HTML 预览

### 4.3 渠道账号接口

#### `GET /api/channel-accounts`

- 按平台读取账号列表

#### `POST /api/channel-accounts`

- 创建渠道账号
- 保存账号元信息

#### `POST /api/channel-accounts/:id/validate`

- 验证账号配置是否可用
- 公众号走 token 校验
- 浏览器自动化平台走登录状态检查

### 4.4 草稿任务接口

#### `POST /api/drafts`

用途：

- 创建草稿推送任务
- 写入 `publish_jobs`
- 投递 Worker

请求字段：

- `contentId`
- `versionId`
- `channelAccountId`
- `themeCode`

#### `GET /api/drafts`

- 查询草稿任务列表

#### `GET /api/drafts/:id`

- 查询单个草稿任务详情

### 4.5 API 完成标准

- Swagger/OpenAPI 可访问
- 所有接口有 DTO、校验器、错误码
- API 层不直接做平台推送，只投递任务

## 5. 迭代 3：Worker 与渲染链路

### 5.1 内容渲染任务

任务名建议：

- `draft.render.wechat`
- `draft.push.wechat`

### 5.2 渲染器开发清单

#### `render-engine` 包

- 建立 Markdown AST 解析入口
- 定义主题 tokens
- 定义 section/card/title/quote/code-block 组件映射
- 输出微信公众号兼容的内联 HTML
- 对危险 HTML 做过滤

#### 微信渲染 v1 最小支持

- 一级标题
- 二级标题
- 正文段落
- 引用块
- 无序列表
- 有序列表
- 行内加粗
- 普通链接
- 图片
- 分割线
- 代码块

#### 微信渲染 v1 非必须

- 表格
- 数学公式
- Mermaid
- 复杂嵌套 HTML

### 5.3 Worker 任务清单

- 消费 `publish_jobs`
- 查询内容版本与主题
- 调用 `render-engine`
- 生成 HTML 快照
- 调用微信公众号适配器
- 保存 `draft_records`
- 回写 `publish_jobs.status`

### 5.4 重试规则

- 素材上传失败：最多重试 3 次
- 公众号 access token 失效：先刷新再重试 1 次
- 平台限流：按平台返回等待时间退避
- 参数校验失败：不重试，直接失败

## 6. 迭代 4：微信公众号适配器

### 6.1 适配器接口落地

需要实现：

- `capabilities`
- `validateDraft`
- `uploadAssets`
- `createDraft`
- `queryStatus`

MVP 暂不实现：

- `publish`
- `deleteDraft`

### 6.2 微信专属子任务

- 接入素材上传接口
- 正文图片 URL 替换
- 封面图上传
- 组装草稿 payload
- 调用新增草稿接口
- 保存平台草稿 ID

### 6.3 微信账号配置字段

`channel_accounts.meta` 至少包含：

- `appId`
- `appSecret`
- `author`
- `defaultThumbMediaId` 或封面上传策略

### 6.4 适配器完成标准

- 能上传一篇包含图片的 HTML 到草稿箱
- 返回草稿 ID
- 失败时保留原始错误码和响应摘要

## 7. 迭代 5：Web 管理台 MVP

### 7.1 页面清单

#### 页面 1：稿件列表

功能：

- 查看稿件标题、状态、更新时间
- 支持进入详情页
- 支持创建新稿

#### 页面 2：Markdown 导入页

功能：

- 粘贴 Markdown
- 上传 `.md` 文件
- 编辑标题、摘要、标签
- 提交后创建稿件

#### 页面 3：稿件详情页

功能：

- 查看当前版本内容
- 查看版本列表
- 触发预览渲染
- 选择主题
- 发起推草稿

#### 页面 4：主题预览页

功能：

- 切换主题
- 左侧 Markdown，右侧 HTML 预览
- 保存默认主题

#### 页面 5：渠道账号管理页

功能：

- 查看账号列表
- 新增公众号账号
- 测试账号连接

#### 页面 6：草稿任务页

功能：

- 查看任务状态
- 查看失败原因
- 打开对应内容详情

### 7.2 页面优先级

优先开发顺序：

1. Markdown 导入页
2. 稿件详情页
3. 主题预览页
4. 渠道账号管理页
5. 草稿任务页
6. 稿件列表

## 8. 迭代 6：自动抓取与 AI 生成

这一阶段才进入“自动抓取 -> 自动生成”。

### 8.1 抓取接口

#### `POST /api/source-tasks/url`

- 输入 URL
- 创建抓取任务

#### `POST /api/source-tasks/rss`

- 输入 RSS 地址
- 创建抓取任务

#### `POST /api/source-tasks/keyword`

- 输入关键词、来源站点
- 创建抓取任务

### 8.2 抓取 Worker

- Playwright 抓取动态页面
- Readability 提取正文
- 保存原始 HTML 摘要
- 输出标准化内容

### 8.3 AI 接口

#### `POST /api/ai/rewrite`

- 输入内容版本
- 输出重写版本

#### `POST /api/ai/generate-summary`

- 生成摘要

#### `POST /api/ai/generate-wechat-title`

- 生成公众号风格标题

#### `POST /api/ai/generate-xhs-variant`

- 生成小红书版本内容

### 8.4 内容版本策略

- 抓取原文单独存一版
- AI 重写存一版
- 人工修订再存一版
- 平台特化再存一版

## 9. 迭代 7：小红书桥接

### 9.1 接入策略

- Node 主系统不直接操控小红书页面
- 通过桥接适配器调用独立自动化 Worker

### 9.2 桥接接口

#### `POST /bridge/xiaohongshu/drafts`

- 输入标题、正文、图片、标签
- 返回草稿/发布结果

#### `GET /bridge/xiaohongshu/status/:jobId`

- 查询桥接任务状态

### 9.3 主系统侧任务

- 增加 `XIAOHONGSHU` 平台能力配置
- 增加内容变体生成器
- 增加图文素材准备器

## 10. 表级开发顺序

### 第一批表

- `users`
- `channel_accounts`
- `themes`
- `content_items`
- `content_versions`

原因：

- 这是内容导入、主题预览、账号配置的底座

### 第二批表

- `draft_records`
- `publish_jobs`
- `media_assets`

原因：

- 这是微信公众号草稿链路的核心

### 第三批表

- `source_tasks`
- `workflow_runs`
- `platform_posts`

原因：

- 这些属于自动抓取、自动发布、多平台回收阶段

## 11. 队列与任务名建议

### 队列

- `content-import`
- `content-render`
- `draft-publish`
- `source-fetch`
- `ai-writing`
- `platform-sync`

### Job 名

- `content.import.markdown`
- `content.render.wechat`
- `draft.create.wechat`
- `source.fetch.url`
- `source.fetch.rss`
- `ai.rewrite.article`
- `platform.sync.post-status`

## 12. Definition of Done

### MVP 完成标准

- 一篇 Markdown 从导入到公众号草稿创建全链打通
- 全过程可见任务状态
- 失败能定位到渲染、素材上传或草稿创建哪个环节
- 同一主题对多篇文章渲染结果风格一致

### Phase 2 完成标准

- 可从 URL 或 RSS 自动生成标准化稿件
- AI 重写生成新版本
- 人工审核后可继续推送公众号

### 多平台阶段完成标准

- 一篇标准内容可生成公众号版和小红书版
- 平台差异由适配器和变体生成器承担，不污染内容主模型

## 13. 推荐执行顺序

最稳的推进顺序：

1. 数据模型与 migration
2. Markdown 导入 API
3. 微信 HTML 渲染器
4. 主题预览页面
5. 微信账号管理
6. 微信草稿适配器
7. 草稿任务中心
8. URL/RSS 抓取
9. AI 改写
10. 小红书桥接

## 14. 风险清单

- 微信图片素材链路容易成为第一个阻塞点
- 主题渲染若不走 AST，后面维护会迅速失控
- 小红书桥接若直接嵌进主系统，会导致平台层和业务层耦合
- 自动抓取若没有内容清洗，会把脏 HTML 和广告段带入 AI 管线
