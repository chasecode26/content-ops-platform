# Web 控制台 UI 设计稿（先设计后开发）

## 1. 设计目标

- 面向内容运营的单人/小团队后台，优先解决“配置账号 -> 导入内容 -> 预览排版 -> 推送草稿”闭环。
- 风格简约、克制、可读性优先，不走花哨视觉。
- 响应式布局，支持 Desktop / Tablet / Mobile 自适应。

---

## 2. 信息架构（IA）

主导航（左侧栏 / 移动端底部 Tab）：

1. 概览（Dashboard）
2. 内容（Content）
3. 主题预览（Themes）
4. 账号（Accounts）
5. 草稿任务（Drafts）

全局能力：

- 全局搜索（按标题、状态、账号名）
- 全局状态提示（API健康、发布结果）
- 用户上下文（默认 `x-user-id`）

---

## 3. 页面设计

## 3.1 Dashboard（概览）

目标：快速看到“今天是否可发稿”。

模块：

- 4 个状态卡片：内容数、账号数、今日草稿数、失败任务数
- 最近 10 条发布任务（状态色：成功/失败/进行中）
- 快捷入口：`导入Markdown`、`新建草稿`

移动端：

- 卡片两列变单列
- 表格降级为时间线列表

## 3.2 Content（内容管理）

模块：

- 顶部筛选：标题搜索、标签、分页
- 内容列表：标题、更新时间、版本数
- 侧边抽屉：版本列表 + “设为草稿来源”
- 操作：导入 Markdown、创建新版本

交互：

- 导入成功后自动跳转该内容详情并高亮最新版本

## 3.3 Themes（主题预览）

模块：

- 左侧：主题选择、平台选择
- 中间：Markdown 输入区
- 右侧：HTML 预览（桌面）/ 折叠预览（移动）
- 操作：复制 HTML、保存为当前草稿主题

交互：

- 输入防抖 500ms 自动渲染

## 3.4 Accounts（账号管理）

模块：

- 账号列表：名称、平台、状态、作者、更新时间
- 新建/编辑弹窗：`appId`、`appSecret`、`author`、`defaultThumbMediaId`
- 凭证显示：仅显示脱敏字段（`appIdMasked`、`appSecretMasked`）
- 操作：校验账号、启用/停用

安全约束：

- 前端不展示明文秘钥
- 编辑时支持“仅更新秘钥”与“保留原秘钥”

## 3.5 Drafts（草稿任务）

模块：

- 新建草稿表单：内容版本、账号、主题、平台
- 任务列表：状态、创建时间、错误信息、平台草稿ID
- 详情抽屉：发布链路详情 + 错误栈摘要

交互：

- 创建后立即轮询任务状态（2s间隔，最多60s）
- 失败时给出一键重试（复用同参数）

---

## 4. 响应式布局规范

断点：

- `>=1200px`: Desktop（左侧固定导航 + 三栏内容）
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

## 5. 视觉风格（简约版）

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

## 6. 组件清单（MVP）

1. `AppShell`（导航 + 顶栏 + 内容区）
2. `StatCard`
3. `DataTable`（支持移动端卡片模式）
4. `FormDrawer / FormDialog`
5. `MarkdownEditor`
6. `HtmlPreviewPane`
7. `StatusBadge`
8. `JobTimeline`
9. `EmptyState / ErrorState`

---

## 7. API 对接映射

- 概览：
  - `GET /api/health`
  - `GET /api/drafts?page=1&pageSize=10`
- 内容：
  - `POST /api/content/import-markdown`
  - `GET /api/content`
  - `POST /api/content/:contentId/versions`
- 主题：
  - `GET /api/themes?platform=WECHAT_OFFICIAL`
  - `POST /api/themes/render-preview`
- 账号：
  - `GET /api/channel-accounts`
  - `POST /api/channel-accounts`
  - `PATCH /api/channel-accounts/:accountId`
  - `POST /api/channel-accounts/:accountId/validate`
- 草稿：
  - `POST /api/drafts`
  - `GET /api/drafts`
  - `GET /api/drafts/:publishJobId`

---

## 8. 前端技术建议（不开发，仅定稿）

- 框架：Vue 3 + TypeScript + Vite
- UI：`Naive UI` 或 `Element Plus`（二选一，推荐 Naive UI，主题定制更轻）
- 状态管理：`Pinia`
- 请求层：`Axios` + 统一错误拦截
- 路由：`Vue Router`（按模块懒加载）
- 样式：CSS Variables + 少量原子类

---

## 9. 开发前确认清单

1. UI 组件库二选一（Naive UI / Element Plus）
2. 是否保留“移动端底部 Tab”交互
3. 是否需要暗色模式（默认先不做）
4. 是否加入“草稿自动刷新”开关（默认开启）

