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
      name: "科技蓝卡片风",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 2,
      tokens: {
        primaryColor: "#1d4ed8",
        accentColor: "#0f3d91",
        headingColor: "#0f172a",
        textColor: "#1f2937",
        backgroundColor: "#ffffff",
        surfaceColor: "#f7fbff",
        softBackground: "#e8f1ff",
        borderColor: "#d9e7ff",
        mutedColor: "#5b6472",
        codeBackground: "#0f172a",
      },
      template: { layout: "hero-card" },
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
        mutedColor: "#6b7280",
        codeBackground: "#f8f8f8",
      },
      template: { layout: "minimal" },
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
        mutedColor: "#94a3b8",
        codeBackground: "#111827",
      },
      template: { layout: "column-dark" },
      isActive: true,
    },
    {
      code: "wechat-superpowers-green",
      name: "森绿长文风",
      targetPlatform: PlatformCode.WECHAT_OFFICIAL,
      version: 1,
      tokens: {
        primaryColor: "#07c160",
        accentColor: "#06ad56",
        headingColor: "#11703f",
        textColor: "#111111",
        backgroundColor: "#ffffff",
        surfaceColor: "#f8fff9",
        softBackground: "#e8f7f0",
        borderColor: "#cfeedd",
        mutedColor: "#5f6b63",
        codeBackground: "#0b1020",
      },
      template: { layout: "superpowers-green" },
      isActive: true,
    },
  ];

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { code: theme.code },
      update: {
        name: theme.name,
        version: theme.version,
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

  const account = await prisma.channelAccount.findUnique({ where: { id: "account_local_wechat" } });
  const techGreen = await prisma.theme.findUnique({ where: { code: "wechat-tech-green" } });
  const minimalLight = await prisma.theme.findUnique({ where: { code: "wechat-minimal-light" } });

  const sampleContents = [
    {
      id: "content_sample_001",
      title: "如何用 AI 提升内容创作效率",
      summary: "探索 AI 工具在内容生产中的应用场景",
      slug: "ai-content-efficiency",
      status: "APPROVED",
      tags: ["AI", "内容创作"],
      versionNo: 2,
      markdownBody: `# 如何用 AI 提升内容创作效率\n\n在内容创作这件事上，AI 已经不是锦上添花，而是能真正缩短准备时间的生产工具。\n\n## 1. 选题和拆解\n\n先用 AI 快速列出用户关心的问题，再反向拆出文章骨架。\n\n## 2. 初稿生成\n\n把核心观点、案例、语气要求一次交给模型，让它先给你一个可以编辑的草稿。\n\n> 不要把 AI 当成代写机，更适合把它当成高响应的协作编辑。\n\n## 3. 二次润色\n\n把你的经验、数据和真实观察补进去，文章就会从“能看”变成“可信”。`,
    },
    {
      id: "content_sample_002",
      title: "微信公众号排版最佳实践",
      summary: "从排版到推送，打造专业的内容发布流程",
      slug: "wechat-layout-best-practices",
      status: "READY_FOR_REVIEW",
      tags: ["微信", "排版"],
      versionNo: 1,
      markdownBody: `# 微信公众号排版最佳实践\n\n好的排版会让内容显得更稳，也更容易被读完。\n\n## 留白\n\n段落、模块和标题之间要有呼吸感，别把内容压成一堵墙。\n\n## 层级\n\n标题、正文、引用、代码块都要有清晰分工，读者才能快速扫读。\n\n## 风格统一\n\n颜色、圆角、边框、标签语气要统一，不然会像拼装页面。`,
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
    await prisma.draftRecord.upsert({ where: { id: d.id }, update: {}, create: d });
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

