# Content Ops Platform

一个面向个人创作者与小团队的内容生产、排版与多平台分发系统。

当前优先解决的问题：

- 将 Markdown 稿件稳定转换为统一风格的微信公众号 HTML
- 支持主题化排版与草稿预览
- 将文章自动推送到公众号草稿箱
- 为后续接入小红书、抖音、今日头条预留统一的适配器层
- 为后续接入自动抓取、AI 生成、定时发布预留完整工作流

## 为什么存在

当前流程存在三个明显痛点：

- 每篇文章都要手工从 Markdown 转 HTML，再复制到公众号后台
- 每次排版靠人工调整，风格不稳定，复用成本高
- 一旦要扩展到多平台，现有流程几乎无法复用

这个项目的目标不是单纯做一个格式转换工具，而是建设一条完整的内容流水线：

`输入内容 -> AI 优化 -> 主题渲染 -> 平台适配 -> 草稿推送/发布 -> 状态追踪`

## 技术选型

- 前端：Vue 3 + TypeScript + Vite
- 后端：NestJS
- 数据库：PostgreSQL
- ORM：Prisma
- 队列：BullMQ + Redis
- 浏览器自动化：Playwright
- Markdown 渲染：remark + rehype + unified
- AI 接入：Provider Adapter（OpenAI / Claude / 兼容模型）

技术选型原则：

- 主系统统一使用 TypeScript，降低维护复杂度
- 平台接入统一走 Adapter 模式，避免业务逻辑被平台细节污染
- 小红书初期允许通过独立浏览器自动化桥接服务接入

## 目录结构

```text
content-ops-platform/
├── README.md
├── DESIGN.md
├── .gitignore
├── pnpm-workspace.yaml
├── apps/
│   ├── web-admin/
│   │   └── src/
│   ├── api-server/
│   │   └── src/
│   └── worker/
│       └── src/
├── packages/
│   ├── adapter-sdk/
│   │   └── src/
│   ├── content-core/
│   │   └── src/
│   ├── render-engine/
│   │   └── src/
│   └── workflow-kernel/
│       └── src/
├── prisma/
│   └── schema.prisma
├── docs/
│   ├── database-schema.md
│   ├── module-breakdown.md
│   ├── adapters.md
│   └── roadmap.md
└── tests/
```

## 核心职责

这个系统要做的：

- 统一管理内容、主题、平台账号和发布任务
- 对 Markdown 输入进行结构化处理
- 支持按主题渲染为公众号 HTML
- 对接不同平台的草稿与发布流程
- 记录每一次内容生成、渲染与发布的执行状态

这个系统当前不做的：

- 不做复杂团队权限系统
- 不做公域爆文推荐算法
- 不做视频重剪辑与复杂音视频后处理
- 不在第一阶段追求所有平台直发

## 文档索引

- [DESIGN.md](./DESIGN.md)：总体架构设计与关键决策
- [docs/database-schema.md](./docs/database-schema.md)：数据模型与表结构设计
- [docs/module-breakdown.md](./docs/module-breakdown.md)：模块拆分与职责边界
- [docs/adapters.md](./docs/adapters.md)：适配器接口与平台差异定义
- [docs/roadmap.md](./docs/roadmap.md)：MVP 到多平台演进路线
- [docs/implementation-plan.md](./docs/implementation-plan.md)：接口级、页面级、表级开发清单
- [docs/api-spec.md](./docs/api-spec.md)：MVP API 设计与错误码规范

## 本地启动（API + Prisma）

前置：

- Node.js 18+
- pnpm
- PostgreSQL（监听 `localhost:5432`）

环境变量：

- 复制 `.env.example` 为 `.env`
- 确认 `DATABASE_URL` 指向可访问的 PostgreSQL

初始化步骤：

```bash
pnpm install
pnpm db:generate
pnpm db:migrate -- --name init
pnpm db:seed
```

启动 API：

```bash
pnpm dev:api
```

一键本地启动（推荐）：

```powershell
pnpm dev:local
```

`dev:local` 会自动执行：
- 检查 Node 可用性
- 检查 PostgreSQL 5432 端口
- `db:generate`
- `db:deploy`
- `db:seed`
- 启动 API

微信草稿适配器模式：

- `WECHAT_DRAFT_ADAPTER=fake`：本地 mock（默认，稳定可跑）
- `WECHAT_DRAFT_ADAPTER=api`：调用微信 `token + draft/add` 最小链路

`api` 模式下渠道账号要求：

- `credentials.appId`
- `credentials.appSecret`
- `meta.defaultThumbMediaId`（可选，若不填将自动上传内置封面图）
- `meta.author`（可选）

如果你已完成迁移，只想快速启动，可用：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-local.ps1 -SkipDbDeploy
```

接口冒烟（自动启动 API 并执行导入/预览/草稿链路）：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-api.ps1
```

常用脚本（根目录）：

- `pnpm db:generate`：生成 Prisma Client
- `pnpm db:migrate -- --name init`：执行开发迁移
- `pnpm db:deploy`：执行已有迁移（部署环境）
- `pnpm db:seed`：写入默认用户、主题、测试账号
- `pnpm dev:api`：启动 Nest API

说明：

- 已生成初始 SQL 迁移文件：`prisma/migrations/20260327230000_init/migration.sql`
- 若启动时报 `P1001`，表示数据库未启动或连接信息错误

## 第一阶段交付范围

MVP 仅覆盖：

- 本地导入 Markdown
- 选择排版主题
- 生成微信公众号 HTML 预览
- 自动推送至公众号草稿箱
- 保存推送记录与失败日志

## 后续方向

- URL/RSS/关键词抓取
- AI 自动生成初稿与多平台改写
- 小红书自动发布桥接
- 抖音图文/视频内容适配
- 多账号定时发布与数据回收
