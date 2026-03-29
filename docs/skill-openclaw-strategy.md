# Skill / 工具 / OpenClaw 一体化方案

## 1. 结论先行

当前这套内容 **不需要重写**。

更准确地说：

- 已经完成的 `content-ops-platform` 可以继续作为“执行底座”使用
- 现有 Web 控制台可以继续作为“运营与人工确认界面”使用
- 新增一层 `skill` 或 OpenClaw Agent，用来承接“AI 生成内容 -> 选择风格 -> 排版 -> 进入草稿”这条高频链路

最推荐的路线不是二选一，而是：

`Skill / OpenClaw 负责智能决策`

`content-ops-platform 负责数据、任务、账号、发布执行`

---

## 2. 为什么现在不建议推倒重写

你现在已经有这几块可直接复用的资产：

### 2.1 已完成的后端能力

- 内容模型：`content_items` / `content_versions`
- 主题渲染：微信公众号 HTML 预览
- 账号配置：公众号账号管理、凭证加密
- 草稿执行：推送公众号草稿、任务状态跟踪、失败重试
- 平台抽象：已开始形成 adapter 结构

这些东西本身就是未来平台化必须要有的底座，不是临时代码。

### 2.2 已完成的前端能力

- 内容导入与版本管理
- 主题预览
- 账号管理
- 草稿任务中心

这套 Web 并不是废代码，它已经是未来“运营控制台”的 MVP。

### 2.3 已完成的文档设计

现有这些文档仍然有效：

- [implementation-plan.md](/D:/git/content-ops-platform/docs/implementation-plan.md)
- [module-breakdown.md](/D:/git/content-ops-platform/docs/module-breakdown.md)
- [adapters.md](/D:/git/content-ops-platform/docs/adapters.md)
- [database-schema.md](/D:/git/content-ops-platform/docs/database-schema.md)

它们不需要推翻，只需要补上“Agent / Skill / OpenClaw 接入层”。

---

## 3. Skill 和独立工具到底怎么分工

## 3.1 Skill 负责什么

Skill 更适合承接这些任务：

- 根据选题生成文章初稿
- 根据平台生成不同风格版本
- 自动选择排版模板
- 自动补标题、摘要、标签
- 调用平台 API 创建内容、渲染主题、发起草稿任务

Skill 的本质是：

- 更贴近你的个人工作流
- 更适合 AI 驱动
- 更适合挂在 Claude / Codex / OpenClaw 上

## 3.2 独立工具负责什么

独立工具更适合承接这些任务：

- 账号管理
- 内容版本管理
- 草稿任务追踪
- 发布记录审计
- 多平台适配
- 人工确认和失败重试
- 队列、调度、日志、权限

独立工具的本质是：

- 稳定执行层
- 数据中心
- 可视化管理后台

---

## 4. 推荐架构

推荐采用两层架构：

### 4.1 上层：Skill / OpenClaw Agent 层

职责：

- 接收自然语言任务
- 决定是生成、改写、排版还是发布
- 调用平台 API / MCP
- 处理 Prompt、风格、平台变体生成

可命名为：

- `content-agent-skill`
- `openclaw-content-agent`

### 4.2 下层：Content Ops Platform

职责：

- 存储内容与版本
- 存储主题
- 存储账号配置
- 执行渲染
- 执行草稿推送
- 记录任务状态与失败原因

这层就是当前 `content-ops-platform`。

---

## 5. 与 OpenClaw 的对接方式

不建议让 OpenClaw 直接操作数据库或直接写平台逻辑。

推荐方式：

### 5.1 OpenClaw 只调用统一 API / MCP

OpenClaw 调：

- `创建内容`
- `创建内容版本`
- `获取主题列表`
- `渲染预览`
- `获取账号列表`
- `创建草稿任务`
- `查询草稿状态`

### 5.2 Platform 负责真正执行

也就是：

- OpenClaw 不负责“怎么上传公众号素材”
- OpenClaw 不负责“怎么处理平台错误码”
- OpenClaw 不负责“怎么保存账号密钥”

这些全部由 `content-ops-platform` 负责。

这样后面接小红书、头条、抖音时，OpenClaw 不用重写，只换底层适配器。

---

## 6. 当前代码哪些继续用，哪些要重构

## 6.1 直接继续用

- `apps/api-server`
- `apps/web-admin`
- `prisma/schema.prisma`
- 微信草稿适配器
- 账号加密逻辑
- 内容/版本/草稿任务接口

这些都是有效资产。

## 6.2 建议重构但不必重写

### Worker 链路

现在很多逻辑还在 API 同步执行。

后续建议：

- API 只负责写任务
- Worker 真正负责执行推草稿、抓取、AI 生成、平台桥接

### 适配器拆包

当前平台能力还主要在 API 内。

后续建议拆成：

- `packages/adapter-sdk`
- `packages/platform-wechat`
- `packages/platform-xiaohongshu-bridge`

### AI 能力模块

当前还没完整接入 AI 生成。

建议新增：

- `packages/ai-orchestrator`

它负责：

- 生成标题
- 正文重写
- 多平台改写
- 风格模板选择

## 6.3 建议新增而不是修改太多

- `apps/worker`
- `packages/workflow-kernel`
- `packages/ai-orchestrator`
- `packages/source-connectors`
- `skills/content-pipeline-skill`

---

## 7. 推荐演进路径

## Phase 1：保留现有平台，补一个 Skill

目标：

- 让你自己先高频使用起来

Skill 执行链：

1. 输入主题或关键词
2. AI 生成 Markdown
3. 自动调用 `POST /api/content/import-markdown`
4. 自动选择主题
5. 自动调用 `/api/themes/render-preview`
6. 人工确认
7. 调用 `/api/drafts`

这个阶段最划算，见效最快。

## Phase 2：引入 Worker

目标：

- 把同步执行改成异步任务平台

重点：

- 草稿推送进 Worker
- AI 改写进 Worker
- 抓取进 Worker
- 失败重试、状态回写统一化

## Phase 3：接 OpenClaw

目标：

- 让 OpenClaw 成为上层编排器

OpenClaw 负责：

- 选题
- 抓取触发
- 内容生成
- 风格选择
- 排版决策
- 发布时机建议

Platform 负责：

- 持久化
- 账号
- 状态机
- 渠道适配

## Phase 4：多平台分发

目标：

- 公众号、小红书、头条、抖音统一内容底座

模式：

- 一份标准内容
- 多个平台版本
- 多个平台适配器

---

## 8. 最终推荐的目录形态

```text
apps/
  api-server
  web-admin
  worker

packages/
  content-core
  render-engine
  adapter-sdk
  workflow-kernel
  ai-orchestrator
  platform-wechat
  platform-xiaohongshu-bridge

skills/
  content-pipeline-skill
  platform-publish-skill
```

---

## 9. 对你当前问题的直接回答

### 问题 1：内容基本由 AI 生成，单独做工具是不是不如 Skill 实用？

答案：

短期是的，`skill` 更实用。

因为你当前主要矛盾不是“做个后台”，而是“把 AI 输出稳定变成可发布内容”。

### 问题 2：后期考虑接入 OpenClaw，怎么做更好？

答案：

把 OpenClaw 放在上层做 Agent 编排，不要让它直接承载平台执行细节。

### 问题 3：当前已经写的内容还可以用吗？

答案：

可以，**大部分都能继续用**。

不建议重写。

应该做的是：

- 保留现有平台
- 增加 Skill 层
- 补 Worker 层
- 后续再接 OpenClaw

---

## 10. 最终决策建议

一句话定案：

**现在不要重写，继续在现有 `content-ops-platform` 上演进；前面补 Skill，后面接 OpenClaw，底层平台继续做执行内核。**

这条路线兼顾：

- 你自己现在能马上用
- 后面能扩成完整产品
- 不会把现在已经写好的代码废掉

