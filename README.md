# Content Ops Platform

AI 驱动的多平台内容工作台 -- 以「母稿」为源，模板为型，聊天为口，发布为果。

核心特征：

- **母稿机制** -- 一份母稿（Master Draft）是所有平台内容的唯一来源，支持 AI 改写与人工编辑双路径
- **模板系统** -- 模板分「生成模板」（AI Prompt + 风格变体选择）和「渲染主题」（CSS + 排版规则），解耦内容与呈现
- **聊天入口 + Web 确认** -- 支持 Skill/Agent 对话式创作快速出稿，保留 Web 控制台用于人工精校与批量管理
- **平台派生** -- 从母稿按目标平台自动生成专属变体（小红书卡片、CSDN 博文、公众号图文等）
- **草稿推送** -- 一键推送目标平台草稿，保留人工确认关口与失败重试

## 为什么存在

当前流程存在三个明显痛点：

- 每篇文章都要手工从 Markdown 转 HTML，再复制到公众号后台
- 每次排版靠人工调整，风格不稳定，复用成本高
- 一旦要扩展到多平台，现有流程几乎无法复用

这个项目的目标不是单纯做一个格式转换工具，而是建设一条完整的内容流水线：

`聊天/导入 → 母稿生成 → AI 改写/人工编辑 → 母稿确认 → 平台派生 → 渲染主题 → 草稿推送/发布 → 状态追踪`

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
- 生成模板与渲染主题解耦，各自独立演进

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
│   ├── workflow-kernel/
│   │   └── src/
│   ├── ai-orchestrator/
│   │   └── src/
│   ├── template-engine/
│   │   └── src/
│   └── platform-variant-service/
│       └── src/
├── prisma/
│   └── schema.prisma
└── docs/
```

## 核心职责

这个系统要做的：

- 统一管理母稿、模板、平台账号和发布任务
- 母稿作为所有平台内容的唯一来源，支持多版本快照
- 通过生成模板和渲染主题的拆分，解耦内容风格与视觉排版
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
- [docs/web-console-ui-design.md](./docs/web-console-ui-design.md)：Web 控制台 UI 设计
- [docs/roadmap.md](./docs/roadmap.md)：MVP 到多平台演进路线
- [docs/implementation-plan.md](./docs/implementation-plan.md)：接口级、页面级、表级开发清单
- [docs/api-spec.md](./docs/api-spec.md)：MVP API 设计与错误码规范

## 本地启动

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

- 母稿创建（导入 Markdown 或聊天入口 AI 生成）
- 母稿确认与版本管理
- 选择渲染主题生成微信公众号 HTML 预览
- 自动推送至公众号草稿箱
- 保存推送记录与失败日志

## 后续方向

- 生成模板系统（AI Prompt + 变体矩阵）
- 平台派生版本（小红书 / CSDN / 抖音）
- 一稿多发 + 任务编排
- 聊天入口完整打通
- 数据回收与效果追踪
