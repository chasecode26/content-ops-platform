# 模块拆分

## 1. 应用层

### `apps/web-admin`

职责：

- 管理稿件、主题、平台账号
- 渲染预览与人工确认
- 查看发布任务和错误日志
- 发起抓取、生成、排版、推送动作

主要页面：

- 内容列表
- 内容编辑/导入
- 主题预览
- 渠道账号管理
- 发布中心
- 工作流执行记录

### `apps/api-server`

职责：

- 提供 REST API
- 管理认证、内容、主题、平台账号、发布任务
- 将耗时操作投递到队列
- 汇总平台状态与执行日志

### `apps/worker`

职责：

- 抓取网页/RSS
- 调用 AI 生成和改写
- 进行 Markdown 渲染与平台格式转换
- 执行平台草稿推送与发布
- 回写任务状态与错误日志

## 2. 共享包

### `packages/content-core`

职责：

- 定义领域模型
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

## 3. 后续扩展包

建议后续增加：

- `packages/source-connectors`
- `packages/ai-orchestrator`
- `packages/platform-wechat`
- `packages/platform-xiaohongshu-bridge`
- `packages/platform-douyin`

## 4. 依赖方向

```text
web-admin -> api-server
api-server -> workflow-kernel
api-server -> adapter-sdk
worker -> workflow-kernel
worker -> render-engine
worker -> content-core
worker -> adapter-sdk
platform adapters -> adapter-sdk
```

约束：

- `web-admin` 不直接依赖平台 SDK
- `render-engine` 不依赖具体平台账号实现
- `workflow-kernel` 不直接包含平台细节，只调适配器接口

## 5. 拆分原因

- 内容处理、渲染和平台接入变化频率不同，必须解耦
- 小红书这类浏览器自动化适配器稳定性较差，不能污染主业务
- 后续若要把 AI 生成拆成独立 worker，不应该影响渲染与分发主链
