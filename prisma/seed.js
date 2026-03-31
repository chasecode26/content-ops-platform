require("dotenv/config");

const { PlatformCode, PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { id: "user_local_default" },
    update: {},
    create: {
      id: "user_local_default",
      name: "Local User",
      email: "local@example.com",
    },
  });

  const themes = [
    {
      code: "wechat-tech-green",
      name: "科技简约风",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 1,
      tokens: {
        primaryColor: "#07c160",
        headingColor: "#0f172a",
        textColor: "#2b2b2b",
        backgroundColor: "#ffffff",
        borderColor: "#d9f7e8",
      },
      template: {
        layout: "card",
      },
      isActive: true,
    },
    {
      code: "wechat-minimal-light",
      name: "极简白底",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 1,
      tokens: {
        primaryColor: "#111111",
        headingColor: "#111111",
        textColor: "#303133",
        backgroundColor: "#ffffff",
        borderColor: "#ececec",
      },
      template: {
        layout: "minimal",
      },
      isActive: true,
    },
    {
      code: "wechat-dark-column",
      name: "深色专栏",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 1,
      tokens: {
        primaryColor: "#7dd3fc",
        headingColor: "#f8fafc",
        textColor: "#dbe4ee",
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
      },
      template: {
        layout: "column-dark",
      },
      isActive: true,
    },
  ];

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { code: theme.code },
      update: {
        name: theme.name,
        tokens: theme.tokens,
        template: theme.template,
        isActive: theme.isActive,
      },
      create: theme,
    });
  }

  await prisma.channelAccount.upsert({
    where: { id: "account_local_wechat" },
    update: {},
    create: {
      id: "account_local_wechat",
      userId: user.id,
      platform: PlatformCode.WECHAT_OFFICIAL,
      name: "Local WeChat Account",
      credentialCiphertext: Buffer.from(
        JSON.stringify({
          appId: "replace_me",
          appSecret: "replace_me",
        }),
      ).toString("base64"),
      meta: {
        author: "Local Author",
      },
    },
  });

  const account = await prisma.channelAccount.findUnique({
    where: { id: "account_local_wechat" },
  });
  const techGreen = await prisma.theme.findUnique({
    where: { code: "wechat-tech-green" },
  });
  const minimalLight = await prisma.theme.findUnique({
    where: { code: "wechat-minimal-light" },
  });

  const sampleContents = [
    {
      id: "content_sample_001",
      title: "如何用 AI 提升内容创作效率",
      summary: "探索 AI 工具在内容生产中的应用场景",
      slug: "ai-content-efficiency",
      status: "APPROVED",
      tags: ["AI", "内容创作"],
      versionNo: 2,
      markdownBody: `# 如何用 AI 提升内容创作效率

在内容创作领域，AI 正在改变我们的工作方式。

## 1. 选题与调研

利用 AI 快速分析热点话题和受众偏好，找到最佳切入点。

## 2. 大纲生成

通过对话式交互，让 AI 帮你梳理文章结构和逻辑脉络。

## 3. 初稿撰写

AI 可以根据大纲快速生成初稿，大幅缩短写作时间。

## 4. 润色与优化

最后阶段，人工精修 AI 生成内容，确保质量和风格统一。

---

*AI 不是替代创作者，而是放大创作者的能力边界。*`,
    },
    {
      id: "content_sample_002",
      title: "微信公众号排版最佳实践",
      summary: "从排版到推送，打造专业的内容发布流程",
      slug: "wechat-layout-best-practices",
      status: "READY_FOR_REVIEW",
      tags: ["微信", "排版"],
      versionNo: 1,
      markdownBody: `# 微信公众号排版最佳实践

好的排版能让文章阅读体验提升一个档次。

## 为什么排版重要

- 提升阅读完成率
- 增强品牌专业感
- 降低视觉疲劳

## 排版原则

### 留白

适当的行间距和段间距让内容呼吸。

### 色彩

主色不超过三种，保持视觉统一。

### 层级

标题层级清晰，读者能快速定位感兴趣的内容。

## 工具推荐

使用 Markdown + 渲染主题的方式，可以一键生成高质量排版。`,
    },
    {
      id: "content_sample_003",
      title: "2026 年内容运营趋势",
      summary: "多平台分发、数据驱动、AI 辅助",
      slug: "content-trends-2026",
      status: "DRAFT",
      tags: ["趋势", "运营"],
      versionNo: 1,
      markdownBody: `# 2026 年内容运营趋势

内容行业正在经历深刻变革。

## 关键趋势

### 一稿多发

从单一平台到全平台分发，内容利用率大幅提升。

### 数据驱动

通过数据分析指导选题和发布策略。

### AI 辅助创作

AI 在选题、写作、排版、分发各环节发挥作用。

### 私域运营

公众号、小程序、社群形成闭环。

---

*把握趋势，才能在内容赛道保持竞争力。*`,
    },
  ];

  for (const c of sampleContents) {
    await prisma.contentItem.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        userId: user.id,
        title: c.title,
        summary: c.summary,
        slug: c.slug,
        sourceType: "MARKDOWN",
        status: c.status,
        tags: c.tags,
        versions: {
          create: {
            versionNo: c.versionNo,
            title: c.title,
            summary: c.summary,
            markdownBody: c.markdownBody,
          },
        },
      },
    });
  }

  const content1 = await prisma.contentItem.findUnique({
    where: { id: "content_sample_001" },
  });
  const content2 = await prisma.contentItem.findUnique({
    where: { id: "content_sample_002" },
  });

  const sampleDrafts = [
    {
      id: "draft_sample_001",
      contentItemId: "content_sample_001",
      channelAccountId: account.id,
      themeId: techGreen.id,
      status: "UPDATED",
      platformDraftId: "wechat_draft_001",
      renderedHtml: "<h1>如何用 AI 提升内容创作效率</h1><p>渲染后的 HTML 内容...</p>",
    },
    {
      id: "draft_sample_002",
      contentItemId: "content_sample_002",
      channelAccountId: account.id,
      themeId: minimalLight.id,
      status: "CREATED",
      platformDraftId: "wechat_draft_002",
      renderedHtml: "<h1>微信公众号排版最佳实践</h1><p>渲染后的 HTML 内容...</p>",
    },
  ];

  for (const d of sampleDrafts) {
    await prisma.draftRecord.upsert({
      where: { id: d.id },
      update: {},
      create: d,
    });
  }

  const sampleJobs = [
    {
      id: "job_sample_001",
      contentItemId: "content_sample_001",
      channelAccountId: account.id,
      status: "DRAFTED",
      startedAt: new Date(Date.now() - 3600000),
      finishedAt: new Date(Date.now() - 1800000),
      attemptCount: 1,
    },
    {
      id: "job_sample_002",
      contentItemId: "content_sample_002",
      channelAccountId: account.id,
      status: "PUSHING",
      startedAt: new Date(Date.now() - 600000),
      attemptCount: 1,
    },
    {
      id: "job_sample_003",
      contentItemId: "content_sample_001",
      channelAccountId: account.id,
      status: "FAILED",
      startedAt: new Date(Date.now() - 7200000),
      finishedAt: new Date(Date.now() - 7100000),
      attemptCount: 2,
      errorMessage: "推送超时，请重试",
    },
  ];

  for (const j of sampleJobs) {
    await prisma.publishJob.upsert({
      where: { id: j.id },
      update: {},
      create: j,
    });
  }

  console.log("Sample data seeded successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
