# Web 控制台 UI 设计稿（先设计后开发）

## 1. 设计目标

- AI 驱动的多平台内容工作台，以「创作台」为首页
- 支持「母稿 -> 平台派生 -> 渲染 -> 草稿推送」全流程
- 聊天入口与 Web 确认双路径：快速出稿走聊天，精修多平台走 Web
- 风格简约、克制、可读性优先，响应式自适应

---

## 2. 信息架构（IA）

主导航（左侧栏 / 移动端底部 Tab）：

1. **创作台**（Creation Desk）—— 首页
2. **内容库**（Content Library）
3. **模板中心**（Template Center）
4. **任务中心**（Task Center）
5. **账号管理**（Account Management）
6. **设置**（Settings）

全局能力：

- 全局搜索（按标题、母稿状态、账号名）
- 全局状态提示（API 健康、异步任务结果）
- 用户上下文（默认 `x-user-id`）

---

## 3. 页面设计

### 3.1 创作台（首页）

目标：母稿创建与快速编辑的第一入口。

模块：

- **快速创建区**：Markdown 编辑器 + "AI 生成"按钮（从选题/关键词自动生成初稿）
- **最近母稿**（Top 5）：标题、状态（草稿/确认/派生中/已完结）、创建时间
- **进行中任务**：活跃派生任务的快速状态卡片
- **聊天入口提示**：指向 Skill/OpenClaw 对话出稿的入口链接或引导区

交互：

- Markdown 编辑器支持实时预览
- AI 生成按钮触发异步任务，完成后自动填充编辑器
- 母稿状态随编辑自动保存草稿

### 3.2 内容库（Content Library）

目标：母稿与派生版本的统一管理。

模块：

- **母稿列表**：标题、状态（草稿/确认/派生中/已完结）、创建时间、平台版本数
- **筛选**：状态、标签、分页、标题搜索
- **侧边抽屉**：母稿详情（全屏 Markdown 编辑）+ 平台派生版本列表
- **派生版本管理**：从母稿一键生成各平台变体（公众号/小红书/CSDN），查看/编辑每个变体

交互：

- 批量操作：选择多篇母稿批量派生到目标平台
- 派生版本有独立状态：待生成 -> 已生成 -> 已确认 -> 已发布
- 确认后的母稿才允许派生

### 3.3 模板中心（Template Center）

目标：生成模板与渲染主题的集中管理与预览。

模块：

- **生成模板** Tab：AI Prompt 模板列表（风格标签：科技/文艺/商务等）、变体矩阵预览
- **渲染主题** Tab：CSS 主题列表（平台标签、预览图、"应用到此母稿"按钮）
- **组合推荐**：预设的常用搭配（如"科技风 + 简洁排版"）

交互：

- 模板/主题在线编辑 + 实时预览
- "应用到母稿"按钮：将模板/主题绑定到指定母稿
- 支持自定义模板的导入与导出

### 3.4 任务中心（Task Center）

目标：草稿推送与发布任务的追踪与重试。

模块：

- **任务看板**：待确认 -> 渲染中 -> 已推送 -> 已完成/失败
- **失败任务置顶**：红色高亮，显示失败原因摘要
- **任务详情**：母稿 -> 派生版本 -> 渲染结果 -> 推送日志 -> 平台响应

交互：

- 一键重试：复用同参数重新执行失败任务
- 任务完成后自动刷新状态（3s 间隔，最多 30s）
- 支持按母稿/平台筛选任务

### 3.5 账号管理（Account Management）

目标：平台账号配置与状态查看。

模块：

- **账号列表**：名称、平台（公众号/小红书/CSDN）、状态、作者、更新时间
- **新建/编辑弹窗**：`appId`、`appSecret`、`author`、`defaultThumbMediaId`（各平台字段不同，按平台表单动态渲染）
- **凭证显示**：仅显示脱敏字段（`appIdMasked`、`appSecretMasked`）
- **操作**：校验账号、启用/停用

安全约束：

- 前端不展示明文秘钥
- 编辑时支持"仅更新秘钥"与"保留原秘钥"

### 3.6 设置（Settings）

目标：系统级配置。

模块：

- **AI Provider 配置**：provider 优先级排序、API Key 管理、降级策略
- **默认生成模板**：新母稿默认绑定的风格模板
- **平台默认派生规则**：各平台的 length、format 偏好预设
- **通知与告警**：任务失败通知方式、推送阈值

---

## 4. 响应式布局规范

断点：

- `>=1200px`: Desktop（左侧固定导航 + 内容区）
- `768px ~ 1199px`: Tablet（左侧收起为图标栏）
- `<=767px`: Mobile（底部 Tab + 页面分段折叠）

网格：

- Desktop: 12 列，间距 24px
- Tablet: 8 列，间距 16px
- Mobile: 4 列，间距 12px

组件自适应策略：

- 表格 -> 卡片列表（移动端）
- 复杂表单 -> 分步表单（移动端）
- 预览区 -> 折叠面板（移动端默认收起）

---

## 5. 视觉风格

设计关键词：

- 清晰、克制、专业、低干扰

色板（建议）：

- 主色 `#0F766E`（强调动作）
- 文本主色 `#111827`
- 辅助灰 `#6B7280`
- 背景 `#F8FAFC`
- 成功 `#16A34A` / 警告 `#D97706` / 失败 `#DC2626`

字体：

- 中文：`PingFang SC`, `Microsoft YaHei`
- 英文/数字：`SF Pro Text`, `Segoe UI`

样式要点：

- 圆角 10px
- 边框细线 + 轻阴影
- 动效仅用于状态变化，不做复杂过场

---

## 6. 组件清单（核心）

1. `AppShell`（导航 + 顶栏 + 内容区）
2. `MasterDraftCard`（母稿卡片，含状态、派生数、快捷操作）
3. `VariantList`（平台派生版本列表 + 状态）
4. `TemplateSelector`（生成模板 + 渲染主题选择器）
5. `PreviewPane`（多平台预览：公众号 HTML / 小红书卡片 / CSDN Markdown）
6. `TaskKanban`（任务看板视图）
7. `FormDrawer / FormDialog`
8. `MarkdownEditor`（创作台核心编辑器）
9. `StatusBadge`
10. `EmptyState / ErrorState`

---

## 7. API 对接映射

- 创作台：
  - `POST /api/content/master` —— 创建母稿
  - `GET /api/content/master?recent=5` —— 最近母稿
- 内容库：
  - `GET /api/content/master` —— 母稿列表
  - `GET /api/content/master/:id/variants` —— 派生版本列表
  - `POST /api/content/master/:id/variants` —— 生成派生版本
- 模板中心：
  - `GET /api/templates` —— 生成模板列表
  - `GET /api/themes` —— 渲染主题列表
  - `POST /api/themes/render` —— 渲染预览
- 任务中心：
  - `GET /api/drafts` —— 草稿任务列表
  - `POST /api/drafts/:taskId/retry` —— 失败任务重试
- 账号管理：
  - `GET /api/channel-accounts`
  - `POST /api/channel-accounts`
  - `PATCH /api/channel-accounts/:accountId`
- 设置：
  - `GET /api/settings/ai-providers`
  - `PUT /api/settings/ai-providers`

---

## 8. 前端技术建议

- 框架：Vue 3 + TypeScript + Vite
- UI：`Naive UI` 或 `Element Plus`（推荐 Naive UI，主题定制更轻）
- 状态管理：`Pinia`
- 请求层：`Axios` + 统一错误拦截
- 路由：`Vue Router`（按模块懒加载）
- 样式：CSS Variables + 少量原子类

---

## 9. 开发前确认清单

1. UI 组件库二选一（Naive UI / Element Plus）
2. 创作台编辑器是富文本还是纯 Markdown（默认纯 Markdown）
3. 是否需要暗色模式（默认先不做）
4. 聊天入口是外链还是内嵌 iframe（默认外链引导）
5. 任务看板是否保留 Kanban 视图（默认保留）
