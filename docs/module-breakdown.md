# 模块拆分

## 1. 应用层

### `apps/web-admin`

职责：

- 管理母稿、主题、平台账号
- 渲染预览与人工确认
- 查看发布任务和错误日志
- 发起抓取、生成、排版、推送动作

主要页面：

- 创作台（首页，母稿编辑与创建）
- 内容库（母稿列表与派生版本管理）
- 模板中心
- 任务中心
- 账号管理

### `apps/api-server`

职责：

- 提供 REST API
- 管理认证、母稿、主题、平台账号、发布任务、派生版本
- 将耗时操作投递到队列
- 汇总平台状态与执行日志

### `apps/worker`

职责：

- 抓取网页/RSS
- 调用 AI 生成和改写
- 进行 Markdown 渲染与平台格式转换
- 执行平台草稿推送与发布
- 回写任务状态与错误日志

### `apps/skill-gateway`

职责：

- Skill / OpenClaw 接入层，处理自然语言请求
- 映射为 REST API 调用
- 返回结构化结果（预览、确认提示、任务状态）
- 作为一等接入层，连接用户与内容平台

## 2. 共享包

### `packages/content-core`

职责：

- 定义领域模型：母稿（Master Draft）、平台派生版本、内容实体
- 母稿-派生版本（1:N）关系
- 母稿状态机与版本快照
- 处理 frontmatter、标签、摘要、slug
- 做内容清洗与标准化

### `packages/render-engine`

职责：

- Markdown AST 解析
- 主题 Token 系统
- 生成微信公众号 HTML
- 后续扩展小红书图文卡片、抖音脚本文本等

### `packages/adapter-sdk`

职责：

- 定义平台适配器接口
- 统一任务结果结构
- 定义平台能力枚举和异常模型

### `packages/workflow-kernel`

职责：

- 编排抓取、生成、审核、渲染、推送步骤
- 生成工作流运行记录
- 处理重试、超时和人工确认关口

### `packages/ai-orchestrator`

职责：

- AI Provider 路由（OpenAI / Claude / 兼容模型）
- Prompt 模板管理与版本控制
- 风格变体生成（不同 tone、length、structure）
- 生成结果评估与降级策略

### `packages/template-engine`

职责：

- **生成模板层**：AI Prompt 模板 + 风格参数矩阵（生成阶段用）
- **渲染主题层**：CSS 规则 + 排版 Token 系统（渲染阶段用）
- 模板与主题解绑：同一母稿可用不同生成模板产生不同内容风格，用不同渲染主题产生不同视觉呈现
- 在线模板管理与实时预览

### `packages/platform-variant-service`

职责：

- 从母稿派生平台专属变体（长度/格式/标签映射）
- 平台规则引擎：各平台内容限制、标签映射规则、格式转换规则
- 变体生命周期：待生成 -> 已生成 -> 已确认 -> 已发布
- 一稿多发任务编排

## 3. 后续扩展包

建议后续增加：

- `packages/source-connectors`
- `packages/platform-wechat`
- `packages/platform-xiaohongshu-bridge`
- `packages/platform-douyin`
- `packages/platform-csdn`

## 4. 依赖方向

```text
web-admin -> api-server
skill-gateway -> api-server
api-server -> workflow-kernel
api-server -> template-engine
api-server -> ai-orchestrator
api-server -> platform-variant-service
api-server -> adapter-sdk
worker -> workflow-kernel
worker -> template-engine
worker -> ai-orchestrator
worker -> render-engine
worker -> content-core
worker -> adapter-sdk
platform-variant-service -> adapter-sdk
platform adapters -> adapter-sdk
```

约束：

- `skill-gateway` 不直接访问数据库，必须走 `api-server`
- `web-admin` 不直接依赖平台 SDK
- `render-engine` 不依赖具体平台账号实现
- `workflow-kernel` 不直接包含平台细节，只调适配器接口
- `ai-orchestrator` 不依赖具体平台适配器

## 5. 拆分原因

- 内容处理、渲染和平台接入变化频率不同，必须解耦
- 生成模板与渲染主题属于两个不同抽象层，拆分后各自独立演进
- 小红书这类浏览器自动化适配器稳定性较差，不能污染主业务
- 母稿是一等公民，所有平台内容从母稿派生，不再独立创建
- Skill 作为一等接入层，需要独立的语言处理和交互逻辑，与执行层隔离
